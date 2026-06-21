const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { generateQuestions, evaluateAnswers } = require("../config/gemini");
const user = require("../models/user");
const { Assessment } = require("../models/assessment");

const assessmentRouter = express.Router();

assessmentRouter.get("/assessment/history", userAuth, async (req, res) => {

    const loggedInUserId = req.user._id;

    try {

        const assessmentHistory = await Assessment.find({ participants: loggedInUserId }).lean();
        return res.json({ message: "Assessment history fetched successfully!", assessmentHistory });

    } catch(err) {
        res.status(400).json({ message: err.message });
    }
});

assessmentRouter.post("/assessment/generate", userAuth, async (req, res) => {
  const user = req.user;
  const loggedInUserId = user._id;
  const userPrompt = req.body.prompt;

  try {
    if (!userPrompt || userPrompt.length > 1000) {
      throw new Error(
        "Prompt cannot be empty or more than 1000 characters long",
      );
    }

    let today = new Date();
    if (user.lastPromptSentAt.toDateString() !== today.toDateString()) {
      user.lastPromptSentAt = today;
      user.aiUsage = 0;
      await user.save();
    }

    if (Number(user.aiUsage) >= 5) {
      throw new Error(
        "You've used all your daily AI credits! Your quota resets tomorrow.",
      );
    };

    let responseText = await generateQuestions(userPrompt);
    response = JSON.parse(responseText);
    user.aiUsage++;
    user.lastPromptSentAt = today;
    await user.save();
    if (
      !response.success ||
      !Array.isArray(response.questions) ||
      response.questions.length === 0 ||
      response.questions.length > 20
    ) {
      throw new Error(response.message || "Invalid assessment generated");
    }

    const questions = response.questions.map((question) => ({
      ...question,
      answeredBy: null,
      answerText: "",
      score: null,
      feedback: "",
    }));

    const assessment = new Assessment({
      prompt: userPrompt,
      createdBy: loggedInUserId,
      status: "ready",
      participants: [loggedInUserId],
      questions
    });

    const savedAssessment = await assessment.save();

    const { questions: questionsList, ...assessmentMetadata } = assessment.toJSON();


    return res.json({ assessment: assessmentMetadata });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

assessmentRouter.get("/assessment/:id", userAuth, async (req, res) => {

    const loggedInUserId = req.user._id;
    const assessmentId = req.params.id;

    try {

        const assessment = await Assessment.findOne({ _id: assessmentId, participants: loggedInUserId }).lean();  // $in is not needed if there is   only one lookup value

        if(!assessment) {
            throw new Error("You don't have access to this assessment.");
        };

        return res.json({assessment});

    } catch (err) {
        res.status(400).json({message: err.message})
    }
});

assessmentRouter.post("/assessment/submit/:id", userAuth, async (req, res) => {
    try {

        const loggedInUserId = req.user._id;
        const assessmentId = req.params.id;

        const answers = req.body?.answers;

        const assessment = await Assessment.findOne({ _id: assessmentId, participants: loggedInUserId });
        if(!assessment) {
            throw new Error("You don't have access to this assessment");
        };

        if(!(assessment.status === "ready")) {
            throw new Error("This assessment is already submitted");
        };

        if(!Array.isArray(answers) || answers.length === 0) {
            throw new Error("Invalid answers submission");
        };

        const isAnswersValid = answers.some((answer) => answer.answerText);

        if(!isAnswersValid) {
            throw new Error("None of the questions are answered");
        };

        
        const answerMap = new Map(answers.map((answer) => [answer.questionNumber, answer]));

        assessment.questions.forEach((question) => {
            const answeredQuestion = answerMap.get(question.questionNumber);
            question.answeredBy = answeredQuestion?.answeredBy || null;
            question.answerText = answeredQuestion?.answerText || "No answer provided";
            question.score = null;
            question.feedback = "";
        });

        await assessment.save();

        const questionsForEvaluation = assessment.toJSON().questions;
        const aiEvaluationInput = JSON.stringify(questionsForEvaluation, null, 2);
        const evaluatedAnswersText = await evaluateAnswers(aiEvaluationInput);
        const evaluatedAnswers = JSON.parse(evaluatedAnswersText);
        if(!evaluatedAnswers.overallScore && evaluatedAnswers.overallScore !== 0) {
            throw new Error("Invalid evaluated response");
        };
        if(!Array.isArray(evaluatedAnswers.questions)) {
            throw new Error("Invalid evaluation response");
        };
        if(evaluatedAnswers.questions.length !== assessment.questions.length) {
            throw new Error("Question count mismatch");
        };

        const evaluatedAnswersMap = new Map(evaluatedAnswers.questions.map((question) => [question.questionNumber, question]));

        assessment.questions.forEach((question) => {
            const evaluatedAnswer = evaluatedAnswersMap.get(question.questionNumber);
            question.score = evaluatedAnswer.score;
            question.feedback = evaluatedAnswer.feedback;
        });

        assessment.overallScore = evaluatedAnswers.overallScore;
        assessment.overallFeedback.strengths = evaluatedAnswers.overallFeedback.strengths;
        assessment.overallFeedback.improvements = evaluatedAnswers.overallFeedback.improvements;

        assessment.status = "submitted";
        const savedAssessment = await assessment.save();
        const {questions, overallScore, overallFeedback, ...assessmentMetadata} = savedAssessment.toJSON();

        return res.json({message: "Submitted the assessment successfully!", assessment: assessmentMetadata});

    } catch (err) {
        res.status(400).json({message: err.message});
    }
});

assessmentRouter.get("/assessment/report/:id", userAuth, async (req, res) => {

    const loggedInUserId = req.user._id;
    const assessmentId = req.params.id;

    try {

        const assessment = await Assessment.findOne({ _id: assessmentId, participants: loggedInUserId }).lean();

        if(!assessment) {
            throw new Error("You don't have access to this assessment");
        };
        if(assessment.status !== "submitted") {
            throw new Error("Assessment has not been submitted yet");
        };

        return res.json({ message: "Report fetched successfully!", assessment });

    } catch (err) {
        res.status(400).json({ message: err.message })
    }
});

module.exports = assessmentRouter;

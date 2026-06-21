const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateResponse = async (messages) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction: `
            
            Respond using markdown.

Use:
- headings
- bullet points
- numbered lists
- fenced code blocks
- tables when useful

Avoid raw HTML.

            `,
      },
    });
    return response.text;
  } catch (err) {
    throw new Error(err.message);
  }
};

const generateQuestions = async (userPrompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: `You are an assessment generation engine.

Your task is to generate a quiz assessment based on the user's request.

Rules:

1. The user's request must clearly indicate an intention to generate a quiz, assessment, test, interview questions, practice questions, MCQs, descriptive questions, or knowledge evaluation.

2. If the user's request does NOT indicate an assessment-generation intent, return:

{
  "success": false,
  "message": "The prompt does not appear to request an assessment."
}

3. Respect the number of questions requested by the user.

4. Never generate more than 20 questions.

5. If the user does not specify the number of questions, generate 10 questions.

6. Generate a mixture of MCQ and descriptive questions whenever appropriate.

7. Each question must contain:
   - questionNumber
   - questionStatement
   - questionType
   - options

8. For descriptive questions, options must be an empty array.

9. questionType must be either:
   - "mcq"
   - "descriptive"

10. Return ONLY valid JSON.

11. Do not wrap the JSON in markdown.

12. Do not include explanations, notes, or any text outside the JSON.

Output Format:

{
  "success": true,
  "questions": [
    {
      "questionNumber": 1,
      "questionStatement": "What is a JavaScript Promise?",
      "questionType": "descriptive",
      "options": []
    },
    {
      "questionNumber": 2,
      "questionStatement": "Which method handles a fulfilled Promise?",
      "questionType": "mcq",
      "options": [
        ".then()",
        ".catch()",
        ".finally()",
        ".await()"
      ]
    }
  ]
}

User Request:
${userPrompt}`,
      },
    });
    return response.text;
  } catch (err) {
    throw new Error(err.message);
  }
};

const evaluateAnswers = async (answers) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Questions:
${answers}`,
      config: {
        systemInstruction: `You are an expert technical interviewer and assessment evaluator.

You will receive an array of questions.

Each question contains:
- questionNumber
- questionStatement
- questionType
- options
- answerText

Your task:

1. Evaluate every answer independently.
2. Assign a score between 0 and 10.
3. Generate concise and actionable feedback.
4. If answerText is:
   - Empty
   - Null
   - Undefined
   - "No answer provided"

   Then:
   - Score = 0
   - Feedback = "Question was not attempted."

5. If the answer is unrelated to the question, assign a low score and explain why.

6. Do not be overly generous.
7. Reward partial knowledge appropriately.
8. Evaluate technical correctness, completeness, clarity and depth.

9. Calculate an overallScore out of 10.

10. Generate:
    - strengths
    - improvements

11. Return ONLY valid JSON.

12. Do not return markdown.

13. Do not return explanations outside the JSON.

Output Format:

{
  "overallScore": Number,
  "overallFeedback": {
    "strengths": [String],
    "improvements": [String]
  },
  "questions": [
    {
      "questionNumber": Number,
      "score": Number,
      "feedback": String
    }
  ]
}`,
      },
    });
    return response.text;
  } catch (err) {
    throw new Error(err.message)
  }
}

module.exports = { generateResponse, generateQuestions, evaluateAnswers };

const express = require('express');
const { userAuth } = require('../middlewares/auth');
const { Assessment } = require('../models/assessment');

const dashboardRouter = express.Router();


dashboardRouter.get("/dashboard", userAuth, async (req,res) => {
    const loggedInUserId = req.user._id;
    try {

        const dashboardData = {
            metrics : {
                avgScore: 0,
                totalCompleted: 0,
                highestScore: 0,
                pending: 0
            },
            performanceTrend : [],
            recentAssessments : []
        }

        const myAssessments = await Assessment.find({ participants: loggedInUserId }).sort({ updatedAt: -1 }).select("overallScore prompt createdBy status updatedAt").lean();

        const pendingAssessments = myAssessments.filter((assessment) => assessment.status === "ready");
        const submittedAssessments = myAssessments.filter((assessment) => assessment.status === "submitted");

        const totalScore = submittedAssessments.reduce((accumulator, currentAssessment) => {
            return accumulator + currentAssessment.overallScore;
        }, 0);

        const totalSubmittedAssessments = submittedAssessments.length;
        if(totalSubmittedAssessments) {
            dashboardData.metrics.totalCompleted = submittedAssessments.length;
            dashboardData.metrics.avgScore = totalScore/totalSubmittedAssessments;
        }

        dashboardData.metrics.highestScore = submittedAssessments.length > 0 ? Math.max(...submittedAssessments.map((assessment) => assessment.overallScore)) : 0;

        dashboardData.metrics.pending = pendingAssessments.length;

        const lastTenSubmittedAssessments = submittedAssessments.slice(0, 10).reverse();

        dashboardData.performanceTrend = lastTenSubmittedAssessments.map((assessment) => assessment.overallScore);

        dashboardData.recentAssessments = myAssessments.slice(0,10);

        return res.json({ message: "Dashboard data fetched successfully", dashboard: dashboardData });

    } catch (err) {
        res.status(400).json({message: err.message});
    }
})


module.exports = dashboardRouter;
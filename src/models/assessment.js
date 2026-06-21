const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    prompt : {
        type: String,
        default: "",
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: {
            values: ['ready', 'submitted', 'evaluated']
        },
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    questions: [
        {
            questionNumber: Number,
            questionStatement: String,
            questionType: {
                type: String,
                enum: {
                    values: ['mcq', 'descriptive']
                }   
            },
            options: [
                { 
                    type: String
                }
            ],
            answeredBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            answerText: String,
            score: Number,
            feedback : String
        }
    ],
    overallScore: Number,
    overallFeedback: {
        strengths: [
            { type: String }
        ],
        improvements: [
            { type: String }
        ]
    }
}, 
{
    timestamps: true
});


const assessmentModel = new mongoose.model("Assessment", assessmentSchema);

module.exports = { Assessment: assessmentModel };
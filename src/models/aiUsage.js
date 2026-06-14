const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AIWorkspace"
    },
    count: {
        type: Number
    }
},
{
    timestamps: {
        createdAt: 'firstPromptSentAt',
        updatedAt: 'lastPromptSentAt'
    }
});

const aiUsageModel = new mongoose.model("AIUsage", aiUsageSchema);

module.exports = { AIUsage: aiUsageModel };
const mongoose = require('mongoose');

const aiWorkspaceSchema = new mongoose.Schema({
    participants: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    currentDraft: {
        text: {
            type: String,
            default: ""
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    isGenerating: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: {
        createdAt: 'workspaceCreatedAt',
        updatedAt: 'lastActivityDate'
    }
});

const aiMessageSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AIWorkspace",
        required: true
    },
    senderRole: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    content: {
        type: String,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'messageSentAt',
        updatedAt: false
    }
});


aiMessageSchema.index({ workspaceId: 1, messageSentAt: 1 });

const aiWorkspaceModel = new mongoose.model("AIWorkspace", aiWorkspaceSchema);
const aiMessageModel = new mongoose.model("AIMessage", aiMessageSchema);

module.exports = { AIWorkspace : aiWorkspaceModel, AIMessage: aiMessageModel };
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [ { type: mongoose.Schema.Types.ObjectId, ref: "User" } ]
}, {
    timestamps: true
});

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat"
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    text: String
}, {
    timestamps: true
});


const chatModel = new mongoose.model("Chat", chatSchema);
const messageModel = new mongoose.model("Message", messageSchema);

module.exports = { Chat:chatModel, Message:messageModel };
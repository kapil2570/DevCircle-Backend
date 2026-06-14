const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { Chat, Message } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const { onlineUsers } = require('../sockets/onlineUsers');
const { AIWorkspace } = require("../models/aiWorkspace");
const { generateResponse } = require("../config/gemini");

const chatRouter = express.Router();

chatRouter.post("/chat/start/:targetUserId", userAuth, async (req, res) => {
  const loggedInUserId = req.user._id;
  const targetUserId = req.params?.targetUserId;

  const connection = await ConnectionRequest.findOne({
    $or: [
      {
        $and: [ { fromUserId: loggedInUserId }, { toUserId: targetUserId } ]
      },
      {
        $and: [ { fromUserId: targetUserId }, { toUserId: loggedInUserId } ]
      }
    ],
    status: "accepted"
  });

  if(!connection) {
    return res.status(404).json({ message: "No Connection Found" });
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [loggedInUserId, targetUserId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [loggedInUserId, targetUserId],
      });

      aiWorkspace = new AIWorkspace({
        _id: chat._id,
        participants: chat.participants,
      })

      await chat.save();
      await aiWorkspace.save();
    }
    res.json({ message: "Retrieved Chat ID Successfully", data: { chatId: chat._id } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

chatRouter.get("/chat/onlineUsers", userAuth, async (req, res) => {
  try {
    res.json({ message: "Retrived online users successfully", data: Array.from(onlineUsers.keys()) });
  } catch(err) {
    res.status(400).json({ message: err.message });
  }
})

chatRouter.get("/chat/:chatId", userAuth, async (req, res) => {
  try {

    const loggedInUserId = req.user._id;
    const chatId = req.params?.chatId;

    const chat = await Chat.findOne({ participants: { $all: [loggedInUserId] }, _id: chatId }).populate("participants", "firstName lastName photoUrl");

    if(!chat) {
      return res.status(401).json({ message: "Unauthorized Access" });
    }

    const messages = await Message.find({ chatId }).sort({createdAt: 1});

    res.json({ message: "Retrived messages successfully", data: {chat, messages} });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// chatRouter.get("/chat-test/test-ai", userAuth, async (req, res) => {
//   try {
//     const response = await generateResponse("Hi, how are you");
//     res.json({message: response})
//   } catch (err) {
//     res.status(400).json({message: err.message})
//   }
// });




module.exports = chatRouter;
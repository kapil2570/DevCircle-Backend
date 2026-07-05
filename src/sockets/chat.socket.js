const { Message } = require("../models/chat");

const initializeChatSocket = (io, socket) => {

  // Join personal chat room
  socket.on("joinChat", ({ chatId }) => {
    socket.join(chatId);
  });

  // Send message
  socket.on("sendMessage", async ({ chatId, text }) => {
    try {
      const senderId = socket.user._id.toString();

      const message = new Message({
        chatId,
        senderId,
        text,
      });

      const newMessage = await message.save();

      // Emit message to all users in chat room
      io.to(chatId).emit("messageReceived", newMessage);

    } catch (err) {
      console.log(err || "Error sending message");
    }
  });
};

module.exports = { initializeChatSocket };
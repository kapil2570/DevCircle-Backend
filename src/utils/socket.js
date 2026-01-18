const Server = require("socket.io");
const socket = require("socket.io");
const { Message } = require("../models/chat");
const { socketAuth } = require("../middlewares/socketAuth");

const onlineUsers = new Map();

const initializeSocket = (server) => {
  // const io = socket(server, {
  //   cors: {
  //     origin: process.env.CLIENT_URL,
  //     credentials: true,
  //   },
  // });

  const io = Server(server, {
    cors: {
      origin: ["https://devcircle.co.in", "http://localhost:5173"],
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    socket.on("registerUser", () => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);
      io.emit("userOnline", { userId });
    });

    socket.on("joinChat", ({ chatId }) => {
      socket.join(chatId);
    });

    socket.on("sendMessage", async ({ chatId, text }) => {
      const senderId = socket.user._id.toString();
      const message = new Message({
        chatId,
        senderId,
        text,
      });
      const newMessage = await message.save();
      io.to(chatId).emit("messageReceived", newMessage);
    });

    socket.on("disconnect", () => {
      // const sockets = onlineUsers.get(userId);
      // sockets.delete(socket.id);

      // if (sockets.size === 0) {
      //   onlineUsers.delete(userId);
      //   io.emit("userOffline", { userId });
      // }

      for (let [userId, sockets] of onlineUsers.entries()) {
        if (!sockets) continue;

        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);

          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit("userOffline", { userId });
          }

          break;
        }
      }
    });
  });
};

module.exports = { initializeSocket, onlineUsers };

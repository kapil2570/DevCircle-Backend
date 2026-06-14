const { Server } = require("socket.io");
const { socketAuth } = require("../middlewares/socketAuth");

const { initializeChatSocket } = require("./chat.socket");
const {
  addOnlineUser,
  removeOnlineUser,
} = require("./onlineUsers");

const {
  initializeWorkspaceSocket,
} = require("./aiWorkspace.socket");

const initializeSocket = (server) => {
  // Creating IO - Socket server instance
  const io = new Server(server, {
    cors: {
      origin: ["https://devcircle.co.in", "http://localhost:5173"],
      credentials: true,
    },
    path: "/socket.io",
  });

  // Socket authentication middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {

    // Handle online user tracking
    addOnlineUser(io, socket);

    // Register chat socket events
    initializeChatSocket(io, socket);

    // Register AI workspace socket events
    initializeWorkspaceSocket(io, socket);

    // Disconnect cleanup
    socket.on("disconnect", () => {

      removeOnlineUser(io, socket);
    });
  });
};

module.exports = { initializeSocket };
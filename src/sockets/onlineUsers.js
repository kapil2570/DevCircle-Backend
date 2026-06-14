const onlineUsers = new Map();

const addOnlineUser = (io, socket) => {
  const userId = socket.user._id.toString();

  // Create new set for first connection
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  // Add current socket connection
  onlineUsers.get(userId).add(socket.id);

  // Broadcast user online
  io.emit("userOnline", { userId });

  // console.log("Online Users:", onlineUsers);
};

const removeOnlineUser = (io, socket) => {

  for (let [userId, sockets] of onlineUsers.entries()) {

    if (!sockets) continue;

    // Check if disconnected socket belongs to this user
    if (sockets.has(socket.id)) {

      // Remove current socket connection
      sockets.delete(socket.id);

      // If no active sockets remain
      if (sockets.size === 0) {
        onlineUsers.delete(userId);

        // Broadcast offline status
        io.emit("userOffline", { userId });
      }

      break;
    }
  }

  // console.log("Online Users:", onlineUsers);
};

module.exports = {
  onlineUsers,
  addOnlineUser,
  removeOnlineUser,
};
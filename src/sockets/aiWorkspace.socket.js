const { AIWorkspace, AIMessage } = require('../models/aiWorkspace');

const initializeWorkspaceSocket = (io, socket) => {

  const loggedInUserId = socket.user._id;

  socket.on("joinAIWorkspace", async ({ workspaceId }) => {

    try {
      const aiWorkspace = await AIWorkspace.findById(workspaceId);
      if(!aiWorkspace || !aiWorkspace.participants.some(participantId => participantId.toString() === loggedInUserId.toString())) {
        return socket.emit("workspaceError", {
          message: "You don't have access to this workspace"
        })
      }
      socket.currentWorkspaceId = workspaceId;
      socket.join(workspaceId);
      const { participants, currentDraft, isGenerating, lastActivityDate } = aiWorkspace;
      const messages = await AIMessage.find({ workspaceId }).sort({ messageSentAt: 1 });

      socket.emit("workspaceStateSynced", { 
        participants,
        currentDraft,
        isGenerating,
        lastActivityDate,
        messages
       })
    } catch (err) {
      console.log(err.message || "Something went wrong");
    }
  });


  socket.on("promptUpdate", async ({ workspaceId, text }) => {

    try {

      if(socket.currentWorkspaceId !== workspaceId) {
        return socket.emit("workspaceError", {
          message: "You don't have access to this workspace"
        })
      }

      const aiWorkspace = await AIWorkspace.findById(workspaceId);
      aiWorkspace.currentDraft.text = text;
      aiWorkspace.currentDraft.updatedBy = loggedInUserId;
      const updatedAIWorkspace = await aiWorkspace.save();

      io.to(workspaceId).emit("promptSynced", { text: updatedAIWorkspace.currentDraft.text, updatedBy: updatedAIWorkspace.currentDraft.updatedBy })

    } catch (err) {
      console.log(err.message || "Something went wrong");
    }

  })

};

module.exports = { initializeWorkspaceSocket };
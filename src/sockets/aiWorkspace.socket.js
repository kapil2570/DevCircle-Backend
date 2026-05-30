const { generateResponse } = require('../config/gemini');
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

  });


  socket.on("submitPrompt", async ({ workspaceId, prompt }) => {
    try {
      
      if(!prompt?.trim()) return;
      
      if(socket.currentWorkspaceId !== workspaceId) {
        return socket.emit("workspaceError", {
          message: "You don't have access to this workspace"
        });
      }

      let aiWorkspace = await AIWorkspace.findById(workspaceId);
      if(aiWorkspace.isGenerating) {
        return socket.emit("workspaceError", {
          message: "AI is already generating a response"
        });
      }

      let newMessage = new AIMessage({
        workspaceId,
        senderRole: "user",
        senderId: loggedInUserId,
        content: prompt
      });

      const savedPrompt = await newMessage.save();

      io.to(workspaceId).emit("promptFinalized", {
        message: savedPrompt
      });

      aiWorkspace.currentDraft = {
        text: "",
        updatedBy: null
      };
      aiWorkspace.isGenerating = true;

      await aiWorkspace.save();

      const messages = await AIMessage.find({ workspaceId }).sort({ messageSentAt: -1 }).limit(10);
      messages.reverse();

      const geminiMessages = messages.map((message) => ({
        role: message.senderRole === "assistant" ? "model" : "user",
        parts: [ { text: message.content } ]
      }));

      io.to(workspaceId).emit("aiGenerating", {
        isGenerating : true,
        submittedBy: loggedInUserId
      });

      try {
        const response = await generateResponse(geminiMessages);

        if(response) {
        const newMessage = new AIMessage({
          workspaceId,
          senderRole: "assistant",
          senderId: null,
          content: response
        });
        const savedResponse = await newMessage.save();

        io.to(workspaceId).emit("responseGenerated", {
        message: savedResponse
      })
        }
      } catch(err) {
        return io.to(workspaceId).emit("aiGenerationError", { message: err.message });
      } finally {
        await AIWorkspace.findByIdAndUpdate(workspaceId, { isGenerating: false });
      }

    } catch (err) {
      console.log(err.message || "Something went wrong");
    }
  });

};

module.exports = { initializeWorkspaceSocket };
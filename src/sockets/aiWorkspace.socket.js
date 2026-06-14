const { generateResponse } = require('../config/gemini');
const { AIUsage } = require('../models/aiUsage');
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

      if(!socket.currentWorkspaceId) return;

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

      if(prompt.length > 5000) {
        return socket.emit("workspaceError", {
          type: "promptSizeExceededLimit",
          message: "Prompt size cannot be more than 5000"
        })
      }
      
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

      let aiUsage = await AIUsage.findOne({ workspace: workspaceId });
      if(!aiUsage) {
        aiUsage = await AIUsage.create({
          workspace: workspaceId,
          count: 0,
          firstPromptSentAt: new Date(),
          lastPromptSentAt: new Date()
        });
        await aiUsage.save();
      }

      const today = new Date();
      if(aiUsage.lastPromptSentAt.toDateString() !== today.toDateString()) {
        aiUsage.lastPromptSentAt = today;
        aiUsage.count = 0;
        await aiUsage.save();
      } else if(aiUsage.count >= 10) {
        return socket.emit("workspaceError", {
          type: "promptLimitReached",
          message: "You've used all your daily AI credits! Your quota resets tomorrow."
        })
      };

      if(aiUsage.lastPromptSentAt && (aiUsage.lastPromptSentAt != aiUsage.firstPromptSentAt) && (Date.now() - aiUsage.lastPromptSentAt.getTime()) < 10000) {
        return socket.emit("workspaceError", {
          type: "generationCooldown",
          message: `Please wait ${Math.trunc((10000 - (Date.now() - aiUsage.lastPromptSentAt.getTime()))/1000)} seconds before generating another response`
        })
      };

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

      const messages = await AIMessage.find({ workspaceId }).sort({ messageSentAt: -1 }).limit(20);
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
      });
      aiUsage.count++;
      aiUsage.lastPromptSentAt = today;
      await aiUsage.save();
        }
      } catch(err) {
        console.log(err);
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
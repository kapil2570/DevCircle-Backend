# DB Schema

## AIWorkspace Model
- Participants -> [ObjectId]
- currentDraft -> { text: String, updatedBy: ObjectId }
- isGenerating -> Boolean
- lastActivityAt -> Date & Time

## AIMessage Model
- workspaceId -> ObjectId
- role -> String // user or assistant
- senderId -> ObjectId // null for assistant
- content -> String
- createdAt -> Date & Time


# Socket Events 

## Frontend -> Backend Events
- joinAIWorkspace : { workspaceId }
- promptUpdate   : { workspaceId, text }
- submitPrompt : { workspaceId, prompt }
## Backend -> Frontend Events
- workspaceStateSynced  : { currentPromptDraft,  isGenerating, allMessages}
- promptSynced : { text, updatedBy }
- promptFinalized : { message }
- aiGenerating  : { isGenerating: true, submittedBy }
- responseGenerated : { promptMessage, aiMessage }
- generationFailed : { error }



# Frontend State

- currentDraft
- allMessages
- isGenerating
- activeEditor
- connectionStatus


# AI Flow

- User edits prompt
- User clicks submit
- Backend validates : Workspace exists, participant authorized, not already generating
- Broadcast final prompt
- Backend locks workspace
- Persist user prompt
- Fetch recent context
- Call Gemini/OpenAi
- Persist assistant response
- Unlock workspace
- Broadcast generated response
- Clear shared draft









## Assessment Schema - 

- prompt -> String
- createdBy -> ObjectId
- status -> String(ready | submitted | evaluated)
- participants -> Array of objects - { participant -> ObjectId, overallScore -> Number, overallFeedback -> String }


## Questions Schema -

- assessmentId -> ObjectId
- questionNumber -> Number
- questionStatement -> String
- questionType -> String(mcq | descriptive)
- Options -> Array of Strings

## Answers Schema -

- assessmentId -> ObjectId
- questionId -> ObjectId
- answeredBy -> ObjectId
- answerText -> String
- score -> Number
- feedback -> String
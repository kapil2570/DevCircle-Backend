const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    status: {
        type: String,
        enum: {
            values: ["ignored", "interested", "accpeted", "rejected"],
            message: `{VALUE} is invalid status type`
        },
        required: true
    }
},
{
    timestamps: true
});

// Arrow function won't work
connectionRequestSchema.pre("save", function (next) {
    const connectionRequest = this;
    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
        throw new Error("Cannot send the connection request to yourself");
    }
    // next();
});


const ConnectionRequestModel = new mongoose.model("connectionRequest", connectionRequestSchema);

module.exports = ConnectionRequestModel;
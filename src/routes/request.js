const express = require('express');
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');
const mongoose = require('mongoose');

const requestRouter = express.Router();

requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    
    const fromUserId = req.user._id;
    const toUserId = req.params?.toUserId;
    const status = req.params?.status;

    const allowedStatus = ["ignored", "interested"];
    if(!allowedStatus.includes(status)) {
        throw new Error("Invalid status type: " + status);
    }

    // if(fromUserId == toUserId) {
    //     throw new Error("You cannnot send the connection request to yourself");
    // }

    const toUser = await User.findOne(new mongoose.Types.ObjectId(toUserId));
    if(!toUser) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
            { fromUserId, toUserId },
            { fromUserId: toUserId, toUserId: fromUserId }
        ]
    });
    if(existingConnectionRequest) {
        throw new Error("Connection request already exists");
    }

    const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status
    })

    const connectionObj = await connectionRequest.save();
    res.json({
        message: status==="interested" ? "Connection request sent successfully" : "Passed the profile successfully",
        connectionObj
    })

  } catch (err) {
    res.status(400).json({
        message: err.message
    });
  }
});

module.exports = requestRouter;
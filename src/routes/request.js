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

requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
    try {

        const loggedInUser = req.user;
        const { status, requestId } = req.params;

        // Validate params status - should be only "accepted" or "rejected"
        const allowedStatus = ["accepted", "rejected"];
        if(!allowedStatus.includes(status)) {
            throw new Error("Invalid status type: " + status);
        }

        // Check if connection request exists
        const existingConnectionRequest = await ConnectionRequest.findById(requestId);
        if(!existingConnectionRequest) {
            return res.status(404).json({
                message: "Connection request does not exist"
            })
        }

        const fromUserId = existingConnectionRequest.fromUserId;
        const toUserId = existingConnectionRequest.toUserId;


        // toUserId should be same as loggedInUserId
        const loggedInUserId = loggedInUser._id;
        if(!(toUserId.equals(loggedInUserId))) {
            throw new Error("You are not receiver of this request");
        }
        
        // Validate fromUserId
        const fromUser = await User.findOne(new mongoose.Types.ObjectId(fromUserId));
        if(!fromUser) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        

        // Check connection request status - can be "interested" only
        if(existingConnectionRequest.status !== "interested") {
            throw new Error(`Connection request exists with this status: ${existingConnectionRequest.status}`);
        }

        // Save new status in database
        existingConnectionRequest.status = status;
        const updatedConnectionRequest = await existingConnectionRequest.save();
        return res.json({
            message: status === "accepted" 
            ? `Congratulations ${loggedInUser.firstName}, It's a match!!!` 
            : "Rejected the request successfully",
            data: updatedConnectionRequest
        })

    } catch (err) {
    res.status(400).json({
        message: err.message
    });
  }
})

module.exports = requestRouter;
const express = require('express');
const { userAuth } = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');

const userRouter = express.Router();

const USER_SAFE_DATA = "firstName lastName age gender photoUrl about skills experience careerGoals"

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const receivedRequests = await ConnectionRequest.find(
            { toUserId: loggedInUserId, status: "interested" }
        ).populate("fromUserId", USER_SAFE_DATA);
        return res.json({
            message: "Retrieved requests successfully",
            data: receivedRequests
        })
    } catch(err) {
        return res.status(400).json({
            message: err.message
        })
    }
});


userRouter.get("/user/connections", userAuth, async (req,res) => {
    try {
        const loggedInUser = req.user;
        const connections = await ConnectionRequest.find(
            { $or:[{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }], status: "accepted" }
        ).populate("fromUserId", USER_SAFE_DATA)
        .populate("toUserId", USER_SAFE_DATA);

        const data = connections.map((item) => {
            return loggedInUser._id.equals(item.fromUserId._id) ? item.toUserId : item.fromUserId;
        });

        res.json({
            message: "Retrieved the connections successfully",
            data
        })
    } catch(err) {
        res.status(400).json({
            message: err.message
        })
    }
})


userRouter.get("/user/feed", userAuth, async (req,res) => {
    try {

        const loggedInUser = req.user;
        const page = parseInt(req.query?.page) || 1;
        let limit = parseInt(req.query?.limit) || 10;
        limit = limit>50 ? 50 : limit;
        const skip = (page-1)*limit;

        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ]
        }).select("fromUserId toUserId");

        const hideUsersFromFeed = new Set();
        connectionRequests.forEach((connectionItem) => {
            hideUsersFromFeed.add(connectionItem.fromUserId);
            hideUsersFromFeed.add(connectionItem.toUserId);
        })

        const userFeed = await User.find({
            $and: [
                {
                    _id: { $nin: Array.from(hideUsersFromFeed) }
                },
                {
                    _id: { $ne: loggedInUser._id }
                }
            ]
        }).select(USER_SAFE_DATA).skip(skip).limit(limit);

        res.json({
            message: "Retrived the feed successfully",
            data: userFeed
        })


    } catch(err) {
        res.status(400).json({
            message: err.message
        })
    }
})


module.exports = userRouter;
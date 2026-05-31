const jwt = require('jsonwebtoken');
const User = require("../models/user");

const socketAuth = async (socket, next) => {
    try {
        const cookie = socket.handshake.headers.cookie;
        console.log('socket cookie: ', cookie);
        if(!cookie) {
            return next(new Error("Cookie not sent"));
        }

        const token = cookie.split("=")[1];

        if(!token) {
            return next(new Error("Token not found"));
        }

        const decodedObj = await jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decodedObj._id).select("_id firstName lastName photoUrl");

        if(!user) {
            return next(new Error("User not found"));
        }

        socket.user = user;
        next();

    } catch(err) {
        return next(new Error("Authentication Failed"));
    }
};

module.exports = { socketAuth };
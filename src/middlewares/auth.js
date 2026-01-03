const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userAuth = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        const { token } = cookies;

        if(!token) {
            throw new Error("Token is not valid");
        }

        const decodedObj = await jwt.verify(token, "DevTinder@KapilNode9236");
        const { _id } = decodedObj;

        const user = await User.findById(_id);
        if(!user) {
            throw new Error("User does not exist");
        }
        req.user = user;
        next();

    } catch(err) {
        res.status(400).send("ERROR: " + err.message);
    }
}

module.exports = { userAuth }
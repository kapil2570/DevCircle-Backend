const express = require('express');
const { userAuth } = require("../middlewares/auth");
const { validateProfileEdit } = require("../utils/validation");
const validator = require('validator');
const bcrypt = require('bcrypt');

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
    try {
        if(!validateProfileEdit(req)) {
            throw new Error("Edit not allowed");
        }
        const loggedInUser = req.user;
        const editData = req.body;

        Object.keys(editData).forEach((field) => loggedInUser[field] = editData[field]);

        await loggedInUser.save();

        res.json({ message: `${loggedInUser.firstName}, your profile is updated successfully`, data: loggedInUser })

    } catch(err) {
        res.status(400).send("ERROR: " + err.message);
    }
})

profileRouter.patch("/profile/updatePassword", userAuth, async (req, res) => {
    try {
        // Validate current password
        const loggedInUser = req.user;
        const { currentPassword: currentPasswordInput, newPassword: newPasswordInput } = req.body;

        const isCurrentPasswordValid = await loggedInUser.validatePassword(currentPasswordInput);
        if(!isCurrentPasswordValid) {
            throw new Error("Invalid current password");
        }

        // Check strength of new password
        if(!validator.isStrongPassword(newPasswordInput)) {
            throw new Error("New password is not strong enough");
        }

        // Current and new password should not be the same
        if(currentPasswordInput === newPasswordInput) {
            throw new Error("Current password and new password cannot be the same");
        }

        // Update new password
        const newPasswordHash = await bcrypt.hash(newPasswordInput, 10);
        loggedInUser["password"] = newPasswordHash;
        await loggedInUser.save();

        res.send("Password updated successfully");
    } catch(err) {
        res.status(400).send("ERROR: " + err.message);
    }
    
})

module.exports = profileRouter;
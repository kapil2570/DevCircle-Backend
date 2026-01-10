const express = require('express');
const { userAuth } = require("../middlewares/auth");
const { validateProfileEdit } = require("../utils/validation");
const validator = require('validator');
const bcrypt = require('bcrypt');
const upload = require('../middlewares/upload');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send({message: "ERROR: " + err.message});
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
        res.status(400).send({message: "ERROR: " + err.message});
    }
})

profileRouter.patch("/profile/upload-photo", userAuth, upload.single("photo"), async (req,res) => {
    try {
        if(!req.file) {
            throw new Error("No file uploaded");
        }
        // const loggedInUser = req.user;

        // Upload the local file to cloudinary
        const result = await cloudinary.v2.uploader.upload(
            req.file.path,
            {
                folder: 'profiles'
            }
        );

        // Update photoUrl in DB
        // loggedInUser.photoUrl = result.secure_url;
        // await loggedInUser.save();

        // Delete the local file
        fs.unlinkSync(req.file.path);

        res.json({
            message: "Profile photo updated successfully",
            photoUrl: result.secure_url
        });

    } catch(err) {
        fs.unlinkSync(req.file.path);
        res.status(400).send({ message: "ERROR: " + err.message });
    }
})

profileRouter.patch("/profile/updatePassword", userAuth, async (req, res) => {
    try {
        // Validate current password
        const loggedInUser = req.user;
        const { currentPassword: currentPasswordInput, newPassword: newPasswordInput, confirmPassword: confirmPasswordInput } = req.body;

        if(!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
            throw new Error("All the fields are required");
        }

        if(newPasswordInput.trim() !== confirmPasswordInput.trim()) {
            throw new Error("New password and confirm password are not the same");
        }

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

        res.send({message: "Password updated successfully"});
    } catch(err) {
        res.status(400).send({message: "ERROR: " + err.message});
    }
    
})

module.exports = profileRouter;
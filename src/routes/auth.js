const express = require('express');
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");


const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password } = req.body;

    //Validation of the data
    validateSignUpData(req);

    //Check for Existing User with this Email ID
    const existingUser = await User.findOne({ emailId });
    if(existingUser) {
      throw new Error("Email ID is already registered, Please login");
    }

    //Encrypting the password
    const passwordHash = await bcrypt.hash(password, 10);

    //Creating an instance of the User model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    await user.save();
    res.send({message: "User Created Successfully"});
  } catch (err) {
    res.status(400).send({message: "ERROR: " + err.message});
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid Credentials");
    }

    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      const token = await user.generateJWT();
      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
      });
      res.json({
        message: "Login Successful",
        data: user
      });
    } else {
      throw new Error("Invalid Credentials");
    }
  } catch (err) {
    res.status(400).json({message: "ERROR: " + err.message});
  }
});

authRouter.post("/logout", async (req, res) => {
    try {
        res.cookie("token", null, { expires: new Date(Date.now()) });
        res.send({message:"Logout Successful"});
    } catch(err) {
        res.status(400).send("ERROR: ", + err.message);
    }
})

module.exports = authRouter;
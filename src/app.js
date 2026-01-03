const express = require('express');
const connectDB = require('./config/database');
const User = require('./models/user');
require('dotenv').config();

const app = express();

app.use(express.json());

app.get("/user", async (req,res) => {

    const userEmail = req.body.emailId;

    try  {
        const users = await User.find({ emailId : userEmail});
        if(users.length === 0) {
            res.status(404).send("User not found");
        } else {
            res.send(users);
        }
    } catch (err) {
        res.status(400).send("Something went wrong");
    }
})

app.get("/feed", async (req,res) => {
    try {
        const users = await User.find({});
        if(users.length === 0) {
            res.status(404).send("Feed is empty");
        } else {
            res.send(users);
        }
    } catch (err) {
        res.status(400).send("Something went wrong");
    }
})

app.post("/signup", async (req,res) => {

    const user = new User(req.body);
    try {
        await user.save();
        res.send('User Created Successfully');
    } catch (err) {
        res.status(400).send("Eror saving the user: " + err.message);
    }
})

app.patch("/user/:userId", async (req,res) => {
    const data = req.body;
    const userId = req.params?.userId;
    const ALLOWED_UPDATES = ["gender", "age", "photoUrl", "about", "skills"];
    try {
        const isUpdateAllowed = Object.keys(data).every(key => ALLOWED_UPDATES.includes(key));
        if(!isUpdateAllowed)
            throw new Error("Update not allowed")
        const user = await User.findByIdAndUpdate(userId, data, { returnDocument: 'after', runValidators: true });
        res.send("User updated successfully");
    } catch (err) {
        res.status(400).send("UPDATE FAILED:" + err.message);
    }
})

app.delete("/user", async (req,res) => {
    const userId = req.body.userId;
    try {
        const user = await User.findByIdAndDelete(userId);
        res.send("User deleted successfully");
    } catch (err) {
        res.status(400).send("Eror saving the user: " + err.message);
    }
})


connectDB()
    .then(() => {
        console.log('Database connected successfully...');
        app.listen(3000, () => {
            console.log('Server is successfully listening on port 3000....');
        })  
    })
    .catch((err) => {
        console.error("Couldn't connect to the Database");
    })
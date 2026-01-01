const express = require('express');
const connectDB = require('./config/database');
const User = require('./models/user');

const app = express();

app.post("/signup", async (req,res) => {
    const user = new User({
        firstName: 'Atif',
        lastName: 'Aslam',
        emailId: 'atif@aslam.com',
        password: 'atif@050'
    })

    try {
        await user.save();
        res.send('User Created Successfully');
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
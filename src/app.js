const express = require('express');
const { adminAuth, userAuth } = require('./middlewares/auth')

const app = express();

app.use("/admin", adminAuth);

app.post("/user/login", (req,res) => {
    res.send('User logged in successfully');
})

app.get("/user/data", userAuth, (req,res) => {
    res.send('User data sent');
})

app.get("/admin/getData", (req,res) => {
    res.send('All data sent');
})

app.post("/admin/createData", (req,res) => {
    res.send('Created record successfully');
})

app.delete("/admin/deleteData", (req,res) => {
    res.send('Record Deleted Successfully');
})

app.listen(3000, () => {
    console.log('Server is successfully listening on port 3000....');
})
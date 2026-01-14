const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require('cors');

require("dotenv").config();

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');
const userRouter = require('./routes/user');



const app = express();

app.use(cors({
  // To save cookies in browser even for this cross - origin request
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);


connectDB()
  .then(() => {
    console.log("Database connected successfully...");
    app.listen(process.env.PORT, () => {
      console.log(`Server is successfully listening on port ${process.env.PORT}....`);
    });
  })
  .catch((err) => {
    console.error("Couldn't connect to the Database");
  });

const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const { initializeSocket } = require("./utils/socket");

require("dotenv").config();

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');
const userRouter = require('./routes/user');
const chatRouter = require('./routes/chat');

const app = express();

app.use(cors({
  // To save cookies in browser even for this cross - origin request
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);


const http = require('http');
const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    console.log("Database connected successfully...");
    server.listen(process.env.PORT, () => {
      console.log(`Server is successfully listening on port ${process.env.PORT}....`);
    });
  })
  .catch((err) => {
    console.error("Couldn't connect to the Database");
  });

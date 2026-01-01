const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect(
        "mongodb+srv://aithkapil_db_user:2zT04PLWMkb2NGls@namaste-node.bxvhmxv.mongodb.net/devTinder"
    );
}

module.exports = connectDB;
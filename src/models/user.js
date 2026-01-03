const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 20
    },
    lastName: {
        type: String,
        minLength: 2,
        maxLength: 20
    },
    emailId: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(val) {
            if(!(validator.isEmail(val)))
                throw new Error('Invalid Email Address: ' + val);
        }
    },
    password: {
        type: String,
        required: true,
        validate(val) {
            if(!validator.isStrongPassword(val))
                throw new Error("Weak Password: " + val);
        }
    },
    age: {
        type: Number,
        min: 18
    },
    gender: {
        type: String,
        validate(value) {
            if(!['male', 'female', 'others'].includes(value.toLowerCase())) {
                throw new Error('Gender data is not valid');
            }
        },
        lowercase: true
    },
    photoUrl: {
        type: String,
        default: "https://commons.wikimedia.org/wiki/File:Sample_User_Icon.png",
        validate(val) {
            if(!validator.isURL(val))
                throw new Error("Invalid Photo URL");
        }
    },
    about: {
        type: String,
        default: "This is default about statement"
    },
    skills: {
        type: [String],
        validate(val) {
            if(val.length > 10)
                throw new Error("Maximum 10 skills are allowed")
        }
    }
},
{
    timestamps: true
}
)

module.exports = mongoose.model("User", userSchema);
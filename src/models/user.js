const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
        enum: {
            values: ['male', 'female', 'other'],
            message: `{VALUE} is not a valid gender type`
        },
        validate(value) {
            if(!['male', 'female', 'other'].includes(value.toLowerCase())) {
                throw new Error('Gender data is not valid');
            }
        },
        lowercase: true
    },
    photoUrl: {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaOJ_HSj0BZque4iT9qR6XVhg1ncva32Z-wg&s",
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
    },
    experience: {
        type: String,
        validate(val) {
            if(val.length > 400) {
                throw new Error("Max 400 characters are allowed in experience field");
            }
        }
    },
    careerGoals: {
        type: String,
        validate(val) {
            if(val.length > 250) {
                throw new Error("Max 250 characters are allowed in career goals field");
            }
        }
    },
    aiUsage: {
        type: Number,
        default: 0
    },
    lastPromptSentAt: {
        type: Date,
        default: null
    }
},
{
    timestamps: true
}
)

// Arrow function won't work as 'this' works differently
userSchema.methods.generateJWT = async function() {
    const user = this;
    const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return token;
}


// Arrow function won't work as 'this' works differently
userSchema.methods.validatePassword = async function(passwordInput) {
    const user = this;
    const passwordHash = user.password;
    const isPasswordValid = await bcrypt.compare(passwordInput, passwordHash);

    return isPasswordValid;
}

module.exports = mongoose.model("User", userSchema);
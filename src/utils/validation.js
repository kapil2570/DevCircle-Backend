const validator = require('validator');

const validateSignUpData = (req) => {
    const {firstName, lastName, emailId, password} = req.body;

    if(!firstName || !lastName) {
        throw new Error("Name is not valid");
    } else if(!validator.isEmail(emailId)) {
        throw new Error("Invalid Email ID");
    } else if(!validator.isStrongPassword(password)) {
        throw new Error("Weak password");
    }
}

const validateProfileEdit = (req) => {
    const allowedEditFields = ["firstName", "lastName", "age", "gender", "photoUrl", "about", "skills", "experience", "careerGoals"];

    const isEditAllowed = Object.keys(req.body).every((field) => allowedEditFields.includes(field));
    
    return isEditAllowed;

}

module.exports = {
    validateSignUpData,
    validateProfileEdit
}
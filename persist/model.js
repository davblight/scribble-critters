const mongoose = require('mongoose');

//setup user Schema with email validation
const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

module.exports = {
    User,
}
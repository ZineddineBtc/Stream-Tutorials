const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

module.exports = mongoose.model("User", UserSchema);
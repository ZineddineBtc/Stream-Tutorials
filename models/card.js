const mongoose = require("mongoose");

const CardSchema = {
    userID: String,
    userName: String,
    title: String,
    description: String,
    datetime: String,
    url: String
};


module.exports = mongoose.model("Card", CardSchema);
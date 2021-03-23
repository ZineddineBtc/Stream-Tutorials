const mongoose = require("mongoose");

const CardSchema = {
    userID: String,
    title: String,
    description: String,
    date: String,
    time: String,
    url: String
};


module.exports = mongoose.model("Card", CardSchema);
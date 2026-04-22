const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: String,
  avatar: String
});

module.exports = mongoose.model("Member", memberSchema);
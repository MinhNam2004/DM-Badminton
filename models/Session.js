const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },

  players: [
    {
      name: String,
      seo: Number,
      water: Number,
      court: Number,
      shuttle: Number,
      extra: Number,
      total: Number
    }
  ],

  totalDay: Number,

  videos: [String] 
});

module.exports = mongoose.model("Session", sessionSchema);
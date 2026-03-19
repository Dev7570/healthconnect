const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  hospitalId: { type: Number, required: true },
  hospitalName: { type: String, default: "Hospital" },
  userName: { type: String, default: "Anonymous" },
  userEmail: { type: String, default: "" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", reviewSchema);

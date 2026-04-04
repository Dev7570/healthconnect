const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  hospitalId: { type: Number, required: true },
  hospitalName: { type: String, default: "Hospital" },
  userName: { type: String, default: "Anonymous" },
  userEmail: { type: String, default: "" },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", reviewSchema);

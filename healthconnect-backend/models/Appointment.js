const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  doctorName: { type: String, required: true },
  doctorSpec: { type: String, default: "General" },
  hospitalName: { type: String, required: true },
  hospitalId: { type: Number, default: 0 },
  date: { type: String, required: true },
  time: { type: String, required: true },
  patientName: { type: String, required: true },
  patientAge: { type: String, default: "N/A" },
  patientEmail: { type: String, required: true },
  patientPhone: { type: String, default: "" },
  reason: { type: String, default: "General Consultation" },
  fee: { type: Number, default: 500 },
  status: { type: String, default: "Confirmed" },
  paymentStatus: { type: String, default: "Pending" },
  paymentMethod: { type: String, default: "" },
  bookedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Appointment", appointmentSchema);

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  appointmentId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  upiId: { type: String, default: null },
  cardLast4: { type: String, default: null },
  patientEmail: { type: String, default: "" },
  status: { type: String, default: "Success" },
  receiptNo: { type: String, required: true },
  paidAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", paymentSchema);

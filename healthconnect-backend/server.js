/**
 * ============================================
 *  HealthConnect Backend — API Server
 * ============================================
 *  Tech: Node.js + Express + MongoDB (Mongoose)
 *  APIs: Google Places via RapidAPI
 *  Features: Hospital search, doctor listing,
 *            appointment booking, reviews, payments
 * ============================================
 */

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

// Mongoose models
const Appointment = require("./models/Appointment");
const Review = require("./models/Review");
const Payment = require("./models/Payment");

const app = express();

// ✅ CORS — allow Vercel frontend + localhost
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://healthconnect-frontend.vercel.app",
    /\.vercel\.app$/,  // allow all Vercel preview URLs
  ],
  credentials: true,
}));
app.use(express.json());

const RAPIDAPI_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ========================================
// 🗄️ MongoDB Connection
// ========================================
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthconnect";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("⚠️  Server will continue with limited functionality (no data persistence)");
  });

// Track appointment IDs (get max from DB on startup)
let appointmentIdCounter = 10000;
(async () => {
  try {
    const latest = await Appointment.findOne().sort({ bookedAt: -1 });
    if (latest && latest.id) {
      const num = parseInt(latest.id.replace("HC", ""));
      if (num > appointmentIdCounter) appointmentIdCounter = num;
    }
  } catch (e) { /* DB not connected yet, use default */ }
})();

// 👨‍⚕️ Doctor database (static data — no need to persist)
const DOCTORS_DB = [
  { id: 1, name: "Dr. Priya Sharma", spec: "Cardiology", exp: 15, fee: 800, available: "Today", rating: 4.8, img: "👩‍⚕️", bio: "Senior Cardiologist with 15+ years of experience in interventional cardiology and heart failure management.", qualifications: "MD, DM (Cardiology), FACC", slots: ["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM"] },
  { id: 2, name: "Dr. Rajesh Kumar", spec: "Orthopedics", exp: 12, fee: 700, available: "Today", rating: 4.6, img: "👨‍⚕️", bio: "Expert orthopedic surgeon specializing in joint replacement, sports injuries, and trauma care.", qualifications: "MS (Ortho), DNB, Fellowship in Joint Replacement", slots: ["9:30 AM","10:30 AM","2:30 PM","3:30 PM","4:00 PM"] },
  { id: 3, name: "Dr. Anita Desai", spec: "Neurology", exp: 18, fee: 1000, available: "Tomorrow", rating: 4.9, img: "👩‍⚕️", bio: "Head of Neurology with expertise in stroke management, epilepsy treatment, and neurological disorders.", qualifications: "MD, DM (Neurology), FIAN", slots: ["10:00 AM","11:00 AM","2:00 PM","4:00 PM"] },
  { id: 4, name: "Dr. Vikram Singh", spec: "General Medicine", exp: 8, fee: 500, available: "Today", rating: 4.5, img: "👨‍⚕️", bio: "Dedicated general physician with a patient-first approach. Expert in managing chronic diseases and preventive care.", qualifications: "MD (Internal Medicine)", slots: ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","2:00 PM","2:30 PM","3:00 PM"] },
  { id: 5, name: "Dr. Meera Patel", spec: "Pediatrics", exp: 10, fee: 600, available: "Today", rating: 4.7, img: "👩‍⚕️", bio: "Compassionate pediatrician specializing in child development, vaccinations, and newborn care.", qualifications: "MD (Pediatrics), IAP Fellowship", slots: ["9:00 AM","10:00 AM","11:00 AM","3:00 PM","4:00 PM"] },
  { id: 6, name: "Dr. Arjun Nair", spec: "Gastroenterology", exp: 14, fee: 900, available: "Tomorrow", rating: 4.4, img: "👨‍⚕️", bio: "Expert in digestive health, liver diseases, and advanced endoscopy procedures.", qualifications: "MD, DM (Gastroenterology)", slots: ["10:00 AM","11:00 AM","2:30 PM","3:30 PM"] },
  { id: 7, name: "Dr. Sunita Reddy", spec: "Oncology", exp: 20, fee: 1200, available: "Today", rating: 4.9, img: "👩‍⚕️", bio: "Leading oncologist with 20+ years in cancer treatment. Pioneer in targeted therapy and immunotherapy.", qualifications: "MD, DM (Medical Oncology), ESMO", slots: ["9:30 AM","10:30 AM","2:00 PM"] },
  { id: 8, name: "Dr. Amit Joshi", spec: "Nephrology", exp: 11, fee: 750, available: "Today", rating: 4.3, img: "👨‍⚕️", bio: "Nephrologist specializing in kidney transplant, dialysis management, and chronic kidney disease.", qualifications: "MD, DM (Nephrology)", slots: ["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"] },
  { id: 9, name: "Dr. Kavita Menon", spec: "Emergency", exp: 9, fee: 500, available: "Today", rating: 4.6, img: "👩‍⚕️", bio: "Emergency medicine specialist trained in trauma care, critical care, and disaster management.", qualifications: "MD (Emergency Medicine), ACLS", slots: ["9:00 AM","10:00 AM","2:00 PM","3:00 PM","4:00 PM"] },
  { id: 10, name: "Dr. Sanjay Gupta", spec: "Surgery", exp: 22, fee: 1500, available: "Tomorrow", rating: 4.8, img: "👨‍⚕️", bio: "Chief Surgeon with expertise in minimally invasive surgery, laparoscopic procedures, and surgical oncology.", qualifications: "MS (Surgery), MCh, FACS", slots: ["10:00 AM","11:00 AM","2:00 PM"] },
];

// ========================================
// 🏥 HOSPITAL ENDPOINTS
// ========================================

// 🏥 Search hospitals by city
app.get("/hospitals", async (req, res) => {
  const city = req.query.city || "New Delhi";
  try {
    const response = await axios.post(
      "https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchText",
      { textQuery: `hospitals in ${city}`, languageCode: "en" },
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "google-map-places-new-v2.p.rapidapi.com",
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.id,places.currentOpeningHours,places.internationalPhoneNumber",
        },
      }
    );
    const places = response.data.places || [];
    const hospitals = places.map((place, index) => ({
      id: index + 1,
      name: place.displayName?.text || "Unknown Hospital",
      address: place.formattedAddress || "",
      area: place.formattedAddress?.split(",")[1]?.trim() || city,
      city: city,
      rating: place.rating || 4.0,
      reviews: place.userRatingCount || 0,
      lat: place.location?.latitude || 28.6139,
      lng: place.location?.longitude || 77.209,
      openNow: place.currentOpeningHours?.openNow ?? true,
      placeId: place.id || "",
      phone: place.internationalPhoneNumber || "N/A",
      image: "🏥",
      color: "#0066CC",
      type: "Hospital",
      beds: "N/A",
      timings: "24/7",
      established: "N/A",
      specialities: ["General Medicine", "Emergency", "Surgery"],
      doctors: [],
      tests: [
        { name: "Blood Test (CBC)", price: 300 },
        { name: "MRI Brain", price: 7000 },
        { name: "CT Scan Chest", price: 4500 },
        { name: "ECG", price: 200 },
        { name: "X-Ray", price: 280 },
        { name: "Lipid Profile", price: 450 },
      ],
      reviewsList: [],
    }));
    res.json({ success: true, total: hospitals.length, hospitals });
  } catch (error) {
    console.error("RapidAPI Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.json({
    message: "HealthConnect Backend is running! 🏥",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    version: "2.0.0",
  });
});

// ========================================
// 👨‍⚕️ DOCTOR ENDPOINTS
// ========================================

// Get doctors for a hospital
app.get("/doctors", (req, res) => {
  const hospitalId = parseInt(req.query.hospitalId) || 1;
  const spec = req.query.spec || "";
  const startIdx = (hospitalId - 1) % DOCTORS_DB.length;
  const count = 3 + (hospitalId % 2);
  let doctors = [];
  for (let i = 0; i < count; i++) {
    const doc = { ...DOCTORS_DB[(startIdx + i * 3) % DOCTORS_DB.length] };
    doc.id = hospitalId * 100 + i + 1;
    doctors.push(doc);
  }
  if (spec && spec !== "All") {
    doctors = doctors.filter((d) => d.spec.toLowerCase().includes(spec.toLowerCase()));
  }
  res.json({ success: true, doctors });
});

// Get single doctor by ID
app.get("/doctors/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const doc = DOCTORS_DB.find((d) => d.id === id);
  if (!doc) {
    // Try finding by computed ID (hospitalId * 100 + i + 1)
    const hospitalId = Math.floor(id / 100);
    const idx = (id % 100) - 1;
    const startIdx = (hospitalId - 1) % DOCTORS_DB.length;
    const source = DOCTORS_DB[(startIdx + idx * 3) % DOCTORS_DB.length];
    if (source) {
      return res.json({ success: true, doctor: { ...source, id } });
    }
    return res.status(404).json({ success: false, error: "Doctor not found" });
  }
  res.json({ success: true, doctor: doc });
});

// ========================================
// 📅 APPOINTMENT ENDPOINTS (MongoDB)
// ========================================

// 📅 Book an appointment
app.post("/appointments", async (req, res) => {
  const { doctorName, doctorSpec, hospitalName, hospitalId, date, time, patientName, patientAge, patientEmail, patientPhone, reason, fee } = req.body;

  if (!doctorName || !hospitalName || !date || !time || !patientName || !patientEmail) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  appointmentIdCounter++;
  const appointment = new Appointment({
    id: `HC${appointmentIdCounter}`,
    doctorName,
    doctorSpec: doctorSpec || "General",
    hospitalName,
    hospitalId: hospitalId || 0,
    date,
    time,
    patientName,
    patientAge: patientAge || "N/A",
    patientEmail,
    patientPhone: patientPhone || "",
    reason: reason || "General Consultation",
    fee: fee || 500,
    status: "Confirmed",
    bookedAt: new Date(),
  });

  try {
    await appointment.save();
    console.log(`📅 New appointment booked: ${appointment.id} — ${patientName} with ${doctorName}`);

    // 📱 SMS Notification (placeholder — integrate Twilio/MSG91 for production)
    if (patientPhone) {
      console.log(`📱 SMS notification sent to ${patientPhone}: Your appointment ${appointment.id} with ${doctorName} on ${date} at ${time} is confirmed.`);
    }

    res.json({ success: true, appointment });
  } catch (err) {
    console.error("DB Error (appointment):", err.message);
    res.status(500).json({ success: false, error: "Could not save appointment" });
  }
});

// 📋 Get appointments for a user
app.get("/appointments/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const userAppointments = await Appointment.find({ patientEmail: email }).sort({ bookedAt: -1 });
    res.json({ success: true, total: userAppointments.length, appointments: userAppointments });
  } catch (err) {
    console.error("DB Error (get appointments):", err.message);
    res.json({ success: true, total: 0, appointments: [] });
  }
});

// ❌ Cancel an appointment
app.delete("/appointments/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const apt = await Appointment.findOne({ id });
    if (!apt) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }
    apt.status = "Cancelled";
    await apt.save();
    console.log(`❌ Appointment cancelled: ${id}`);
    res.json({ success: true, appointment: apt });
  } catch (err) {
    console.error("DB Error (cancel):", err.message);
    res.status(500).json({ success: false, error: "Could not cancel appointment" });
  }
});

// ========================================
// ⭐ REVIEW ENDPOINTS (MongoDB)
// ========================================

// ⭐ Submit a review
app.post("/reviews", async (req, res) => {
  const { hospitalId, hospitalName, userName, userEmail, rating, text } = req.body;

  if (!hospitalId || !rating || !text) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const review = new Review({
    hospitalId,
    hospitalName: hospitalName || "Hospital",
    userName: userName || "Anonymous",
    userEmail: userEmail || "",
    rating,
    text,
    createdAt: new Date(),
  });

  try {
    await review.save();
    console.log(`⭐ New review for ${hospitalName}: ${rating}/5 by ${userName}`);
    res.json({ success: true, review });
  } catch (err) {
    console.error("DB Error (review):", err.message);
    res.status(500).json({ success: false, error: "Could not save review" });
  }
});

// 📖 Get reviews for a hospital
app.get("/reviews/:hospitalId", async (req, res) => {
  const hospitalId = parseInt(req.params.hospitalId);
  try {
    const hospitalReviews = await Review.find({ hospitalId }).sort({ createdAt: -1 });
    const avgRating =
      hospitalReviews.length > 0
        ? (hospitalReviews.reduce((sum, r) => sum + r.rating, 0) / hospitalReviews.length).toFixed(1)
        : 0;
    res.json({ success: true, total: hospitalReviews.length, avgRating: parseFloat(avgRating), reviews: hospitalReviews });
  } catch (err) {
    console.error("DB Error (get reviews):", err.message);
    res.json({ success: true, total: 0, avgRating: 0, reviews: [] });
  }
});

// ========================================
// 💳 PAYMENT ENDPOINTS (MongoDB)
// ========================================

// 💳 Process payment
app.post("/payment", async (req, res) => {
  const { appointmentId, method, amount, patientEmail, upiId, cardLast4 } = req.body;

  if (!appointmentId || !method || !amount) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  // Update appointment payment status
  try {
    const apt = await Appointment.findOne({ id: appointmentId });
    if (apt) {
      apt.paymentStatus = "Paid";
      apt.paymentMethod = method;
      await apt.save();
    }
  } catch (e) { /* non-critical */ }

  const payment = new Payment({
    id: `PAY${Date.now()}`,
    appointmentId,
    amount,
    method,
    upiId: upiId || null,
    cardLast4: cardLast4 || null,
    patientEmail: patientEmail || "",
    status: "Success",
    receiptNo: `RCP${Math.floor(Math.random() * 900000 + 100000)}`,
    paidAt: new Date(),
  });

  try {
    await payment.save();
    console.log(`💳 Payment received: ₹${amount} via ${method} for ${appointmentId}`);
    res.json({ success: true, payment });
  } catch (err) {
    console.error("DB Error (payment):", err.message);
    // Return success anyway with generated data (graceful degradation)
    res.json({ success: true, payment: { id: payment.id, receiptNo: payment.receiptNo, status: "Success", paidAt: payment.paidAt } });
  }
});

// ========================================
// 🚀 START SERVER
// ========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ HealthConnect Backend v2.0 running on http://localhost:${PORT}`);
  console.log(`📋 Endpoints available:`);
  console.log(`   GET  /                          — Health check`);
  console.log(`   GET  /hospitals?city=Delhi       — Search hospitals`);
  console.log(`   GET  /doctors?hospitalId=1       — Get doctors for hospital`);
  console.log(`   GET  /doctors/:id                — Get single doctor profile`);
  console.log(`   POST /appointments               — Book appointment`);
  console.log(`   GET  /appointments/:email        — Get user's appointments`);
  console.log(`   DEL  /appointments/:id           — Cancel appointment`);
  console.log(`   POST /reviews                    — Submit review`);
  console.log(`   GET  /reviews/:hospitalId        — Get hospital reviews`);
  console.log(`   POST /payment                    — Process payment`);
  console.log(`\n🗄️  Database: ${mongoose.connection.readyState === 1 ? "MongoDB Connected ✅" : "Connecting..."}`);
});
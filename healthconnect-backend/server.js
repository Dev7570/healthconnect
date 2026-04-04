const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 🗄️ Connect to MongoDB (In-Memory for demo, or real URI if provided)
const { MongoMemoryServer } = require("mongodb-memory-server");
async function connectDB() {
  let MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    const mongoServer = await MongoMemoryServer.create();
    MONGO_URI = mongoServer.getUri();
  }
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));
}
connectDB();

// 📝 Import Models
const Appointment = require("./models/Appointment");
const Review = require("./models/Review");
app.use(cors());
app.use(express.json());

const RAPIDAPI_KEY = process.env.GOOGLE_PLACES_API_KEY;

// 🏥 Search hospitals by city (GET - easy to test in browser)
app.get("/hospitals", async (req, res) => {
  const city = req.query.city || "New Delhi";

  try {
    const response = await axios.post(
      "https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchText",
      {
        textQuery: `hospitals in ${city}`,
        languageCode: "en",
      },
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

// ✅ Test route
app.get("/", (req, res) => {
  res.json({ message: "HealthConnect Backend is running! 🏥" });
});

// ========================================
// 🆕 NEW ENDPOINTS — APPENDED BELOW
// ========================================

// 📦 In-memory storage is replaced by MongoDB!
let appointmentIdCounter = 10000;

// 👨‍⚕️ Doctor database (realistic demo data)
const DOCTORS_DB = [
  { id: 1, name: "Dr. Priya Sharma", spec: "Cardiology", exp: 15, fee: 800, available: "Today", rating: 4.8, img: "👩‍⚕️", slots: ["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM"] },
  { id: 2, name: "Dr. Rajesh Kumar", spec: "Orthopedics", exp: 12, fee: 700, available: "Today", rating: 4.6, img: "👨‍⚕️", slots: ["9:30 AM","10:30 AM","2:30 PM","3:30 PM","4:00 PM"] },
  { id: 3, name: "Dr. Anita Desai", spec: "Neurology", exp: 18, fee: 1000, available: "Tomorrow", rating: 4.9, img: "👩‍⚕️", slots: ["10:00 AM","11:00 AM","2:00 PM","4:00 PM"] },
  { id: 4, name: "Dr. Vikram Singh", spec: "General Medicine", exp: 8, fee: 500, available: "Today", rating: 4.5, img: "👨‍⚕️", slots: ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","2:00 PM","2:30 PM","3:00 PM"] },
  { id: 5, name: "Dr. Meera Patel", spec: "Pediatrics", exp: 10, fee: 600, available: "Today", rating: 4.7, img: "👩‍⚕️", slots: ["9:00 AM","10:00 AM","11:00 AM","3:00 PM","4:00 PM"] },
  { id: 6, name: "Dr. Arjun Nair", spec: "Gastroenterology", exp: 14, fee: 900, available: "Tomorrow", rating: 4.4, img: "👨‍⚕️", slots: ["10:00 AM","11:00 AM","2:30 PM","3:30 PM"] },
  { id: 7, name: "Dr. Sunita Reddy", spec: "Oncology", exp: 20, fee: 1200, available: "Today", rating: 4.9, img: "👩‍⚕️", slots: ["9:30 AM","10:30 AM","2:00 PM"] },
  { id: 8, name: "Dr. Amit Joshi", spec: "Nephrology", exp: 11, fee: 750, available: "Today", rating: 4.3, img: "👨‍⚕️", slots: ["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"] },
  { id: 9, name: "Dr. Kavita Menon", spec: "Emergency", exp: 9, fee: 500, available: "Today", rating: 4.6, img: "👩‍⚕️", slots: ["9:00 AM","10:00 AM","2:00 PM","3:00 PM","4:00 PM"] },
  { id: 10, name: "Dr. Sanjay Gupta", spec: "Surgery", exp: 22, fee: 1500, available: "Tomorrow", rating: 4.8, img: "👨‍⚕️", slots: ["10:00 AM","11:00 AM","2:00 PM"] },
];

// 👨‍⚕️ Get doctors for a hospital (assigns 3-4 random doctors per hospital)
app.get("/doctors", (req, res) => {
  const hospitalId = parseInt(req.query.hospitalId) || 1;
  const spec = req.query.spec || "";

  // Assign doctors based on hospital ID (deterministic selection)
  const startIdx = (hospitalId - 1) % DOCTORS_DB.length;
  const count = 3 + (hospitalId % 2); // 3 or 4 doctors per hospital
  let doctors = [];
  for (let i = 0; i < count; i++) {
    const doc = { ...DOCTORS_DB[(startIdx + i * 3) % DOCTORS_DB.length] };
    doc.id = hospitalId * 100 + i + 1;
    doctors.push(doc);
  }

  if (spec && spec !== "All") {
    doctors = doctors.filter(d => d.spec.toLowerCase().includes(spec.toLowerCase()));
  }

  res.json({ success: true, doctors });
});

// 📅 Book an appointment (MongoDB)
app.post("/appointments", async (req, res) => {
  const { doctorName, doctorSpec, hospitalName, hospitalId, date, time, patientName, patientAge, patientEmail, reason, fee } = req.body;

  if (!doctorName || !hospitalName || !date || !time || !patientName || !patientEmail) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  // Generate a unique ID (in a real app, use UUID or Mongo _id)
  const idStr = `HC${Date.now()}`;
  
  try {
    const appointment = new Appointment({
      id: idStr,
      doctorName, doctorSpec, hospitalName, hospitalId,
      date, time, patientName, patientAge, patientEmail, reason, fee
    });
    
    await appointment.save();
    console.log(`📅 New appointment booked via Mongo: ${idStr}`);
    
    // Convert to plain object to return
    res.json({ success: true, appointment: appointment.toObject() });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ success: false, error: "Failed to book appointment" });
  }
});

// 📋 Get appointments for a user (MongoDB)
app.get("/appointments/:email", async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientEmail: req.params.email }).sort({ bookedAt: -1 });
    res.json({ success: true, total: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ❌ Cancel an appointment (MongoDB)
app.delete("/appointments/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { id: req.params.id },
      { status: "Cancelled" },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ⭐ Submit a review (MongoDB)
app.post("/reviews", async (req, res) => {
  const { hospitalId, hospitalName, userName, userEmail, rating, text } = req.body;
  if (!hospitalId || !rating || !text) return res.status(400).json({ success: false, error: "Missing required fields" });

  try {
    const review = new Review({
      id: Date.now(),
      hospitalId, hospitalName, userName, userEmail, rating, text
    });
    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📖 Get reviews for a hospital (MongoDB)
app.get("/reviews/:hospitalId", async (req, res) => {
  try {
    const hospitalReviews = await Review.find({ hospitalId: req.params.hospitalId }).sort({ createdAt: -1 });
    const avgRating = hospitalReviews.length > 0
      ? (hospitalReviews.reduce((sum, r) => sum + r.rating, 0) / hospitalReviews.length).toFixed(1)
      : 0;
    res.json({ success: true, total: hospitalReviews.length, avgRating: parseFloat(avgRating), reviews: hospitalReviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================
// 🛡️ ADMIN CORE — Manage Platform (MongoDB)
// ========================================

app.get("/admin/stats", async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const confirmedAppointments = await Appointment.countDocuments({ status: "Confirmed" });
    const cancelledAppointments = await Appointment.countDocuments({ status: "Cancelled" });
    const totalReviews = await Review.countDocuments();
    
    // Aggregation: most active hospitals
    const topHospitals = await Appointment.aggregate([
      { $group: { _id: "$hospitalName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    res.json({ 
      success: true, 
      stats: { totalAppointments, confirmedAppointments, cancelledAppointments, totalReviews, topHospitals } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/admin/appointments", async (req, res) => {
  try {
    // Get all appointments sorted by latest
    const appointments = await Appointment.find({}).sort({ bookedAt: -1 }).limit(100);
    res.json({ success: true, total: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================
// 🔒 ML API GATEWAY — Proxy to Python ML Service
// ========================================

const ML_API_URL = process.env.ML_API_URL || "http://localhost:5001";

// Simple rate limiter: max 10 predictions per minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  const entry = rateLimitMap.get(ip);
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_WINDOW;
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// 🧠 ML Health Check
app.get("/ml/health", async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/`);
    res.json(response.data);
  } catch (err) {
    res.status(503).json({ success: false, error: "ML service unavailable" });
  }
});

// 🧠 List ML Models
app.get("/ml/models", async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/models`);
    res.json(response.data);
  } catch (err) {
    res.status(503).json({ success: false, error: "ML service unavailable" });
  }
});

// 🧠 Run Prediction (rate-limited)
app.post("/ml/predict/:disease", async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ success: false, error: "Rate limit exceeded. Max 10 predictions per minute." });
  }

  const { disease } = req.params;
  try {
    const response = await axios.post(`${ML_API_URL}/predict/${disease}`, req.body, {
      headers: { "Content-Type": "application/json" },
    });
    console.log(`🧠 ML Prediction: ${disease} → ${response.data.risk_level} risk`);
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 503;
    const data = err.response?.data || { success: false, error: "ML service unavailable" };
    res.status(status).json(data);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ HealthConnect Backend running on http://localhost:${PORT}`);
  console.log(`📋 Endpoints available:`);
  console.log(`   GET  /hospitals?city=Delhi`);
  console.log(`   GET  /doctors?hospitalId=1`);
  console.log(`   POST /appointments`);
  console.log(`   GET  /appointments/:email`);
  console.log(`   DEL  /appointments/:id`);
  console.log(`   POST /reviews`);
  console.log(`   GET  /reviews/:hospitalId`);
  console.log(`   GET  /ml/health          — ML server health check`);
  console.log(`   GET  /ml/models          — List ML models`);
  console.log(`   POST /ml/predict/:disease — Run ML prediction`);
});
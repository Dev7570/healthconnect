const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const Appointment = require("./models/Appointment");
const Review = require("./models/Review");
const Payment = require("./models/Payment");

const app = express();

// ✅ FIXED CORS
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      "http://localhost:3000",
      "https://healthconnect-snowy.vercel.app",
      "https://healthconnect-frontend.vercel.app",
    ];
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any vercel.app domain
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    // Allow specific origins
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Preflight requests are handled by the global app.use(cors(...))

app.use(express.json());

const RAPIDAPI_KEY = process.env.GOOGLE_PLACES_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthconnect";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("⚠️  Server will continue with limited functionality");
  });

let appointmentIdCounter = 10000;

const DOCTORS_DB = [
  { id: 1, name: "Dr. Priya Sharma", spec: "Cardiology", exp: 15, fee: 800, available: "Today", rating: 4.8, img: "👩‍⚕️", slots: ["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM"] },
  { id: 2, name: "Dr. Rajesh Kumar", spec: "Orthopedics", exp: 12, fee: 700, available: "Today", rating: 4.6, img: "👨‍⚕️", slots: ["9:30 AM","10:30 AM","2:30 PM","3:30 PM","4:00 PM"] },
  { id: 3, name: "Dr. Anita Desai", spec: "Neurology", exp: 18, fee: 1000, available: "Tomorrow", rating: 4.9, img: "👩‍⚕️", slots: ["10:00 AM","11:00 AM","2:00 PM","4:00 PM"] },
  { id: 4, name: "Dr. Vikram Singh", spec: "General Medicine", exp: 8, fee: 500, available: "Today", rating: 4.5, img: "👨‍⚕️", slots: ["9:00 AM","9:30 AM","10:00 AM","2:00 PM","3:00 PM"] },
  { id: 5, name: "Dr. Meera Patel", spec: "Pediatrics", exp: 10, fee: 600, available: "Today", rating: 4.7, img: "👩‍⚕️", slots: ["9:00 AM","10:00 AM","11:00 AM","3:00 PM","4:00 PM"] },
  { id: 6, name: "Dr. Arjun Nair", spec: "Gastroenterology", exp: 14, fee: 900, available: "Tomorrow", rating: 4.4, img: "👨‍⚕️", slots: ["10:00 AM","11:00 AM","2:30 PM","3:30 PM"] },
  { id: 7, name: "Dr. Sunita Reddy", spec: "Oncology", exp: 20, fee: 1200, available: "Today", rating: 4.9, img: "👩‍⚕️", slots: ["9:30 AM","10:30 AM","2:00 PM"] },
  { id: 8, name: "Dr. Amit Joshi", spec: "Nephrology", exp: 11, fee: 750, available: "Today", rating: 4.3, img: "👨‍⚕️", slots: ["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM"] },
  { id: 9, name: "Dr. Kavita Menon", spec: "Emergency", exp: 9, fee: 500, available: "Today", rating: 4.6, img: "👩‍⚕️", slots: ["9:00 AM","10:00 AM","2:00 PM","3:00 PM","4:00 PM"] },
  { id: 10, name: "Dr. Sanjay Gupta", spec: "Surgery", exp: 22, fee: 1500, available: "Tomorrow", rating: 4.8, img: "👨‍⚕️", slots: ["10:00 AM","11:00 AM","2:00 PM"] },
];

// ✅ Health check
app.get("/", (req, res) => {
  res.json({
    message: "HealthConnect Backend is running! 🏥",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    version: "2.0.0",
  });
});

// 🏥 Search hospitals
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
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.id,places.currentOpeningHours,places.internationalPhoneNumber",
        },
      }
    );
    const places = response.data.places || [];
    const hospitals = places.map((place, index) => ({
      id: index + 1,
      name: place.displayName?.text || "Unknown Hospital",
      address: place.formattedAddress || "",
      area: place.formattedAddress?.split(",")[1]?.trim() || city,
      city,
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

// 👨‍⚕️ Get doctors for a hospital
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

// 👨‍⚕️ Get single doctor
app.get("/doctors/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const doc = DOCTORS_DB.find((d) => d.id === id);
  if (!doc) {
    const hospitalId = Math.floor(id / 100);
    const idx = (id % 100) - 1;
    const startIdx = (hospitalId - 1) % DOCTORS_DB.length;
    const source = DOCTORS_DB[(startIdx + idx * 3) % DOCTORS_DB.length];
    if (source) return res.json({ success: true, doctor: { ...source, id } });
    return res.status(404).json({ success: false, error: "Doctor not found" });
  }
  res.json({ success: true, doctor: doc });
});

// 📅 Book appointment
app.post("/appointments", async (req, res) => {
  const { doctorName, doctorSpec, hospitalName, hospitalId, date, time, patientName, patientAge, patientEmail, patientPhone, reason, fee } = req.body;
  if (!doctorName || !hospitalName || !date || !time || !patientName || !patientEmail) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  appointmentIdCounter++;
  const appointment = new Appointment({
    id: `HC${appointmentIdCounter}`,
    doctorName, doctorSpec: doctorSpec || "General", hospitalName,
    hospitalId: hospitalId || 0, date, time, patientName,
    patientAge: patientAge || "N/A", patientEmail,
    patientPhone: patientPhone || "",
    reason: reason || "General Consultation",
    fee: fee || 500, status: "Confirmed", bookedAt: new Date(),
  });
  try {
    await appointment.save();
    console.log(`📅 Appointment booked: ${appointment.id}`);
    res.json({ success: true, appointment });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ success: false, error: "Could not save appointment" });
  }
});

// 📋 Get user appointments
app.get("/appointments/:email", async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientEmail: req.params.email }).sort({ bookedAt: -1 });
    res.json({ success: true, total: appointments.length, appointments });
  } catch (err) {
    res.json({ success: true, total: 0, appointments: [] });
  }
});

// ❌ Cancel appointment
app.delete("/appointments/:id", async (req, res) => {
  try {
    const apt = await Appointment.findOne({ id: req.params.id });
    if (!apt) return res.status(404).json({ success: false, error: "Not found" });
    apt.status = "Cancelled";
    await apt.save();
    res.json({ success: true, appointment: apt });
  } catch (err) {
    res.status(500).json({ success: false, error: "Could not cancel" });
  }
});

// ⭐ Submit review
app.post("/reviews", async (req, res) => {
  const { hospitalId, hospitalName, userName, userEmail, rating, text } = req.body;
  if (!hospitalId || !rating || !text) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  const review = new Review({
    hospitalId, hospitalName: hospitalName || "Hospital",
    userName: userName || "Anonymous", userEmail: userEmail || "",
    rating, text, createdAt: new Date(),
  });
  try {
    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, error: "Could not save review" });
  }
});

// 📖 Get reviews
app.get("/reviews/:hospitalId", async (req, res) => {
  try {
    const reviews = await Review.find({ hospitalId: parseInt(req.params.hospitalId) }).sort({ createdAt: -1 });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
    res.json({ success: true, total: reviews.length, avgRating: parseFloat(avgRating), reviews });
  } catch (err) {
    res.json({ success: true, total: 0, avgRating: 0, reviews: [] });
  }
});

// 💳 Process payment
app.post("/payment", async (req, res) => {
  const { appointmentId, method, amount, patientEmail, upiId, cardLast4 } = req.body;
  if (!appointmentId || !method || !amount) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  const payment = new Payment({
    id: `PAY${Date.now()}`, appointmentId, amount, method,
    upiId: upiId || null, cardLast4: cardLast4 || null,
    patientEmail: patientEmail || "", status: "Success",
    receiptNo: `RCP${Math.floor(Math.random() * 900000 + 100000)}`,
    paidAt: new Date(),
  });
  try {
    await payment.save();
    console.log(`💳 Payment: ₹${amount} via ${method}`);
    res.json({ success: true, payment });
  } catch (err) {
    res.json({ success: true, payment: { id: payment.id, receiptNo: payment.receiptNo, status: "Success" } });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ HealthConnect Backend v2.0 running on http://localhost:${PORT}`);
  console.log(`🗄️  Database: Connecting to MongoDB...`);
});
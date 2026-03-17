import { useState } from "react";

const HOSPITALS = [
  {
    id: 1,
    name: "Apollo Hospitals",
    type: "Multi-Specialty",
    address: "Sarita Vihar, Delhi Mathura Road, New Delhi",
    area: "Sarita Vihar",
    city: "New Delhi",
    rating: 4.7,
    reviews: 2341,
    image: "🏥",
    color: "#0066CC",
    established: 1983,
    beds: 710,
    specialities: ["Cardiology", "Oncology", "Neurology", "Orthopedics", "Nephrology"],
    lat: 28.5355,
    lng: 77.2846,
    openNow: true,
    timings: "24/7",
    doctors: [
      { id: 1, name: "Dr. Rajesh Sharma", spec: "Cardiologist", exp: 18, fee: 1200, available: "Today", rating: 4.8, img: "👨‍⚕️" },
      { id: 2, name: "Dr. Priya Menon", spec: "Neurologist", exp: 14, fee: 1500, available: "Tomorrow", rating: 4.9, img: "👩‍⚕️" },
      { id: 3, name: "Dr. Anil Kapoor", spec: "Orthopedic", exp: 22, fee: 1000, available: "Today", rating: 4.6, img: "👨‍⚕️" },
    ],
    tests: [
      { name: "Blood Test (CBC)", price: 350 },
      { name: "MRI Brain", price: 7500 },
      { name: "CT Scan Chest", price: 4500 },
      { name: "ECG", price: 200 },
      { name: "X-Ray", price: 300 },
      { name: "Lipid Profile", price: 500 },
    ],
    reviewsList: [
      { user: "Amit K.", rating: 5, comment: "Excellent care, very professional staff.", date: "Jan 2025" },
      { user: "Sunita R.", rating: 4, comment: "Good facilities but waiting time was long.", date: "Dec 2024" },
      { user: "Rahul M.", rating: 5, comment: "Saved my father's life. Forever grateful.", date: "Nov 2024" },
    ],
  },
  {
    id: 2,
    name: "Fortis Memorial",
    type: "Super-Specialty",
    address: "Sector 44, Opposite HUDA City Centre, Gurugram",
    area: "Sector 44",
    city: "Gurugram",
    rating: 4.5,
    reviews: 1876,
    image: "🏨",
    color: "#E8432D",
    established: 2001,
    beds: 310,
    specialities: ["Cardiac Sciences", "Oncology", "Pediatrics", "Gastroenterology"],
    lat: 28.4595,
    lng: 77.0266,
    openNow: true,
    timings: "24/7",
    doctors: [
      { id: 4, name: "Dr. Neha Singh", spec: "Pediatrician", exp: 12, fee: 900, available: "Today", rating: 4.7, img: "👩‍⚕️" },
      { id: 5, name: "Dr. Vivek Raj", spec: "Gastroenterologist", exp: 16, fee: 1300, available: "Today", rating: 4.5, img: "👨‍⚕️" },
    ],
    tests: [
      { name: "Blood Test (CBC)", price: 280 },
      { name: "MRI Brain", price: 6800 },
      { name: "CT Scan Chest", price: 4000 },
      { name: "ECG", price: 180 },
      { name: "X-Ray", price: 250 },
      { name: "Lipid Profile", price: 450 },
    ],
    reviewsList: [
      { user: "Kavita P.", rating: 5, comment: "Best pediatric ward in Gurugram.", date: "Feb 2025" },
      { user: "Deepak T.", rating: 4, comment: "Good doctors, average food quality.", date: "Jan 2025" },
    ],
  },
  {
    id: 3,
    name: "Max Super Speciality",
    type: "Super-Specialty",
    address: "1 Press Enclave Road, Saket, New Delhi",
    area: "Saket",
    city: "New Delhi",
    rating: 4.6,
    reviews: 3102,
    image: "🏦",
    color: "#00A651",
    established: 2000,
    beds: 500,
    specialities: ["Oncology", "Bone Marrow Transplant", "Robotic Surgery", "Nephrology"],
    lat: 28.5244,
    lng: 77.2066,
    openNow: true,
    timings: "24/7",
    doctors: [
      { id: 6, name: "Dr. Suresh Gupta", spec: "Oncologist", exp: 25, fee: 2000, available: "Tomorrow", rating: 4.9, img: "👨‍⚕️" },
      { id: 7, name: "Dr. Meera Bose", spec: "Nephrologist", exp: 19, fee: 1800, available: "Today", rating: 4.8, img: "👩‍⚕️" },
    ],
    tests: [
      { name: "Blood Test (CBC)", price: 320 },
      { name: "MRI Brain", price: 8200 },
      { name: "CT Scan Chest", price: 5000 },
      { name: "ECG", price: 220 },
      { name: "X-Ray", price: 280 },
      { name: "Lipid Profile", price: 480 },
    ],
    reviewsList: [
      { user: "Priya S.", rating: 5, comment: "Robotic surgery went perfectly. Outstanding team.", date: "Feb 2025" },
      { user: "Anoop V.", rating: 4, comment: "Billing process is complicated.", date: "Jan 2025" },
      { user: "Geeta L.", rating: 5, comment: "Cancer treatment care was exceptional.", date: "Dec 2024" },
    ],
  },
  {
    id: 4,
    name: "AIIMS Delhi",
    type: "Government / Research",
    address: "Ansari Nagar East, New Delhi",
    area: "Ansari Nagar",
    city: "New Delhi",
    rating: 4.4,
    reviews: 8921,
    image: "🏛️",
    color: "#6B21A8",
    established: 1956,
    beds: 2478,
    specialities: ["All Specialties", "Research", "Trauma", "Burns", "Transplant"],
    lat: 28.5672,
    lng: 77.21,
    openNow: true,
    timings: "24/7 Emergency | OPD: 8AM–1PM",
    doctors: [
      { id: 8, name: "Dr. Ramesh Chandra", spec: "Trauma Surgeon", exp: 30, fee: 100, available: "Today", rating: 4.7, img: "👨‍⚕️" },
      { id: 9, name: "Dr. Asha Iyer", spec: "Dermatologist", exp: 20, fee: 100, available: "Thu", rating: 4.6, img: "👩‍⚕️" },
    ],
    tests: [
      { name: "Blood Test (CBC)", price: 80 },
      { name: "MRI Brain", price: 3000 },
      { name: "CT Scan Chest", price: 1800 },
      { name: "ECG", price: 50 },
      { name: "X-Ray", price: 80 },
      { name: "Lipid Profile", price: 120 },
    ],
    reviewsList: [
      { user: "Mukesh D.", rating: 5, comment: "Best government hospital. World-class doctors.", date: "Feb 2025" },
      { user: "Sania K.", rating: 3, comment: "Long queues but treatment quality is top-notch.", date: "Jan 2025" },
    ],
  },
];

const ALL_TESTS = ["Blood Test (CBC)", "MRI Brain", "CT Scan Chest", "ECG", "X-Ray", "Lipid Profile"];

const SPECIALITIES = ["All", "Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "Nephrology", "Dermatology"];

const TIME_SLOTS = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];

function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? "#F59E0B" : "#D1D5DB" }}>★</span>
      ))}
    </span>
  );
}

function Badge({ children, color = "#EFF6FF", text = "#1D4ED8" }) {
  return (
    <span style={{ background: color, color: text, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function MapView({ hospitals, selectedId, onSelect }) {
  const colors = ["#0066CC", "#E8432D", "#00A651", "#6B21A8"];
  return (
    <div style={{ background: "#E8F4F8", borderRadius: 16, overflow: "hidden", height: 420, position: "relative", border: "1px solid #CBD5E1", fontFamily: "inherit" }}>
      {/* Fake map grid */}
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
        {[...Array(12)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 35} x2="100%" y2={i * 35} stroke="#D1FAE5" strokeWidth="1" />
        ))}
        {[...Array(20)].map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="100%" stroke="#D1FAE5" strokeWidth="1" />
        ))}
        {/* Roads */}
        <line x1="0" y1="210" x2="100%" y2="210" stroke="#BFDBFE" strokeWidth="8" opacity="0.7" />
        <line x1="350" y1="0" x2="350" y2="100%" stroke="#BFDBFE" strokeWidth="8" opacity="0.7" />
        <line x1="0" y1="130" x2="100%" y2="130" stroke="#E0E7FF" strokeWidth="4" opacity="0.5" />
        <line x1="550" y1="0" x2="550" y2="100%" stroke="#E0E7FF" strokeWidth="4" opacity="0.5" />
        {/* Hospital markers */}
        {hospitals.map((h, i) => {
          const positions = [{ x: 280, y: 200 }, { x: 120, y: 300 }, { x: 480, y: 160 }, { x: 600, y: 250 }];
          const pos = positions[i] || { x: 200 + i * 100, y: 200 };
          const isSelected = h.id === selectedId;
          return (
            <g key={h.id} onClick={() => onSelect(h.id)} style={{ cursor: "pointer" }}>
              <circle cx={pos.x} cy={pos.y} r={isSelected ? 22 : 16} fill={colors[i]} opacity={isSelected ? 1 : 0.8} />
              <circle cx={pos.x} cy={pos.y} r={isSelected ? 26 : 0} fill={colors[i]} opacity="0.2" />
              <text x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize="14" fill="white">🏥</text>
              <rect x={pos.x - 55} y={pos.y - 42} width="110" height="22" rx="6" fill="white" stroke={colors[i]} strokeWidth="1.5" />
              <text x={pos.x} y={pos.y - 26} textAnchor="middle" fontSize="10" fontWeight="700" fill={colors[i]}>
                {h.name.split(" ").slice(0, 2).join(" ")}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Map attribution */}
      <div style={{ position: "absolute", bottom: 8, right: 12, background: "white", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#94A3B8", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
        📍 Map Preview (Google Maps Integration)
      </div>
      <div style={{ position: "absolute", top: 12, left: 12, background: "white", borderRadius: 10, padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 12, color: "#374151" }}>
        <strong>Delhi NCR</strong> — {hospitals.length} hospitals shown
      </div>
    </div>
  );
}

function BookingModal({ doctor, hospital, onClose }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("Mon, 24 Feb");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [reason, setReason] = useState("");
  const [booked, setBooked] = useState(false);
  const dates = ["Mon, 24 Feb", "Tue, 25 Feb", "Wed, 26 Feb", "Thu, 27 Feb", "Fri, 28 Feb"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "linear-gradient(135deg, #0F4C81, #1E88E5)", padding: "20px 24px", borderRadius: "20px 20px 0 0", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Booking Appointment</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{doctor.name}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{doctor.spec} · {hospital.name}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "6px 10px", color: "white", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: step >= s ? "white" : "rgba(255,255,255,0.3)", color: step >= s ? "#1E88E5" : "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, transition: "all 0.3s" }}>{s}</div>
                <span style={{ fontSize: 11, opacity: step >= s ? 1 : 0.6 }}>{["Date & Time", "Details", "Confirm"][s - 1]}</span>
                {s < 3 && <span style={{ opacity: 0.4 }}>›</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {!booked ? (
            <>
              {step === 1 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>Select Date</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    {dates.map(d => (
                      <button key={d} onClick={() => setSelectedDate(d)} style={{ padding: "8px 14px", borderRadius: 10, border: selectedDate === d ? "2px solid #1E88E5" : "2px solid #E5E7EB", background: selectedDate === d ? "#EFF6FF" : "white", color: selectedDate === d ? "#1E88E5" : "#6B7280", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{d}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>Select Time Slot</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
                    {TIME_SLOTS.map(slot => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)} style={{ padding: "10px 6px", borderRadius: 10, border: selectedSlot === slot ? "2px solid #1E88E5" : "2px solid #E5E7EB", background: selectedSlot === slot ? "#EFF6FF" : "white", color: selectedSlot === slot ? "#1E88E5" : "#374151", fontWeight: selectedSlot === slot ? 700 : 400, fontSize: 13, cursor: "pointer" }}>{slot}</button>
                    ))}
                  </div>
                  <button onClick={() => selectedSlot && setStep(2)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: selectedSlot ? "linear-gradient(135deg, #0F4C81, #1E88E5)" : "#E5E7EB", color: selectedSlot ? "white" : "#9CA3AF", fontWeight: 700, fontSize: 15, cursor: selectedSlot ? "pointer" : "not-allowed" }}>
                    Continue →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#374151" }}>Patient Information</div>
                  {[["Full Name", patientName, setPatientName, "text"], ["Age", patientAge, setPatientAge, "number"]].map(([label, val, setter, type]) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 6 }}>{label}</label>
                      <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={label === "Full Name" ? "Enter patient name" : "Enter age"}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                        onFocus={e => e.target.style.borderColor = "#1E88E5"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 6 }}>Reason for Visit</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Briefly describe your symptoms..."
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 14, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box", fontFamily: "inherit" }}
                      onFocus={e => e.target.style.borderColor = "#1E88E5"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStep(1)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "2px solid #E5E7EB", background: "white", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>← Back</button>
                    <button onClick={() => patientName && setStep(3)} style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0F4C81, #1E88E5)", color: "white", fontWeight: 700, fontSize: 15, cursor: patientName ? "pointer" : "not-allowed" }}>Review →</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div style={{ background: "#F8FAFC", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#0F4C81" }}>Appointment Summary</div>
                    {[["Doctor", doctor.name], ["Speciality", doctor.spec], ["Hospital", hospital.name], ["Date", selectedDate], ["Time", selectedSlot], ["Patient", patientName], ["Consultation Fee", `₹${doctor.fee}`]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                        <span style={{ color: "#6B7280" }}>{k}</span>
                        <span style={{ fontWeight: 600, color: k === "Consultation Fee" ? "#059669" : "#111827" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid #E5E7EB", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                      <span>Total Amount</span><span style={{ color: "#0F4C81" }}>₹{doctor.fee}</span>
                    </div>
                  </div>
                  <div style={{ background: "#FFFBEB", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400E" }}>
                    💳 Payment will be collected at the hospital during your visit.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStep(2)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "2px solid #E5E7EB", background: "white", color: "#374151", fontWeight: 600, cursor: "pointer" }}>← Back</button>
                    <button onClick={() => setBooked(true)} style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #059669, #10B981)", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Confirm Booking ✓</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginBottom: 8 }}>Booking Confirmed!</div>
              <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>Appointment ID: <strong style={{ color: "#111827" }}>HC{Math.floor(Math.random() * 90000 + 10000)}</strong></div>
              <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>A confirmation SMS will be sent to your registered number</div>
              <div style={{ background: "#F0FDF4", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: "#065F46" }}>📋 Appointment Details</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
                  <div>{doctor.name} · {doctor.spec}</div>
                  <div>{hospital.name}</div>
                  <div><strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong></div>
                </div>
              </div>
              <button onClick={onClose} style={{ padding: "12px 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0F4C81, #1E88E5)", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home"); // home | list | detail | compare | map
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [mapSelected, setMapSelected] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [activeTab, setActiveTab] = useState("doctors");
  const [selectedTests, setSelectedTests] = useState(["Blood Test (CBC)", "MRI Brain"]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [animIn, setAnimIn] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [notification, setNotification] = useState(null);

  const filtered = HOSPITALS.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q) || h.specialities.some(s => s.toLowerCase().includes(q));
    const matchSpec = specFilter === "All" || h.specialities.some(s => s === specFilter);
    return matchSearch && matchSpec;
  }).sort((a, b) => sortBy === "rating" ? b.rating - a.rating : b.reviews - a.reviews);

  const navigate = (v, hospital = null) => {
    setAnimIn(false);
    setTimeout(() => {
      setView(v);
      if (hospital) setSelectedHospital(hospital);
      setAnimIn(true);
    }, 150);
  };

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleTest = (t) => {
    setSelectedTests(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const styles = {
    app: { fontFamily: "'Nunito', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#F1F5F9", color: "#111827" },
    nav: { background: "linear-gradient(135deg, #0F4C81 0%, #1565C0 100%)", padding: "0 20px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(15,76,129,0.4)" },
    navInner: { maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, height: 60 },
    logo: { color: "white", fontWeight: 900, fontSize: 20, cursor: "pointer", letterSpacing: -0.5 },
    navLink: { color: "rgba(255,255,255,0.8)", fontSize: 14, cursor: "pointer", fontWeight: 600, padding: "6px 12px", borderRadius: 8, transition: "all 0.2s" },
    page: { maxWidth: 1100, margin: "0 auto", padding: "24px 20px", transition: "opacity 0.15s", opacity: animIn ? 1 : 0 },
    card: { background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" },
    btn: { padding: "10px 20px", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.2s" },
    input: { padding: "12px 16px", borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  };

  return (
    <div style={styles.app}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Notification */}
      {notification && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#065F46", color: "white", padding: "12px 20px", borderRadius: 12, zIndex: 9999, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "slideIn 0.3s ease" }}>
          ✓ {notification}
        </div>
      )}

      {/* Booking Modal */}
      {bookingDoctor && selectedHospital && (
        <BookingModal doctor={bookingDoctor} hospital={selectedHospital} onClose={() => setBookingDoctor(null)} />
      )}

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => navigate("home")}>
            🩺 HealthConnect
          </div>
          <div style={{ flex: 1 }} />
          {[["Hospitals", "list"], ["Compare Tests", "compare"], ["Map View", "map"]].map(([label, v]) => (
            <span key={v} onClick={() => navigate(v)} style={{ ...styles.navLink, background: view === v ? "rgba(255,255,255,0.2)" : "transparent", color: "white" }}>{label}</span>
          ))}
          <button style={{ ...styles.btn, background: "white", color: "#0F4C81", fontSize: 13, padding: "8px 16px" }}>Sign In</button>
        </div>
      </nav>

      <div style={styles.page}>
        {/* =========== HOME =========== */}
        {view === "home" && (
          <div>
            {/* Hero */}
            <div style={{ background: "linear-gradient(135deg, #0F4C81 0%, #1565C0 60%, #42A5F5 100%)", borderRadius: 20, padding: "48px 40px", marginBottom: 32, color: "white", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: 40, top: -20, fontSize: 120, opacity: 0.08 }}>🏥</div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, opacity: 0.7, marginBottom: 12, textTransform: "uppercase" }}>Delhi NCR's Healthcare Platform</div>
              <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 900, lineHeight: 1.2 }}>Find Hospitals,<br />Book Appointments</h1>
              <p style={{ margin: "0 0 28px", opacity: 0.85, fontSize: 16, maxWidth: 500 }}>Compare doctors, test prices, and ratings across all major hospitals — all in one place.</p>
              <div style={{ display: "flex", gap: 12, maxWidth: 600 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
                  <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); navigate("list"); } }}
                    placeholder="Hospital, doctor, speciality..."
                    style={{ ...styles.input, paddingLeft: 44, borderColor: "transparent", background: "rgba(255,255,255,0.95)", borderRadius: 12, fontSize: 15 }} />
                </div>
                <button onClick={() => { setSearch(searchInput); navigate("list"); }}
                  style={{ ...styles.btn, background: "#F59E0B", color: "#111827", fontSize: 15, padding: "12px 28px", borderRadius: 12, boxShadow: "0 4px 15px rgba(245,158,11,0.4)" }}>
                  Search
                </button>
              </div>
              {/* Quick speciality pills */}
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {["Cardiology", "Neurology", "Orthopedics", "Oncology"].map(s => (
                  <span key={s} onClick={() => { setSpecFilter(s); navigate("list"); }}
                    style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              {[["4", "Hospitals Listed", "#EFF6FF", "#1E88E5"], ["42", "Doctors Available", "#F0FDF4", "#10B981"], ["6", "Tests to Compare", "#FFFBEB", "#F59E0B"], ["24/7", "Emergency Support", "#FFF1F2", "#EF4444"]].map(([val, label, bg, clr]) => (
                <div key={label} style={{ background: bg, borderRadius: 14, padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: clr }}>{val}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Featured hospitals */}
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Featured Hospitals</h2>
              <span onClick={() => navigate("list")} style={{ color: "#1E88E5", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>View All →</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {HOSPITALS.map(h => (
                <div key={h.id} style={styles.card} onClick={() => navigate("detail", h)}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}>
                  <div style={{ background: `linear-gradient(135deg, ${h.color}22, ${h.color}11)`, padding: "18px 20px", borderBottom: `3px solid ${h.color}30` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{h.name}</div>
                        <Badge color={`${h.color}18`} text={h.color}>{h.type}</Badge>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: h.color }}>{h.rating} ⭐</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{h.reviews.toLocaleString()} reviews</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "14px 20px" }}>
                    <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>📍 {h.area}, {h.city}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {h.specialities.slice(0, 3).map(s => <Badge key={s}>{s}</Badge>)}
                      {h.specialities.length > 3 && <Badge>+{h.specialities.length - 3}</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Compare CTA */}
            <div style={{ marginTop: 24, background: "linear-gradient(135deg, #1B5E20, #388E3C)", borderRadius: 16, padding: "24px 28px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>💊 Compare Test Prices</div>
                <div style={{ opacity: 0.85, fontSize: 14 }}>Find the most affordable test across hospitals</div>
              </div>
              <button onClick={() => navigate("compare")} style={{ ...styles.btn, background: "white", color: "#1B5E20", padding: "12px 24px" }}>Compare Now →</button>
            </div>
          </div>
        )}

        {/* =========== HOSPITAL LIST =========== */}
        {view === "list" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 22 }}>Hospitals in Delhi NCR</h2>
            {/* Filters */}
            <div style={{ background: "white", borderRadius: 14, padding: 18, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hospitals..."
                  style={{ ...styles.input, paddingLeft: 36, borderRadius: 10 }} />
              </div>
              <select value={specFilter} onChange={e => setSpecFilter(e.target.value)}
                style={{ padding: "12px 16px", borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 14, background: "white", cursor: "pointer", fontFamily: "inherit" }}>
                {SPECIALITIES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: "12px 16px", borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 14, background: "white", cursor: "pointer", fontFamily: "inherit" }}>
                <option value="rating">Sort: Best Rated</option>
                <option value="reviews">Sort: Most Reviewed</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filtered.map(h => (
                <div key={h.id} style={styles.card} onClick={() => navigate("detail", h)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}>
                  <div style={{ padding: "18px 22px", display: "flex", gap: 16, alignItems: "start" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: `${h.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{h.image}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{h.name}</div>
                          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>📍 {h.address}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Badge color={`${h.color}18`} text={h.color}>{h.type}</Badge>
                            {h.openNow && <Badge color="#F0FDF4" text="#15803D">🟢 Open Now</Badge>}
                            <Badge color="#F8FAFC" text="#64748B">🛏 {h.beds} Beds</Badge>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginBottom: 4 }}>
                            <StarRating rating={h.rating} size={16} />
                            <span style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>{h.rating}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#9CA3AF" }}>{h.reviews.toLocaleString()} reviews</div>
                          <button onClick={e => { e.stopPropagation(); navigate("detail", h); }}
                            style={{ ...styles.btn, background: `linear-gradient(135deg, ${h.color}, ${h.color}99)`, color: "white", marginTop: 10, padding: "8px 18px", fontSize: 13 }}>
                            Book Now
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {h.specialities.slice(0, 4).map(s => <Badge key={s}>{s}</Badge>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>No hospitals found</div>
                  <div style={{ fontSize: 14 }}>Try a different search term</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========== HOSPITAL DETAIL =========== */}
        {view === "detail" && selectedHospital && (
          <div>
            <button onClick={() => navigate("list")} style={{ ...styles.btn, background: "white", color: "#374151", border: "2px solid #E5E7EB", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              ← Back to List
            </button>

            {/* Hospital Header */}
            <div style={{ background: `linear-gradient(135deg, ${selectedHospital.color} 0%, ${selectedHospital.color}BB 100%)`, borderRadius: 20, padding: "32px", marginBottom: 24, color: "white" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "start" }}>
                <div style={{ fontSize: 56 }}>{selectedHospital.image}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>{selectedHospital.name}</div>
                  <div style={{ opacity: 0.85, fontSize: 14, marginBottom: 12 }}>📍 {selectedHospital.address}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{selectedHospital.type}</span>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>Est. {selectedHospital.established}</span>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>🛏 {selectedHospital.beds} Beds</span>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>⏰ {selectedHospital.timings}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 36, fontWeight: 900 }}>{selectedHospital.rating}</div>
                  <StarRating rating={selectedHospital.rating} size={18} />
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{selectedHospital.reviews.toLocaleString()} reviews</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 12, padding: 6, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              {["doctors", "tests", "reviews", "location"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s",
                    background: activeTab === tab ? `linear-gradient(135deg, ${selectedHospital.color}, ${selectedHospital.color}BB)` : "transparent",
                    color: activeTab === tab ? "white" : "#6B7280" }}>
                  {tab === "doctors" ? "👨‍⚕️ Doctors" : tab === "tests" ? "🧪 Tests & Fees" : tab === "reviews" ? "⭐ Reviews" : "📍 Location"}
                </button>
              ))}
            </div>

            {/* Doctors Tab */}
            {activeTab === "doctors" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {selectedHospital.doctors.map(doc => (
                  <div key={doc.id} style={{ ...styles.card, cursor: "default" }}>
                    <div style={{ padding: "18px 22px", display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 54, height: 54, borderRadius: "50%", background: `${selectedHospital.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{doc.img}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 3 }}>{doc.name}</div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <Badge color={`${selectedHospital.color}14`} text={selectedHospital.color}>{doc.spec}</Badge>
                          <Badge color="#F8FAFC" text="#475569">{doc.exp} yrs exp</Badge>
                          <Badge color="#FFFBEB" text="#92400E">Available: {doc.available}</Badge>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <StarRating rating={doc.rating} />
                          <span style={{ fontSize: 13, color: "#6B7280" }}>{doc.rating}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#0F4C81", marginBottom: 4 }}>₹{doc.fee}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10 }}>Consultation</div>
                        <button onClick={() => setBookingDoctor(doc)}
                          style={{ ...styles.btn, background: `linear-gradient(135deg, ${selectedHospital.color}, ${selectedHospital.color}BB)`, color: "white", padding: "10px 20px" }}>
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tests Tab */}
            {activeTab === "tests" && (
              <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ background: "#F8FAFC", padding: "14px 22px", fontWeight: 800, fontSize: 15, color: "#374151", borderBottom: "1px solid #E5E7EB", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <span>Test Name</span><span style={{ textAlign: "right" }}>Price (₹)</span>
                </div>
                {selectedHospital.tests.map((t, i) => (
                  <div key={t.name} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "14px 22px", borderBottom: i < selectedHospital.tests.length - 1 ? "1px solid #F1F5F9" : "none", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <span style={{ fontWeight: 600 }}>🧪 {t.name}</span>
                    <span style={{ textAlign: "right", fontWeight: 800, color: "#059669", fontSize: 16 }}>₹{t.price}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                {/* Rating Summary */}
                <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", gap: 24, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 52, fontWeight: 900, color: selectedHospital.color, lineHeight: 1 }}>{selectedHospital.rating}</div>
                    <StarRating rating={selectedHospital.rating} size={20} />
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{selectedHospital.reviews.toLocaleString()} reviews</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map(s => (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#6B7280", width: 6 }}>{s}</span>
                        <span style={{ color: "#F59E0B", fontSize: 12 }}>★</span>
                        <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 8 }}>
                          <div style={{ width: `${[70, 20, 6, 2, 2][5 - s]}%`, height: "100%", background: selectedHospital.color, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#9CA3AF", width: 28 }}>{[70, 20, 6, 2, 2][5 - s]}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Write a Review */}
                <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Write a Review</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} onClick={() => setReviewRating(s)} style={{ fontSize: 28, cursor: "pointer", color: s <= reviewRating ? "#F59E0B" : "#D1D5DB", transition: "color 0.1s" }}>★</span>
                    ))}
                  </div>
                  <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience at this hospital..."
                    style={{ ...styles.input, minHeight: 80, resize: "vertical", borderRadius: 10 }} />
                  <button onClick={() => { if (reviewText) { showNotif("Review submitted! Thank you."); setReviewText(""); setReviewRating(5); } }}
                    style={{ ...styles.btn, background: `linear-gradient(135deg, ${selectedHospital.color}, ${selectedHospital.color}99)`, color: "white", marginTop: 10 }}>
                    Submit Review
                  </button>
                </div>

                {/* Reviews List */}
                {selectedHospital.reviewsList.map((r, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 14, padding: "16px 20px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${selectedHospital.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: selectedHospital.color }}>
                          {r.user[0]}
                        </div>
                        <span style={{ fontWeight: 700 }}>{r.user}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>{r.date}</span>
                    </div>
                    <StarRating rating={r.rating} />
                    <p style={{ margin: "8px 0 0", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <div>
                <MapView hospitals={[selectedHospital]} selectedId={selectedHospital.id} onSelect={() => { }} />
                <div style={{ background: "white", borderRadius: 14, padding: "16px 20px", marginTop: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>📍 {selectedHospital.name}</div>
                  <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 14 }}>{selectedHospital.address}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={{ ...styles.btn, background: "#1E88E5", color: "white", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      🗺️ Open in Google Maps
                    </button>
                    <button style={{ ...styles.btn, background: "#F0FDF4", color: "#15803D", flex: 1, border: "2px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      📞 Call Hospital
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========== TEST PRICE COMPARE =========== */}
        {view === "compare" && (
          <div>
            <h2 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 22 }}>🧪 Test Price Comparison</h2>
            <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 15 }}>Select tests to compare prices across all hospitals</p>

            {/* Test selector */}
            <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Select Tests to Compare</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ALL_TESTS.map(t => (
                  <button key={t} onClick={() => toggleTest(t)}
                    style={{ padding: "8px 16px", borderRadius: 20, border: selectedTests.includes(t) ? "2px solid #1E88E5" : "2px solid #E5E7EB", background: selectedTests.includes(t) ? "#EFF6FF" : "white", color: selectedTests.includes(t) ? "#1E88E5" : "#374151", fontWeight: selectedTests.includes(t) ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                    {selectedTests.includes(t) ? "✓ " : ""}{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Comparison Table */}
            {selectedTests.length > 0 && (
              <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "linear-gradient(135deg, #0F4C81, #1565C0)" }}>
                        <th style={{ padding: "16px 20px", textAlign: "left", color: "white", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>Test Name</th>
                        {HOSPITALS.map(h => (
                          <th key={h.id} style={{ padding: "16px 20px", textAlign: "center", color: "white", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", minWidth: 130 }}>
                            <div>{h.name.split(" ").slice(0, 2).join(" ")}</div>
                            <div style={{ opacity: 0.7, fontSize: 11, fontWeight: 500 }}>{h.type}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTests.map((test, ti) => {
                        const prices = HOSPITALS.map(h => h.tests.find(t => t.name === test)?.price ?? null).filter(Boolean);
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        return (
                          <tr key={test} style={{ background: ti % 2 === 0 ? "white" : "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "14px 20px", fontWeight: 700, fontSize: 14 }}>🧪 {test}</td>
                            {HOSPITALS.map(h => {
                              const testData = h.tests.find(t => t.name === test);
                              if (!testData) return <td key={h.id} style={{ padding: "14px 20px", textAlign: "center", color: "#D1D5DB" }}>—</td>;
                              const isCheapest = testData.price === minPrice;
                              const isMostExpensive = testData.price === maxPrice;
                              return (
                                <td key={h.id} style={{ padding: "14px 20px", textAlign: "center" }}>
                                  <div style={{ fontWeight: 800, fontSize: 16, color: isCheapest ? "#059669" : isMostExpensive ? "#DC2626" : "#111827" }}>₹{testData.price}</div>
                                  {isCheapest && <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginTop: 2 }}>✓ CHEAPEST</div>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "14px 20px", background: "#FFFBEB", display: "flex", gap: 24, borderTop: "1px solid #FDE68A" }}>
                  <span style={{ fontSize: 13, color: "#92400E" }}><span style={{ color: "#059669", fontWeight: 700 }}>Green</span> = Cheapest price for that test</span>
                  <span style={{ fontSize: 13, color: "#92400E" }}><span style={{ color: "#DC2626", fontWeight: 700 }}>Red</span> = Most expensive</span>
                </div>
              </div>
            )}

            {selectedTests.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🧪</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Select tests to compare</div>
              </div>
            )}
          </div>
        )}

        {/* =========== MAP VIEW =========== */}
        {view === "map" && (
          <div>
            <h2 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 22 }}>📍 Hospital Map</h2>
            <p style={{ margin: "0 0 20px", color: "#6B7280" }}>Click on a hospital marker to view details</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
              <div>
                <MapView hospitals={HOSPITALS} selectedId={mapSelected} onSelect={id => setMapSelected(id === mapSelected ? null : id)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {HOSPITALS.map(h => (
                  <div key={h.id} onClick={() => setMapSelected(h.id)} style={{ background: "white", borderRadius: 14, padding: "14px 16px", cursor: "pointer", border: `2px solid ${mapSelected === h.id ? h.color : "transparent"}`, boxShadow: mapSelected === h.id ? `0 4px 16px ${h.color}33` : "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${h.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{h.image}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{h.name}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>{h.area}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: h.color }}>⭐ {h.rating}</div>
                      </div>
                    </div>
                    {mapSelected === h.id && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>📍 {h.address}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={e => { e.stopPropagation(); navigate("detail", h); setActiveTab("doctors"); }}
                            style={{ ...styles.btn, background: `${h.color}`, color: "white", padding: "8px 14px", fontSize: 12, flex: 1 }}>
                            View Hospital
                          </button>
                          <button style={{ ...styles.btn, background: "#F0FDF4", color: "#15803D", padding: "8px 14px", fontSize: 12, border: "1px solid #BBF7D0" }}>
                            Directions
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        * { box-sizing: border-box; }
        select, input, textarea, button { font-family: 'Nunito', 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>
    </div>
  );
}
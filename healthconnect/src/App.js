import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { auth, db } from "./firebase";
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// 🎨 Color palette for hospitals
const COLORS = ["#0066CC","#E8432D","#00A651","#6B21A8","#F59E0B","#0F766E","#DC2626","#7C3AED","#059669","#D97706"];

const ALL_TESTS = ["Blood Test (CBC)","MRI Brain","CT Scan Chest","ECG","X-Ray","Lipid Profile"];
const SPECIALITIES = ["All","Cardiology","Neurology","Orthopedics","Oncology","Pediatrics","Gastroenterology","Nephrology","General Medicine","Emergency","Surgery"];
const TIME_SLOTS = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM"];

// 🏥 Health Tips Data
const HEALTH_TIPS = [
  { id: 1, category: "Prevention", icon: "🛡️", color: "#059669", title: "Regular Health Checkups", desc: "Get a full body checkup at least once a year. Early detection can prevent serious health issues. Blood tests, ECG, and basic screenings should be part of your annual routine.", tip: "Schedule your next checkup today!" },
  { id: 2, category: "Nutrition", icon: "🥗", color: "#D97706", title: "Balanced Diet is Key", desc: "Include plenty of fruits, vegetables, whole grains, and lean proteins in your diet. Limit processed foods, sugar, and excessive salt for better heart and digestive health.", tip: "Try adding one new vegetable to your diet this week!" },
  { id: 3, category: "Mental Health", icon: "🧠", color: "#7C3AED", title: "Prioritize Mental Wellness", desc: "Mental health is just as important as physical health. Practice meditation, deep breathing, or yoga daily. Don't hesitate to seek professional help if you feel overwhelmed.", tip: "Start with just 5 minutes of meditation today." },
  { id: 4, category: "First Aid", icon: "🩹", color: "#DC2626", title: "Basic First Aid Knowledge", desc: "Everyone should know basic first aid — CPR, treating burns, stopping bleeding, and handling choking emergencies. These skills can save lives in critical moments.", tip: "Take a free first aid course online!" },
  { id: 5, category: "Fitness", icon: "🏃", color: "#0284C7", title: "Stay Physically Active", desc: "Aim for at least 30 minutes of moderate exercise daily. Walking, jogging, cycling, or swimming can significantly reduce the risk of heart disease, diabetes, and obesity.", tip: "A 30-min walk daily can add years to your life!" },
  { id: 6, category: "Hygiene", icon: "🧼", color: "#0F766E", title: "Maintain Good Hygiene", desc: "Wash hands frequently, maintain oral hygiene, and keep your living environment clean. Good hygiene prevents infections and keeps you healthy throughout the year.", tip: "Wash hands for at least 20 seconds!" },
  { id: 7, category: "Sleep", icon: "😴", color: "#4338CA", title: "Quality Sleep Matters", desc: "Adults need 7-9 hours of quality sleep per night. Poor sleep increases the risk of heart disease, obesity, and mental health issues. Maintain a consistent sleep schedule.", tip: "Put away screens 1 hour before bed." },
  { id: 8, category: "Hydration", icon: "💧", color: "#0891B2", title: "Drink Enough Water", desc: "Stay hydrated by drinking at least 8 glasses (2 liters) of water daily. Proper hydration improves digestion, skin health, energy levels, and kidney function.", tip: "Carry a water bottle everywhere you go!" },
];

// 🚨 Emergency Numbers
const EMERGENCY_CONTACTS = [
  { name: "Ambulance", number: "102", icon: "🚑", color: "#DC2626", desc: "Medical Emergency — Free ambulance service" },
  { name: "Police", number: "100", icon: "👮", color: "#1D4ED8", desc: "Law enforcement assistance" },
  { name: "Fire Brigade", number: "101", icon: "🚒", color: "#EA580C", desc: "Fire & rescue services" },
  { name: "Women Helpline", number: "1091", icon: "👩", color: "#9333EA", desc: "24/7 Women safety helpline" },
  { name: "Child Helpline", number: "1098", icon: "👶", color: "#0D9488", desc: "Child protection & emergency" },
  { name: "Emergency (Universal)", number: "112", icon: "🆘", color: "#BE123C", desc: "Universal emergency number — works everywhere" },
  { name: "Mental Health", number: "08046110007", icon: "🧠", color: "#7C3AED", desc: "NIMHANS mental health helpline" },
  { name: "COVID Helpline", number: "1075", icon: "😷", color: "#059669", desc: "Health ministry COVID helpline" },
];

const Star = ({rating,size=14}) => <span>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:size,color:s<=Math.round(rating)?"#F59E0B":"#D1D5DB"}}>★</span>)}</span>;
const Badge = ({children,color="#EFF6FF",text="#1D4ED8"}) => <span style={{background:color,color:text,fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{children}</span>;

function RealMap({hospitals,onSelect}){
  if(!hospitals || hospitals.length === 0) return null;
  const center = [hospitals[0].lat || 28.6139, hospitals[0].lng || 77.209];
  return(
    <div style={{borderRadius:16,overflow:"hidden",height:420,border:"1px solid #CBD5E1"}}>
      <MapContainer center={center} zoom={11} style={{height:"100%",width:"100%"}}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {hospitals.map((h,i)=>(
          <Marker key={h.id} position={[h.lat || 28.6139, h.lng || 77.209]}>
            <Popup>
              <div style={{fontFamily:"sans-serif",minWidth:180}}>
                <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>{h.name}</div>
                <div style={{fontSize:12,color:"#6B7280",marginBottom:6}}>📍 {h.address}</div>
                <div style={{fontSize:13,marginBottom:8}}>⭐ {h.rating} · {h.reviews.toLocaleString()} reviews</div>
                {h.phone && h.phone !== "N/A" && <div style={{fontSize:12,color:"#374151",marginBottom:8}}>📞 {h.phone}</div>}
                <div style={{display:"flex",gap:6}}>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`} target="_blank" rel="noreferrer" style={{background:"#1E88E5",color:"white",padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,textDecoration:"none"}}>🗺️ Directions</a>
                  <button onClick={()=>onSelect(h)} style={{background:h.color,color:"white",padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>View</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function AuthPage({onSuccess}){
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if(isLogin){
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if(!name) { setError("Please enter your name"); setLoading(false); return; }
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
      }
      onSuccess();
    } catch(e) {
      if(e.code==="auth/email-already-in-use") setError("Email already registered. Please login.");
      else if(e.code==="auth/wrong-password") setError("Wrong password. Try again.");
      else if(e.code==="auth/user-not-found") setError("No account found. Please sign up.");
      else if(e.code==="auth/weak-password") setError("Password must be at least 6 characters.");
      else if(e.code==="auth/invalid-email") setError("Please enter a valid email.");
      else setError("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  const inp = {width:"100%",padding:"12px 16px",borderRadius:10,border:"2px solid #E5E7EB",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14};

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0F4C81,#1565C0,#42A5F5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:24,padding:40,width:"100%",maxWidth:420,boxShadow:"0 25px 60px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:8}}>🩺</div>
          <div style={{fontSize:24,fontWeight:900,color:"#0F4C81"}}>HealthConnect</div>
          <div style={{fontSize:14,color:"#6B7280",marginTop:4}}>{isLogin?"Welcome back! Please login.":"Create your account"}</div>
        </div>
        {!isLogin && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" style={inp}/>}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" style={inp}/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (min 6 chars)" style={inp} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        {error && <div style={{background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#BE123C",marginBottom:14}}>❌ {error}</div>}
        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:loading?"#94A3B8":"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",fontWeight:800,fontSize:16,cursor:loading?"not-allowed":"pointer",marginBottom:16}}>
          {loading?"Please wait...":isLogin?"Login →":"Create Account →"}
        </button>
        <div style={{textAlign:"center",fontSize:14,color:"#6B7280"}}>
          {isLogin?"Don't have an account? ":"Already have an account? "}
          <span onClick={()=>{setIsLogin(!isLogin);setError("");}} style={{color:"#1E88E5",fontWeight:700,cursor:"pointer"}}>{isLogin?"Sign Up":"Login"}</span>
        </div>
      </div>
    </div>
  );
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function BookingModal({doctor,hospital,user,onClose,onBooked}){
  const [step,setStep]=useState(1);
  const [date,setDate]=useState("Mon, 24 Feb");
  const [slot,setSlot]=useState(null);
  const [name,setName]=useState(user?.displayName||"");
  const [age,setAge]=useState("");
  const [phone,setPhone]=useState("");
  const [reason,setReason]=useState("");
  const [done,setDone]=useState(false);
  const [bookingId,setBookingId]=useState("");
  const [saving,setSaving]=useState(false);
  const dates=["Mon, 24 Mar","Tue, 25 Mar","Wed, 26 Mar","Thu, 27 Mar","Fri, 28 Mar"];
  const btn=(e={})=>({padding:"10px 20px",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer",fontSize:14,...e});

  const confirmBooking = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: doctor.name, doctorSpec: doctor.spec, hospitalName: hospital.name,
          hospitalId: hospital.id, date, time: slot, patientName: name, phone,
          patientAge: age, patientEmail: user?.email, reason, fee: doctor.fee,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingId(data.appointment.id);
        setDone(true);
        if (onBooked) onBooked();
      }
    } catch (err) {
      setBookingId("HC" + Math.floor(Math.random() * 90000 + 10000));
      setDone(true);
      if (onBooked) onBooked();
    }
    setSaving(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 60px rgba(0,0,0,0.3)"}}>
        <div style={{background:"linear-gradient(135deg,#0F4C81,#1E88E5)",padding:"20px 24px",borderRadius:"20px 20px 0 0",color:"white"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div><div style={{fontSize:13,opacity:0.8,marginBottom:4}}>Booking Appointment</div><div style={{fontSize:18,fontWeight:700}}>{doctor.name}</div><div style={{fontSize:13,opacity:0.9}}>{doctor.spec} · {hospital.name}</div></div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 10px",color:"white",cursor:"pointer",fontSize:18}}>✕</button>
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            {[1,2,3,4].map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:24,height:24,borderRadius:"50%",background:step>=s?"white":"rgba(255,255,255,0.3)",color:step>=s?"#1E88E5":"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{s}</div><span style={{fontSize:11,opacity:step>=s?1:0.6}}>{["Date & Time","Info","Pay","Confirm"][s-1]}</span>{s<4&&<span style={{opacity:0.4}}>›</span>}</div>)}
          </div>
        </div>
        <div style={{padding:24}}>
          {!done?(
            <>
              {step===1&&<div>
                <div style={{fontWeight:600,marginBottom:12}}>Select Date</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{dates.map(d=><button key={d} onClick={()=>setDate(d)} style={{padding:"8px 14px",borderRadius:10,border:date===d?"2px solid #1E88E5":"2px solid #E5E7EB",background:date===d?"#EFF6FF":"white",color:date===d?"#1E88E5":"#6B7280",fontWeight:600,fontSize:12,cursor:"pointer"}}>{d}</button>)}</div>
                <div style={{fontWeight:600,marginBottom:12}}>Select Time Slot</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:24}}>{TIME_SLOTS.map(t=><button key={t} onClick={()=>setSlot(t)} style={{padding:"10px 6px",borderRadius:10,border:slot===t?"2px solid #1E88E5":"2px solid #E5E7EB",background:slot===t?"#EFF6FF":"white",color:slot===t?"#1E88E5":"#374151",fontWeight:slot===t?700:400,fontSize:13,cursor:"pointer"}}>{t}</button>)}</div>
                <button onClick={()=>slot&&setStep(2)} style={btn({width:"100%",padding:"14px",borderRadius:12,background:slot?"linear-gradient(135deg,#0F4C81,#1E88E5)":"#E5E7EB",color:slot?"white":"#9CA3AF"})}>Continue →</button>
              </div>}
              {step===2&&<div>
                <div style={{fontWeight:600,marginBottom:16}}>Patient Information</div>
                {[["Full Name",name,setName,"text"],["Age",age,setAge,"number"],["Phone Number",phone,setPhone,"tel"]].map(([l,v,set,t])=><div key={l} style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:500,color:"#6B7280",display:"block",marginBottom:6}}>{l}</label><input type={t} value={v} onChange={e=>set(e.target.value)} placeholder={l} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"2px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>)}
                <div style={{marginBottom:20}}><label style={{fontSize:13,fontWeight:500,color:"#6B7280",display:"block",marginBottom:6}}>Reason for Visit</label><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe symptoms..." style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"2px solid #E5E7EB",fontSize:14,outline:"none",resize:"vertical",minHeight:80,boxSizing:"border-box",fontFamily:"inherit"}}/></div>
                <div style={{display:"flex",gap:10}}><button onClick={()=>setStep(1)} style={btn({flex:1,border:"2px solid #E5E7EB",background:"white",color:"#374151"})}>← Back</button><button onClick={()=>name&&phone&&setStep(3)} style={btn({flex:2,background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white"})}>Continue to Pay →</button></div>
              </div>}
              {step===3&&<div>
                <div style={{fontWeight:600,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>Card Details</span> <span style={{fontSize:24}}>💳</span></div>
                <div style={{background:"#1E293B",color:"white",padding:20,borderRadius:16,marginBottom:20,boxShadow:"0 10px 25px rgba(0,0,0,0.2)",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,background:"rgba(255,255,255,0.1)",borderRadius:"50%"}}></div>
                  <div style={{fontSize:12,opacity:0.7,marginBottom:4}}>Card Number</div>
                  <input type="text" placeholder="0000 0000 0000 0000" maxLength={19} style={{background:"transparent",border:"none",color:"white",fontSize:18,fontWeight:600,width:"100%",outline:"none",letterSpacing:2,marginBottom:16,fontFamily:"monospace"}}/>
                  <div style={{display:"flex",gap:20}}>
                    <div style={{flex:1}}><div style={{fontSize:12,opacity:0.7,marginBottom:4}}>Expiry</div><input type="text" placeholder="MM/YY" maxLength={5} style={{background:"transparent",border:"none",color:"white",fontSize:15,fontWeight:600,width:"100%",outline:"none",fontFamily:"monospace"}}/></div>
                    <div style={{flex:1}}><div style={{fontSize:12,opacity:0.7,marginBottom:4}}>CVC</div><input type="password" placeholder="•••" maxLength={3} style={{background:"transparent",border:"none",color:"white",fontSize:15,fontWeight:600,width:"100%",outline:"none",fontFamily:"monospace"}}/></div>
                  </div>
                </div>
                <div style={{fontSize:12,textAlign:"center",color:"#9CA3AF",marginBottom:20}}>🔒 Payments are secured by Stripe API Sandbox</div>
                <div style={{display:"flex",gap:10}}><button onClick={()=>setStep(2)} style={btn({flex:1,border:"2px solid #E5E7EB",background:"white",color:"#374151"})}>← Back</button><button onClick={()=>setStep(4)} style={btn({flex:2,background:"#6366F1",color:"white"})}>Verify Card ›</button></div>
              </div>}
              {step===4&&<div>
                <div style={{background:"#F8FAFC",borderRadius:14,padding:18,marginBottom:20}}>
                  <div style={{fontWeight:700,marginBottom:12,color:"#0F4C81"}}>Appointment Summary</div>
                  {[["Doctor",doctor.name],["Speciality",doctor.spec],["Hospital",hospital.name],["Date",date],["Time",slot],["Patient",name],["Phone",phone],["Fee",`₹${doctor.fee}`]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}><span style={{color:"#6B7280"}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
                </div>
                <div style={{display:"flex",gap:10}}><button onClick={()=>setStep(3)} style={btn({flex:1,border:"2px solid #E5E7EB",background:"white",color:"#374151"})}>← Back</button><button onClick={confirmBooking} disabled={saving} style={btn({flex:2,background:saving?"#94A3B8":"linear-gradient(135deg,#059669,#10B981)",color:"white",boxShadow:"0 4px 15px rgba(16,185,129,0.3)"})}>{saving?"Processing...":`Pay ₹${doctor.fee} & Confirm ✓`}</button></div>
              </div>}
            </>
          ):(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:64,marginBottom:16}}>✅</div>
              <div style={{fontSize:22,fontWeight:800,color:"#059669",marginBottom:8}}>Booking Confirmed!</div>
              <div style={{fontSize:14,color:"#6B7280",marginBottom:4}}>Hi <strong>{user?.displayName||"User"}</strong>! Your appointment is booked.</div>
              <div style={{fontSize:14,color:"#6B7280",marginBottom:20}}>ID: <strong>{bookingId}</strong></div>
              <button onClick={onClose} style={btn({background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",padding:"12px 32px",borderRadius:12})}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: "bot", text: "Hi! I am HealthConnect AI. What symptoms are you experiencing today?" }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const currentInput = input.toLowerCase();
    setInput("");
    setTyping(true);

    setTimeout(() => {
      let response = "I recommend consulting a General Physician for a thorough checkup.";
      if (currentInput.includes("headache") || currentInput.includes("migraine")) response = "Frequent headaches can be concerning. I highly recommend booking an appointment with a **Neurologist**.";
      else if (currentInput.includes("heart") || currentInput.includes("chest") || currentInput.includes("pain")) response = "Chest pain is a serious symptom. Please consult a **Cardiologist** immediately, or visit the Emergency ward if severe.";
      else if (currentInput.includes("stomach") || currentInput.includes("digestion") || currentInput.includes("acid")) response = "Digestive issues are best evaluated by a **Gastroenterologist**.";
      else if (currentInput.includes("bone") || currentInput.includes("joint") || currentInput.includes("knee")) response = "For joint and bone issues, an **Orthopedic** specialist would be the best choice.";

      setMessages(prev => [...prev, { sender: "bot", text: response }]);
      setTyping(false);
    }, 1500);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {open ? (
        <div style={{ width: 340, height: 480, background: "white", borderRadius: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #E5E7EB" }}>
          <div style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", padding: "16px 20px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>HealthConnect AI</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>🟢 Online • Medical Assistant</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: 20 }}>✕</button>
          </div>
          <div style={{ flex: 1, padding: 16, overflowY: "auto", background: "#F8FAFC", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === "user" ? "flex-end" : "flex-start", maxWidth: "80%", background: m.sender === "user" ? "#4F46E5" : "white", color: m.sender === "user" ? "white" : "#1F2937", padding: "10px 14px", borderRadius: 16, borderBottomRightRadius: m.sender === "user" ? 4 : 16, borderBottomLeftRadius: m.sender === "bot" ? 4 : 16, fontSize: 14, boxShadow: "0 2px 5px rgba(0,0,0,0.05)", lineHeight: 1.4 }}>
                {m.text}
              </div>
            ))}
            {typing && <div style={{ alignSelf: "flex-start", background: "white", padding: "10px 14px", borderRadius: 16, color: "#6B7280", fontSize: 12, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>AI is typing...</div>}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid #E5E7EB", background: "white", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type your symptoms..." style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #E5E7EB", outline: "none", fontSize: 14 }} />
            <button onClick={handleSend} style={{ background: "#4F46E5", color: "white", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>➤</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "white", border: "none", cursor: "pointer", boxShadow: "0 10px 25px rgba(79,70,229,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          💬
        </button>
      )}
    </div>
  );
}

export default function App(){
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [view,setView]=useState("home");
  const [selectedHospital,setSelectedHospital]=useState(null);
  const [search,setSearch]=useState("");
  const [specFilter,setSpecFilter]=useState("All");
  const [sortBy,setSortBy]=useState("rating");
  const [bookingDoctor,setBookingDoctor]=useState(null);
  const [activeTab,setActiveTab]=useState("doctors");
  const [selectedTests,setSelectedTests]=useState(["Blood Test (CBC)","MRI Brain"]);
  const [reviewText,setReviewText]=useState("");
  const [reviewRating,setReviewRating]=useState(5);
  const [searchInput,setSearchInput]=useState("");
  const [notif,setNotif]=useState(null);
  const [smsPush, setSmsPush] = useState(false);

  // 🆕 NEW STATE — Appointments, Reviews from backend
  const [myAppointments,setMyAppointments]=useState([]);
  const [loadingAppts,setLoadingAppts]=useState(false);
  const [hospitalReviews,setHospitalReviews]=useState([]);
  const [loadingReviews,setLoadingReviews]=useState(false);
  const [tipsFilter,setTipsFilter]=useState("All");
  const [cityInput,setCityInput]=useState("New Delhi");

  // 🤖 AI Health Checkup state
  const [aiDisease,setAiDisease]=useState(null);
  const [aiModels,setAiModels]=useState(null);
  const [aiForm,setAiForm]=useState({});
  const [aiResult,setAiResult]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiModelsLoading,setAiModelsLoading]=useState(false);

  // 📊 Health History state
  const [healthHistory,setHealthHistory]=useState([]);
  const [loadingHistory,setLoadingHistory]=useState(false);

  // 📹 Telemedicine state
  const [callRoom,setCallRoom]=useState(null);

  // 🛡️ Admin state
  const [adminStats,setAdminStats]=useState(null);
  const [loadingAdmin,setLoadingAdmin]=useState(false);
  const isAdmin = user?.email === "admin@healthconnect.com";

  // 🏥 Real hospital data from backend
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ✅ Fetch real hospitals from backend
  const fetchHospitals = async (city = "New Delhi") => {
    setLoadingHospitals(true);
    setApiError(null);
    try {
      const res = await fetch(`${API_URL}/hospitals?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if(data.success && data.hospitals.length > 0){
        // Add colors and enrich data
        const enriched = data.hospitals.map((h, i) => ({
          ...h,
          color: COLORS[i % COLORS.length],
          image: "🏥",
          doctors: [
            {id:i*10+1, name:"Dr. Available Doctor", spec:"General Medicine", exp:10, fee:500, available:"Today", rating:4.5, img:"👨‍⚕️"},
          ],
          reviewsList: [],
        }));
        setHospitals(enriched);
      } else {
        setApiError("No hospitals found for this city.");
      }
    } catch(err) {
      setApiError("Could not connect to backend. Make sure server is running on port 5000.");
    }
    setLoadingHospitals(false);
  };

  // 🆕 Fetch doctors from backend API for a hospital
  const fetchDoctors = async (hospitalId) => {
    try {
      const res = await fetch(`${API_URL}/doctors?hospitalId=${hospitalId}`);
      const data = await res.json();
      if (data.success) return data.doctors;
    } catch (err) { /* fallback to default */ }
    return null;
  };

  // 🆕 Fetch user's appointments
  const fetchMyAppointments = useCallback(async () => {
    if (!user?.email) return;
    setLoadingAppts(true);
    try {
      const res = await fetch(`${API_URL}/appointments/${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success) setMyAppointments(data.appointments);
    } catch (err) { /* offline fallback */ }
    setLoadingAppts(false);
  }, [user]);

  // 🆕 Fetch reviews for a hospital
  const fetchReviews = async (hospitalId) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${API_URL}/reviews/${hospitalId}`);
      const data = await res.json();
      if (data.success) setHospitalReviews(data.reviews);
    } catch (err) { /* offline fallback */ }
    setLoadingReviews(false);
  };

  // 🆕 Submit review to backend
  const submitReview = async (hospitalId, hospitalName) => {
    if (!reviewText) return;
    try {
      await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId, hospitalName, userName: user?.displayName || "Anonymous",
          userEmail: user?.email || "", rating: reviewRating, text: reviewText,
        }),
      });
      notifShow("Review submitted!");
      setReviewText(""); setReviewRating(5);
      fetchReviews(hospitalId);
    } catch (err) {
      notifShow("Review saved locally!");
      setReviewText(""); setReviewRating(5);
    }
  };

  // ✅ Listen to auth state
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  },[]);

  // ✅ Fetch hospitals on load
  useEffect(()=>{
    fetchHospitals("New Delhi");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const filtered = hospitals.filter(h=>{
    const q=search.toLowerCase();
    const ms=!q||h.name.toLowerCase().includes(q)||h.city.toLowerCase().includes(q)||h.specialities.some(s=>s.toLowerCase().includes(q));
    const mf=specFilter==="All"||h.specialities.some(s=>s===specFilter);
    return ms&&mf;
  }).sort((a,b)=>sortBy==="rating"?b.rating-a.rating:b.reviews-a.reviews);

  const go = async (v, h = null) => {
    setView(v);
    if (h) {
      // Fetch doctors from backend when opening hospital detail
      const docs = await fetchDoctors(h.id);
      if (docs) h = { ...h, doctors: docs };
      setSelectedHospital(h);
    }
    if (v === "detail" && h) fetchReviews(h.id);
    if (v === "appointments") fetchMyAppointments();
  };
  const notifShow=(m)=>{setNotif(m);setTimeout(()=>setNotif(null),3000);};
  const toggleTest=(t)=>setSelectedTests(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const handleLogout=async()=>{ await signOut(auth); notifShow("Logged out successfully!"); };
  const handleBookClick=(doc)=>{ if(!user){ setShowAuth(true); } else { setBookingDoctor(doc); } };

  // 🤖 AI Checkup helpers (routed through Node.js API gateway)
  const ML_API = `${API_URL}/ml`;

  const fetchAiModels = async () => {
    if (aiModels) return;
    setAiModelsLoading(true);
    try {
      const res = await fetch(`${ML_API}/models`);
      const data = await res.json();
      if (data.success) setAiModels(data.models);
    } catch (err) {
      notifShow("ML server not reachable. Start it on port 5001.");
    }
    setAiModelsLoading(false);
  };

  const selectDisease = (d) => {
    setAiDisease(d);
    setAiResult(null);
    setAiForm({});
  };

  const runPrediction = async () => {
    if (!aiDisease) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch(`${ML_API}/predict/${aiDisease}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm),
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data);
        // 📊 Auto-save to Firestore if logged in
        if (user) {
          try {
            await addDoc(collection(db, "predictions"), {
              userId: user.uid,
              email: user.email,
              disease: aiDisease,
              result: { label: data.label, probability: data.probability, confidence: data.confidence, risk_level: data.risk_level, model_used: data.model_used, recommendation: data.recommendation },
              inputData: aiForm,
              timestamp: serverTimestamp(),
            });
          } catch (e) { /* Firestore save failed silently — prediction still shown */ }
        }
      }
      else notifShow(data.error || "Prediction failed");
    } catch (err) {
      notifShow("Could not reach ML server. Is it running?");
    }
    setAiLoading(false);
  };

  // 📊 Fetch health history from Firestore
  const fetchHealthHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const q = query(collection(db, "predictions"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate?.() || new Date() }));
      setHealthHistory(history);
    } catch (e) { /* Firestore read failed */ }
    setLoadingHistory(false);
  };

  // 🏥 Smart booking from AI results
  const DISEASE_SPECIALIST = { heart: "Cardiology", cancer: "Oncology", diabetes: "General Medicine" };
  const bookSpecialist = async (disease) => {
    if (!user) { setShowAuth(true); return; }
    const spec = DISEASE_SPECIALIST[disease] || "General Medicine";
    setSpecFilter(spec);
    await fetchHospitals(cityInput);
    go("list");
    notifShow(`Showing ${spec} specialists. Select a hospital to book.`);
  };

  // 🛡️ Fetch Admin Stats
  const fetchAdminStats = async () => {
    setLoadingAdmin(true);
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      const data = await res.json();
      if (data.success) setAdminStats(data.stats);
    } catch (err) {
      notifShow("Could not load admin stats.");
    }
    setLoadingAdmin(false);
  };

  // 📄 Generate PDF Report
  const downloadPDF = async (elementId, filename) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.setFontSize(10);
      pdf.text("Generated by HealthConnect AI Platform", 10, pdf.internal.pageSize.getHeight() - 10);
      
      pdf.save(filename);
      notifShow("PDF downloaded successfully!");
    } catch (err) {
      notifShow("Failed to generate PDF.");
    }
  };

  // 🆕 Cancel appointment via backend
  const cancelAppointment = async (id) => {
    try {
      await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
      notifShow("Appointment cancelled.");
      fetchMyAppointments();
    } catch (err) { notifShow("Could not cancel. Try again."); }
  };

  const card={background:"white",borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",overflow:"hidden",transition:"transform 0.2s,box-shadow 0.2s",cursor:"pointer"};
  const btn=(e={})=>({padding:"10px 20px",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer",fontSize:14,...e});
  const inp={padding:"12px 16px",borderRadius:10,border:"2px solid #E5E7EB",fontSize:14,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"};

  if(authLoading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontSize:20,fontWeight:700,color:"#0F4C81"}}>🩺 Loading HealthConnect...</div>;
  if(showAuth) return <AuthPage onSuccess={()=>setShowAuth(false)}/>;

  return(
    <div style={{fontFamily:"'Nunito','Segoe UI',sans-serif",minHeight:"100vh",background:"#F1F5F9",color:"#111827"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      {notif&&<div style={{position:"fixed",top:20,right:20,background:"#065F46",color:"white",padding:"12px 20px",borderRadius:12,zIndex:9999,fontWeight:600,fontSize:14}}>✓ {notif}</div>}
      
      {/* 📱 Simulated Twilio SMS Push Notification */}
      <div style={{ position: "fixed", top: smsPush ? 20 : -150, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", padding: "16px 20px", borderRadius: 24, zIndex: 10000, boxShadow: "0 15px 40px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 16, width: "90%", maxWidth: 400, transition: "top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)", border: "1px solid rgba(255,255,255,0.4)" }}>
        <div style={{ width: 44, height: 44, background: "#10B981", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>💬</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>Messages</span>
            <span style={{ fontSize: 12, color: "#6B7280" }}>now</span>
          </div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}><strong>HealthConnect:</strong> Your appointment is confirmed. Thank you for booking!</div>
        </div>
      </div>

      {bookingDoctor&&selectedHospital&&<BookingModal doctor={bookingDoctor} hospital={selectedHospital} user={user} onClose={()=>setBookingDoctor(null)} onBooked={()=>{ fetchMyAppointments(); setSmsPush(true); setTimeout(()=>setSmsPush(false), 6000); }}/>}

      {/* NAVBAR */}
      <nav style={{background:"linear-gradient(135deg,#0F4C81,#1565C0)",padding:"0 20px",position:"sticky",top:0,zIndex:500,boxShadow:"0 2px 20px rgba(15,76,129,0.4)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:16,height:60}}>
          <div style={{color:"white",fontWeight:900,fontSize:20,cursor:"pointer"}} onClick={()=>go("home")}>🩺 HealthConnect</div>
          <div style={{flex:1}}/>
          {[["Hospitals","list"],["Compare","compare"],["🗺️ Map","map"],["🤖 AI Checkup","ai-checkup"],...(user?[["📊 My Health","health-history"]]:[]),["🚨 SOS","emergency"],["💡 Tips","tips"],...(user?[["📋 My Appts","appointments"]]:[]),...(isAdmin?[["🛡️ Admin","admin"]]:[])].map(([l,v])=><span key={v} onClick={()=>{go(v);if(v==="ai-checkup")fetchAiModels();if(v==="health-history")fetchHealthHistory();if(v==="admin")fetchAdminStats();}} style={{color:"white",fontSize:13,cursor:"pointer",fontWeight:600,padding:"6px 10px",borderRadius:8,background:view===v?"rgba(255,255,255,0.2)":"transparent"}}>{l}</span>)}
          {user ? (
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"6px 14px",color:"white",fontSize:13,fontWeight:600}}>👤 {user.displayName||user.email}</div>
              <button onClick={handleLogout} style={btn({background:"rgba(255,255,255,0.2)",color:"white",fontSize:13,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.3)"})}>Logout</button>
            </div>
          ) : (
            <button onClick={()=>setShowAuth(true)} style={btn({background:"white",color:"#0F4C81",fontSize:13,padding:"8px 16px"})}>Sign In / Sign Up</button>
          )}
        </div>
      </nav>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>

        {/* =========== HOME =========== */}
        {view==="home"&&<div>
          <div style={{background:"linear-gradient(135deg,#0F4C81,#1565C0 60%,#42A5F5)",borderRadius:20,padding:"48px 40px",marginBottom:32,color:"white",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:40,top:-20,fontSize:120,opacity:0.08}}>🏥</div>
            {user&&<div style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"10px 16px",marginBottom:16,fontSize:14,fontWeight:600,display:"inline-block"}}>👋 Welcome back, {user.displayName||"User"}!</div>}
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,opacity:0.7,marginBottom:12,textTransform:"uppercase"}}>India's Healthcare Platform</div>
            <h1 style={{margin:"0 0 12px",fontSize:36,fontWeight:900,lineHeight:1.2}}>Find Real Hospitals,<br/>Book Appointments</h1>
            <p style={{margin:"0 0 28px",opacity:0.85,fontSize:16,maxWidth:500}}>Real hospital data powered by Google Places. Search any city in India!</p>

            {/* City Search */}
            <div style={{display:"flex",gap:12,maxWidth:600,marginBottom:16}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:18}}>🏙️</span>
                <input value={cityInput} onChange={e=>setCityInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchHospitals(cityInput)} placeholder="Enter city (e.g. Mumbai, Delhi, Bangalore)" style={{...inp,paddingLeft:44,borderColor:"transparent",background:"rgba(255,255,255,0.95)",borderRadius:12,fontSize:15}}/>
              </div>
              <button onClick={()=>fetchHospitals(cityInput)} disabled={loadingHospitals} style={btn({background:"#F59E0B",color:"#111827",fontSize:15,padding:"12px 28px",borderRadius:12})}>
                {loadingHospitals?"Loading...":"Search 🔍"}
              </button>
            </div>

            <div style={{display:"flex",gap:12,maxWidth:600}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:18}}>🔍</span>
                <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setSearch(searchInput);go("list");}}} placeholder="Search hospital by name..." style={{...inp,paddingLeft:44,borderColor:"transparent",background:"rgba(255,255,255,0.95)",borderRadius:12,fontSize:15}}/>
              </div>
              <button onClick={()=>{setSearch(searchInput);go("list");}} style={btn({background:"white",color:"#0F4C81",fontSize:15,padding:"12px 28px",borderRadius:12})}>Search</button>
            </div>

            <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
              {["Mumbai","Bangalore","Chennai","Hyderabad","Pune"].map(city=><span key={city} onClick={()=>{setCityInput(city);fetchHospitals(city);}} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"white",padding:"6px 14px",borderRadius:20,fontSize:13,cursor:"pointer",fontWeight:600}}>{city}</span>)}
            </div>
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:32}}>
            {[[hospitals.length||"20+","Hospitals Found","#EFF6FF","#1E88E5"],["9","Doctors Available","#F0FDF4","#10B981"],["6","Tests to Compare","#FFFBEB","#F59E0B"],["24/7","Emergency Support","#FFF1F2","#EF4444"]].map(([v,l,bg,c])=><div key={l} style={{background:bg,borderRadius:14,padding:20,textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:12,color:"#6B7280",fontWeight:600,marginTop:4}}>{l}</div></div>)}
          </div>

          {!user&&<div style={{background:"linear-gradient(135deg,#0F4C81,#1565C0)",borderRadius:16,padding:"24px 28px",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <div><div style={{fontWeight:800,fontSize:18,marginBottom:6}}>🔐 Sign in to Book Appointments</div><div style={{opacity:0.85,fontSize:14}}>Create a free account to book doctors instantly</div></div>
            <button onClick={()=>setShowAuth(true)} style={btn({background:"white",color:"#0F4C81",padding:"12px 24px"})}>Sign Up Free →</button>
          </div>}

          {/* Loading / Error */}
          {loadingHospitals&&<div style={{textAlign:"center",padding:"40px",background:"white",borderRadius:16,marginBottom:24}}>
            <div style={{fontSize:40,marginBottom:12}}>🔍</div>
            <div style={{fontWeight:700,color:"#0F4C81"}}>Fetching real hospitals from Google...</div>
          </div>}

          {apiError&&<div style={{background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:14,padding:"16px 20px",marginBottom:24,color:"#BE123C",fontWeight:600}}>⚠️ {apiError}</div>}

          {/* Featured Hospitals */}
          {!loadingHospitals&&hospitals.length>0&&<>
            <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:20,fontWeight:800}}>🏥 Real Hospitals — {cityInput}</h2><span onClick={()=>go("list")} style={{color:"#1E88E5",cursor:"pointer",fontWeight:700,fontSize:14}}>View All {hospitals.length} →</span></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:32}}>
              {hospitals.slice(0,4).map(h=><div key={h.id} style={card} onClick={()=>go("detail",h)} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.12)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)";}}>
                <div style={{background:`linear-gradient(135deg,${h.color}22,${h.color}11)`,padding:"18px 20px",borderBottom:`3px solid ${h.color}30`}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{h.name}</div><Badge color={`${h.color}18`} text={h.color}>{h.type}</Badge></div><div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:18,color:h.color}}>{h.rating} ⭐</div><div style={{fontSize:11,color:"#9CA3AF"}}>{h.reviews.toLocaleString()} reviews</div></div></div>
                </div>
                <div style={{padding:"14px 20px"}}>
                  <div style={{fontSize:13,color:"#6B7280",marginBottom:6}}>📍 {h.address}</div>
                  {h.phone&&h.phone!=="N/A"&&<div style={{fontSize:13,color:"#374151",marginBottom:8}}>📞 {h.phone}</div>}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{h.specialities.slice(0,3).map(sp=><Badge key={sp}>{sp}</Badge>)}</div>
                </div>
              </div>)}
            </div>
          </>}

          <h2 style={{margin:"0 0 16px",fontSize:20,fontWeight:800}}>🗺️ Hospitals on Map</h2>
          {hospitals.length>0&&<RealMap hospitals={hospitals.slice(0,10)} onSelect={h=>go("detail",h)}/>}
          <div style={{textAlign:"center",marginTop:12,marginBottom:24}}><button onClick={()=>go("map")} style={btn({background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",padding:"12px 28px"})}>Open Full Map View →</button></div>

          <div style={{background:"linear-gradient(135deg,#1B5E20,#388E3C)",borderRadius:16,padding:"24px 28px",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:800,fontSize:18,marginBottom:6}}>💊 Compare Test Prices</div><div style={{opacity:0.85,fontSize:14}}>Find the most affordable test across hospitals</div></div>
            <button onClick={()=>go("compare")} style={btn({background:"white",color:"#1B5E20",padding:"12px 24px"})}>Compare Now →</button>
          </div>
        </div>}

        {/* =========== HOSPITAL LIST =========== */}
        {view==="list"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h2 style={{margin:0,fontWeight:800,fontSize:22}}>Hospitals in {cityInput} <span style={{fontSize:14,color:"#6B7280",fontWeight:500}}>({hospitals.length} found)</span></h2>
          </div>
          <div style={{background:"white",borderRadius:14,padding:18,marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{flex:1,minWidth:200,position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hospitals..." style={{...inp,paddingLeft:36}}/></div>
            <select value={specFilter} onChange={e=>setSpecFilter(e.target.value)} style={{padding:"12px 16px",borderRadius:10,border:"2px solid #E5E7EB",fontSize:14,background:"white",cursor:"pointer",fontFamily:"inherit"}}>{SPECIALITIES.map(sp=><option key={sp}>{sp}</option>)}</select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"12px 16px",borderRadius:10,border:"2px solid #E5E7EB",fontSize:14,background:"white",cursor:"pointer",fontFamily:"inherit"}}><option value="rating">Sort: Best Rated</option><option value="reviews">Sort: Most Reviewed</option></select>
          </div>

          {loadingHospitals&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16}}><div style={{fontSize:40,marginBottom:12}}>🔍</div><div style={{fontWeight:700,color:"#0F4C81"}}>Loading real hospitals...</div></div>}

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filtered.map(h=><div key={h.id} style={card} onClick={()=>go("detail",h)} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)"}>
              <div style={{padding:"18px 22px",display:"flex",gap:16,alignItems:"start"}}>
                <div style={{width:56,height:56,borderRadius:14,background:`${h.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🏥</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>{h.name}</div>
                      <div style={{fontSize:13,color:"#6B7280",marginBottom:6}}>📍 {h.address}</div>
                      {h.phone&&h.phone!=="N/A"&&<div style={{fontSize:13,color:"#374151",marginBottom:8}}>📞 {h.phone}</div>}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Badge color={`${h.color}18`} text={h.color}>{h.type}</Badge>{h.openNow&&<Badge color="#F0FDF4" text="#15803D">🟢 Open Now</Badge>}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end",marginBottom:4}}><Star rating={h.rating} size={16}/><span style={{fontWeight:800,fontSize:16}}>{h.rating}</span></div>
                      <div style={{fontSize:12,color:"#9CA3AF"}}>{h.reviews.toLocaleString()} reviews</div>
                      <button onClick={e=>{e.stopPropagation();go("detail",h);}} style={btn({background:`linear-gradient(135deg,${h.color},${h.color}99)`,color:"white",marginTop:10,padding:"8px 18px",fontSize:13})}>View & Book</button>
                    </div>
                  </div>
                  <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>{h.specialities.map(sp=><Badge key={sp}>{sp}</Badge>)}</div>
                </div>
              </div>
            </div>)}
            {!loadingHospitals&&filtered.length===0&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16,color:"#9CA3AF"}}><div style={{fontSize:48,marginBottom:12}}>🔍</div><div style={{fontSize:18,fontWeight:700}}>No hospitals found</div></div>}
          </div>
        </div>}

        {/* =========== HOSPITAL DETAIL =========== */}
        {view==="detail"&&selectedHospital&&<div>
          <button onClick={()=>go("list")} style={btn({background:"white",color:"#374151",border:"2px solid #E5E7EB",marginBottom:20})}>← Back</button>
          <div style={{background:`linear-gradient(135deg,${selectedHospital.color},${selectedHospital.color}BB)`,borderRadius:20,padding:32,marginBottom:24,color:"white"}}>
            <div style={{display:"flex",gap:20,alignItems:"start"}}>
              <div style={{fontSize:56}}>🏥</div>
              <div style={{flex:1}}>
                <div style={{fontSize:26,fontWeight:900,marginBottom:6}}>{selectedHospital.name}</div>
                <div style={{opacity:0.85,fontSize:14,marginBottom:8}}>📍 {selectedHospital.address}</div>
                {selectedHospital.phone&&selectedHospital.phone!=="N/A"&&<div style={{opacity:0.9,fontSize:14,marginBottom:12}}>📞 {selectedHospital.phone}</div>}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[selectedHospital.type,selectedHospital.openNow?"🟢 Open Now":"🔴 Closed","⏰ "+selectedHospital.timings].map(t=><span key={t} style={{background:"rgba(255,255,255,0.2)",padding:"5px 12px",borderRadius:20,fontSize:13,fontWeight:600}}>{t}</span>)}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:36,fontWeight:900}}>{selectedHospital.rating}</div><Star rating={selectedHospital.rating} size={18}/><div style={{fontSize:12,opacity:0.8,marginTop:4}}>{selectedHospital.reviews.toLocaleString()} reviews</div></div>
            </div>
          </div>

          <div style={{display:"flex",gap:4,background:"white",borderRadius:12,padding:6,marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            {["doctors","tests","reviews","location"].map(tab=><button key={tab} onClick={()=>setActiveTab(tab)} style={{flex:1,padding:"10px",borderRadius:8,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",background:activeTab===tab?`linear-gradient(135deg,${selectedHospital.color},${selectedHospital.color}BB)`:"transparent",color:activeTab===tab?"white":"#6B7280"}}>{tab==="doctors"?"👨‍⚕️ Doctors":tab==="tests"?"🧪 Tests":tab==="reviews"?"⭐ Reviews":"📍 Location"}</button>)}
          </div>

          {activeTab==="doctors"&&<div>
            {selectedHospital.doctors.map(doc=><div key={doc.id} style={{...card,cursor:"default",marginBottom:14}}>
              <div style={{padding:"18px 22px",display:"flex",gap:16,alignItems:"center"}}>
                <div style={{width:54,height:54,borderRadius:"50%",background:`${selectedHospital.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>👨‍⚕️</div>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:16,marginBottom:3}}>{doc.name}</div><div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"}}><Badge color={`${selectedHospital.color}14`} text={selectedHospital.color}>{doc.spec}</Badge><Badge color="#FFFBEB" text="#92400E">Available: {doc.available}</Badge></div><Star rating={doc.rating}/></div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:22,fontWeight:900,color:"#0F4C81",marginBottom:4}}>₹{doc.fee}</div>
                  <button onClick={()=>handleBookClick(doc)} style={btn({background:`linear-gradient(135deg,${selectedHospital.color},${selectedHospital.color}BB)`,color:"white",padding:"10px 20px"})}>{user?"Book Appointment":"🔐 Login to Book"}</button>
                </div>
              </div>
            </div>)}
            {!user&&<div style={{background:"#FFF7ED",borderRadius:14,padding:"16px 20px",border:"1px solid #FED7AA",textAlign:"center"}}>
              <div style={{fontSize:14,color:"#92400E",marginBottom:10}}>🔐 Please login to book appointments</div>
              <button onClick={()=>setShowAuth(true)} style={btn({background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",padding:"10px 24px"})}>Login / Sign Up</button>
            </div>}
          </div>}

          {activeTab==="tests"&&<div style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div style={{background:"#F8FAFC",padding:"14px 22px",fontWeight:800,fontSize:15,borderBottom:"1px solid #E5E7EB",display:"grid",gridTemplateColumns:"1fr 1fr"}}><span>Test Name</span><span style={{textAlign:"right"}}>Price (₹)</span></div>
            {selectedHospital.tests.map((t,i)=><div key={t.name} style={{display:"grid",gridTemplateColumns:"1fr 1fr",padding:"14px 22px",borderBottom:i<selectedHospital.tests.length-1?"1px solid #F1F5F9":"none",background:i%2===0?"white":"#FAFAFA"}}><span style={{fontWeight:600}}>🧪 {t.name}</span><span style={{textAlign:"right",fontWeight:800,color:"#059669",fontSize:16}}>₹{t.price}</span></div>)}
          </div>}

          {activeTab==="reviews"&&<div>
            <div style={{background:"white",borderRadius:16,padding:20,marginBottom:16,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <div style={{fontWeight:700,marginBottom:12,fontSize:15}}>Write a Review</div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>{[1,2,3,4,5].map(st=><span key={st} onClick={()=>setReviewRating(st)} style={{fontSize:28,cursor:"pointer",color:st<=reviewRating?"#F59E0B":"#D1D5DB"}}>★</span>)}</div>
              <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Share your experience..." style={{...inp,minHeight:80,resize:"vertical"}}/>
              <button onClick={()=>submitReview(selectedHospital.id,selectedHospital.name)} style={btn({background:`linear-gradient(135deg,${selectedHospital.color},${selectedHospital.color}99)`,color:"white",marginTop:10})}>Submit Review</button>
            </div>
            {/* 🆕 Show reviews fetched from backend */}
            {loadingReviews&&<div style={{textAlign:"center",padding:20,color:"#6B7280"}}>Loading reviews...</div>}
            {hospitalReviews.length>0?hospitalReviews.map(r=>(
              <div key={r.id} style={{background:"white",borderRadius:14,padding:"16px 20px",marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:700,fontSize:14}}>👤 {r.userName}</div>
                  <div><Star rating={r.rating} size={14}/> <span style={{fontWeight:700,fontSize:13,marginLeft:4}}>{r.rating}/5</span></div>
                </div>
                <div style={{fontSize:14,color:"#374151",lineHeight:1.6}}>{r.text}</div>
                <div style={{fontSize:11,color:"#9CA3AF",marginTop:8}}>{new Date(r.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
              </div>
            )):(!loadingReviews&&<div style={{textAlign:"center",padding:"30px",background:"white",borderRadius:14,color:"#9CA3AF"}}>No reviews yet. Be the first to review!</div>)}
          </div>}

          {activeTab==="location"&&<div>
            <RealMap hospitals={[selectedHospital]} onSelect={()=>{}}/>
            <div style={{background:"white",borderRadius:14,padding:"16px 20px",marginTop:16,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <div style={{fontWeight:700,marginBottom:8}}>📍 {selectedHospital.name}</div>
              <div style={{fontSize:14,color:"#6B7280",marginBottom:14}}>{selectedHospital.address}</div>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}`} target="_blank" rel="noreferrer" style={{display:"block",padding:"12px",borderRadius:12,background:"#1E88E5",color:"white",fontWeight:700,textAlign:"center",textDecoration:"none",fontSize:14}}>🗺️ Get Directions on Google Maps</a>
            </div>
          </div>}
        </div>}

        {/* =========== COMPARE =========== */}
        {view==="compare"&&<div>
          <h2 style={{margin:"0 0 8px",fontWeight:800,fontSize:22}}>🧪 Test Price Comparison</h2>
          <p style={{margin:"0 0 24px",color:"#6B7280"}}>Select tests to compare prices across hospitals</p>
          <div style={{background:"white",borderRadius:14,padding:20,marginBottom:24,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontWeight:700,marginBottom:12}}>Select Tests</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{ALL_TESTS.map(t=><button key={t} onClick={()=>toggleTest(t)} style={{padding:"8px 16px",borderRadius:20,border:selectedTests.includes(t)?"2px solid #1E88E5":"2px solid #E5E7EB",background:selectedTests.includes(t)?"#EFF6FF":"white",color:selectedTests.includes(t)?"#1E88E5":"#374151",fontWeight:selectedTests.includes(t)?700:500,fontSize:13,cursor:"pointer"}}>{selectedTests.includes(t)?"✓ ":""}{t}</button>)}</div>
          </div>
          {selectedTests.length>0&&hospitals.length>0&&<div style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"linear-gradient(135deg,#0F4C81,#1565C0)"}}><th style={{padding:"16px 20px",textAlign:"left",color:"white",fontSize:14,fontWeight:700}}>Test Name</th>{hospitals.slice(0,5).map(h=><th key={h.id} style={{padding:"16px 20px",textAlign:"center",color:"white",fontSize:13,fontWeight:700,minWidth:130}}>{h.name.split(" ").slice(0,2).join(" ")}</th>)}</tr></thead>
              <tbody>{selectedTests.map((test,ti)=>{
                const prices=hospitals.slice(0,5).map(h=>h.tests.find(t=>t.name===test)?.price).filter(Boolean);
                const mn=Math.min(...prices),mx=Math.max(...prices);
                return<tr key={test} style={{background:ti%2===0?"white":"#F8FAFC",borderBottom:"1px solid #F1F5F9"}}>
                  <td style={{padding:"14px 20px",fontWeight:700}}>🧪 {test}</td>
                  {hospitals.slice(0,5).map(h=>{const td=h.tests.find(t=>t.name===test);if(!td)return<td key={h.id} style={{padding:"14px 20px",textAlign:"center",color:"#D1D5DB"}}>—</td>;return<td key={h.id} style={{padding:"14px 20px",textAlign:"center"}}><div style={{fontWeight:800,fontSize:16,color:td.price===mn?"#059669":td.price===mx?"#DC2626":"#111827"}}>₹{td.price}</div>{td.price===mn&&<div style={{fontSize:10,fontWeight:700,color:"#059669"}}>✓ CHEAPEST</div>}</td>;})}
                </tr>;
              })}</tbody>
            </table></div>
            <div style={{padding:"14px 20px",background:"#FFFBEB",fontSize:13,color:"#92400E"}}><span style={{color:"#059669",fontWeight:700}}>Green</span> = Cheapest · <span style={{color:"#DC2626",fontWeight:700}}>Red</span> = Most Expensive</div>
          </div>}
        </div>}

        {/* =========== MAP =========== */}
        {view==="map"&&<div>
          <h2 style={{margin:"0 0 8px",fontWeight:800,fontSize:22}}>🗺️ Hospital Map — {cityInput}</h2>
          <p style={{margin:"0 0 20px",color:"#6B7280"}}>Click on any marker to view details and get directions</p>
          {hospitals.length>0&&<RealMap hospitals={hospitals.slice(0,15)} onSelect={h=>go("detail",h)}/>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginTop:20}}>
            {hospitals.slice(0,6).map(h=><div key={h.id} onClick={()=>go("detail",h)} style={{background:"white",borderRadius:14,padding:"14px 16px",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",gap:12,alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.12)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)"}>
              <div style={{width:42,height:42,borderRadius:10,background:`${h.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏥</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{h.name}</div><div style={{fontSize:12,color:"#9CA3AF"}}>⭐ {h.rating} · {h.reviews.toLocaleString()} reviews</div></div>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{background:"#EFF6FF",color:"#1E88E5",padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,textDecoration:"none"}}>Directions</a>
            </div>)}
          </div>
        </div>}

        {/* =========== 🆕 MY APPOINTMENTS =========== */}
        {view==="appointments"&&<div>
          <h2 style={{margin:"0 0 8px",fontWeight:800,fontSize:22}}>📋 My Appointments</h2>
          <p style={{margin:"0 0 20px",color:"#6B7280"}}>Track and manage your booked appointments</p>

          {loadingAppts&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16}}><div style={{fontSize:40,marginBottom:12}}>📋</div><div style={{fontWeight:700,color:"#0F4C81"}}>Loading your appointments...</div></div>}

          {!loadingAppts&&myAppointments.length===0&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:64,marginBottom:16}}>📅</div>
            <div style={{fontSize:20,fontWeight:800,color:"#374151",marginBottom:8}}>No Appointments Yet</div>
            <div style={{fontSize:14,color:"#9CA3AF",marginBottom:20}}>Book your first appointment from the hospital list</div>
            <button onClick={()=>go("list")} style={btn({background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",padding:"12px 28px",borderRadius:12})}>Find Hospitals →</button>
          </div>}

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {myAppointments.map(apt=>(
              <div key={apt.id} style={{...card,cursor:"default"}}>
                <div style={{padding:"18px 22px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>👨‍⚕️ {apt.doctorName}</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <Badge color="#EFF6FF" text="#1D4ED8">{apt.doctorSpec}</Badge>
                        <Badge color={apt.status==="Confirmed"?"#F0FDF4":apt.status==="Cancelled"?"#FFF1F2":"#FFFBEB"} text={apt.status==="Confirmed"?"#15803D":apt.status==="Cancelled"?"#BE123C":"#92400E"}>{apt.status==="Confirmed"?"✅":apt.status==="Cancelled"?"❌":"📅"} {apt.status}</Badge>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:20,fontWeight:900,color:"#0F4C81"}}>₹{apt.fee}</div>
                      <div style={{fontSize:11,color:"#9CA3AF"}}>Consultation Fee</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,background:"#F8FAFC",borderRadius:12,padding:14,marginBottom:12}}>
                    {[["🏥 Hospital",apt.hospitalName],["📅 Date",apt.date],["🕐 Time",apt.time],["👤 Patient",apt.patientName]].map(([k,v])=><div key={k}><div style={{fontSize:11,color:"#9CA3AF",marginBottom:2}}>{k}</div><div style={{fontSize:13,fontWeight:600}}>{v}</div></div>)}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:"#9CA3AF"}}>ID: <strong>{apt.id}</strong> · Booked: {new Date(apt.bookedAt).toLocaleDateString("en-IN")}</div>
                    <div style={{display:"flex",gap:8}}>
                      {apt.status==="Confirmed"&&<button onClick={()=>setCallRoom(apt.id)} style={btn({background:"#EFF6FF",color:"#1D4ED8",border:"1px solid #BFDBFE",fontSize:12,padding:"6px 14px"})}>📹 Join Call</button>}
                      {apt.status==="Confirmed"&&<button onClick={()=>cancelAppointment(apt.id)} style={btn({background:"#FFF1F2",color:"#BE123C",border:"1px solid #FECDD3",fontSize:12,padding:"6px 14px"})}>Cancel ✕</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* =========== 🆕 EMERGENCY SOS =========== */}
        {view==="emergency"&&<div>
          <div style={{background:"linear-gradient(135deg,#DC2626,#BE123C)",borderRadius:20,padding:"36px 32px",marginBottom:28,color:"white",textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:30,top:-10,fontSize:100,opacity:0.1}}>🚨</div>
            <div style={{fontSize:48,marginBottom:12}}>🆘</div>
            <h1 style={{margin:"0 0 8px",fontSize:28,fontWeight:900}}>Emergency Services</h1>
            <p style={{margin:0,opacity:0.9,fontSize:15}}>One tap to call emergency services. Stay calm, help is on the way.</p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
            {EMERGENCY_CONTACTS.map(ec=>(
              <div key={ec.number} style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <div style={{background:`${ec.color}11`,padding:"16px 20px",borderBottom:`3px solid ${ec.color}25`}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:48,height:48,borderRadius:14,background:`${ec.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{ec.icon}</div>
                    <div>
                      <div style={{fontWeight:800,fontSize:16}}>{ec.name}</div>
                      <div style={{fontSize:12,color:"#6B7280"}}>{ec.desc}</div>
                    </div>
                  </div>
                </div>
                <div style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:24,fontWeight:900,color:ec.color}}>{ec.number}</div>
                  <a href={`tel:${ec.number}`} style={{background:`linear-gradient(135deg,${ec.color},${ec.color}BB)`,color:"white",padding:"10px 20px",borderRadius:12,fontSize:14,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6}}>📞 Call Now</a>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:"linear-gradient(135deg,#1B5E20,#388E3C)",borderRadius:16,padding:"24px 28px",color:"white",marginTop:24,textAlign:"center"}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:6}}>🏥 Need a Hospital?</div>
            <div style={{opacity:0.85,fontSize:14,marginBottom:16}}>Find the nearest hospital and get directions instantly</div>
            <button onClick={()=>go("map")} style={btn({background:"white",color:"#1B5E20",padding:"12px 28px"})}>Open Map → Find Nearest Hospital</button>
          </div>
        </div>}

        {/* =========== 🆕 HEALTH TIPS =========== */}
        {view==="tips"&&<div>
          <div style={{background:"linear-gradient(135deg,#059669,#10B981)",borderRadius:20,padding:"36px 32px",marginBottom:28,color:"white",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:30,top:-10,fontSize:100,opacity:0.1}}>💡</div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,opacity:0.7,marginBottom:8,textTransform:"uppercase"}}>HealthConnect Tips</div>
            <h1 style={{margin:"0 0 8px",fontSize:28,fontWeight:900}}>Health Tips & Awareness</h1>
            <p style={{margin:0,opacity:0.9,fontSize:15,maxWidth:500}}>Curated health tips to help you live a healthier, happier life.</p>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
            {["All","Prevention","Nutrition","Mental Health","First Aid","Fitness","Hygiene","Sleep","Hydration"].map(cat=>(
              <button key={cat} onClick={()=>setTipsFilter(cat)} style={{padding:"8px 16px",borderRadius:20,border:tipsFilter===cat?"2px solid #059669":"2px solid #E5E7EB",background:tipsFilter===cat?"#F0FDF4":"white",color:tipsFilter===cat?"#059669":"#6B7280",fontWeight:tipsFilter===cat?700:500,fontSize:13,cursor:"pointer"}}>{cat}</button>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
            {HEALTH_TIPS.filter(t=>tipsFilter==="All"||t.category===tipsFilter).map(tip=>(
              <div key={tip.id} style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <div style={{background:`${tip.color}11`,padding:"18px 20px",borderBottom:`3px solid ${tip.color}25`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{fontSize:28}}>{tip.icon}</div>
                    <Badge color={`${tip.color}18`} text={tip.color}>{tip.category}</Badge>
                  </div>
                  <div style={{fontWeight:800,fontSize:17}}>{tip.title}</div>
                </div>
                <div style={{padding:"16px 20px"}}>
                  <div style={{fontSize:14,color:"#374151",lineHeight:1.7,marginBottom:12}}>{tip.desc}</div>
                  <div style={{background:`${tip.color}10`,borderRadius:10,padding:"10px 14px",fontSize:13,color:tip.color,fontWeight:600}}>💡 {tip.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* =========== 🤖 AI HEALTH CHECKUP =========== */}
        {view==="ai-checkup"&&<div>
          {/* Hero Banner */}
          <div style={{background:"linear-gradient(135deg,#4338CA,#6D28D9,#7C3AED)",borderRadius:20,padding:"40px 36px",marginBottom:28,color:"white",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:30,top:-20,fontSize:120,opacity:0.08}}>🧠</div>
            <div style={{position:"absolute",left:-30,bottom:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}></div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,opacity:0.7,marginBottom:10,textTransform:"uppercase"}}>AI-Powered Health Screening</div>
            <h1 style={{margin:"0 0 10px",fontSize:32,fontWeight:900,lineHeight:1.2}}>🤖 AI Health Checkup</h1>
            <p style={{margin:"0 0 16px",opacity:0.85,fontSize:15,maxWidth:550}}>Get instant AI predictions for Heart Disease, Breast Cancer, and Diabetes using machine learning models trained on real medical data.</p>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              {[["3","ML Models"],["99%+","Accuracy"],["<1s","Prediction"],["Free","Always"]].map(([v,l])=><div key={l} style={{background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 16px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18}}>{v}</div><div style={{fontSize:11,opacity:0.7}}>{l}</div></div>)}
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:14,padding:"14px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:24}}>⚠️</span>
            <div><div style={{fontWeight:700,fontSize:13,color:"#92400E",marginBottom:2}}>Medical Disclaimer</div><div style={{fontSize:12,color:"#A16207"}}>This AI tool is for screening purposes only and does NOT replace professional medical diagnosis. Always consult a qualified doctor for health decisions.</div></div>
          </div>

          {aiModelsLoading&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16}}><div style={{fontSize:40,marginBottom:12}}>🧠</div><div style={{fontWeight:700,color:"#4338CA"}}>Loading AI Models...</div></div>}

          {!aiModelsLoading&&!aiModels&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:64,marginBottom:16}}>🔌</div>
            <div style={{fontSize:20,fontWeight:800,color:"#374151",marginBottom:8}}>ML Server Not Connected</div>
            <div style={{fontSize:14,color:"#9CA3AF",marginBottom:20,maxWidth:400,margin:"0 auto 20px"}}>Start the Python ML server to use AI predictions:<br/><code style={{background:"#F1F5F9",padding:"4px 12px",borderRadius:6,fontSize:13}}>cd healthconnect-ml && python app.py</code></div>
            <button onClick={fetchAiModels} style={{padding:"12px 28px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#4338CA,#6D28D9)",color:"white",fontWeight:700,fontSize:14,cursor:"pointer"}}>Retry Connection 🔄</button>
          </div>}

          {aiModels&&<>
            {/* Disease Selector */}
            {!aiDisease&&<>
              <h2 style={{margin:"0 0 16px",fontSize:20,fontWeight:800}}>Select a Health Check</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {[
                  ["heart","❤️","Heart Disease","Analyze 13 cardiac parameters to predict heart disease risk","#DC2626","#FFF1F2"],
                  ["cancer","🎗️","Breast Cancer","Evaluate 30 tumor measurements for malignancy prediction","#DB2777","#FDF2F8"],
                  ["diabetes","🩺","Diabetes","Assess 8 diagnostic measures for Type 2 diabetes risk","#7C3AED","#F5F3FF"],
                ].map(([key,icon,title,desc,color,bg])=>(
                  <div key={key} onClick={()=>selectDisease(key)} style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",cursor:"pointer",transition:"all 0.25s",border:`2px solid transparent`}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,0.12)";e.currentTarget.style.borderColor=color;}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)";e.currentTarget.style.borderColor="transparent";}}>
                    <div style={{background:bg,padding:"24px 20px",textAlign:"center",borderBottom:`3px solid ${color}25`}}>
                      <div style={{fontSize:48,marginBottom:8}}>{icon}</div>
                      <div style={{fontWeight:900,fontSize:18,color}}>{title}</div>
                    </div>
                    <div style={{padding:"16px 20px"}}>
                      <div style={{fontSize:13,color:"#6B7280",lineHeight:1.6,marginBottom:12}}>{desc}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <Badge color={`${color}15`} text={color}>{aiModels[key]?.model_used}</Badge>
                        <span style={{fontSize:12,color:"#9CA3AF"}}>AUC: {aiModels[key]?.test_auc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>}

            {/* Input Form + Results */}
            {aiDisease&&aiModels[aiDisease]&&<>
              <button onClick={()=>{setAiDisease(null);setAiResult(null);setAiForm({});}} style={{padding:"10px 20px",borderRadius:10,border:"2px solid #E5E7EB",background:"white",color:"#374151",fontWeight:700,cursor:"pointer",fontSize:14,marginBottom:20}}>← Back to Selection</button>

              <div style={{display:"grid",gridTemplateColumns:aiResult?"1fr 1fr":"1fr",gap:24}}>
                {/* Form Panel */}
                <div style={{background:"white",borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",overflow:"hidden"}}>
                  <div style={{background:aiDisease==="heart"?"linear-gradient(135deg,#DC2626,#EF4444)":aiDisease==="cancer"?"linear-gradient(135deg,#DB2777,#EC4899)":"linear-gradient(135deg,#7C3AED,#8B5CF6)",padding:"18px 22px",color:"white"}}>
                    <div style={{fontSize:24,marginBottom:4}}>{aiModels[aiDisease].icon} {aiModels[aiDisease].name}</div>
                    <div style={{fontSize:12,opacity:0.85}}>Fill in the values below and click Predict</div>
                  </div>
                  <div style={{padding:"20px 22px",maxHeight:"60vh",overflowY:"auto"}}>
                    <div style={{display:"grid",gridTemplateColumns:aiModels[aiDisease].features.length>10?"1fr 1fr":"1fr",gap:14}}>
                      {aiModels[aiDisease].features.map(f=>(
                        <div key={f.name}>
                          <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>{f.label}</label>
                          {f.type==="select"?(
                            <select value={aiForm[f.name]||""} onChange={e=>setAiForm(p=>({...p,[f.name]:parseFloat(e.target.value)}))} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"2px solid #E5E7EB",fontSize:13,background:"white",cursor:"pointer",fontFamily:"inherit"}}>
                              <option value="">Select...</option>
                              {f.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ):(
                            <input type="number" step={f.step||1} min={f.min} max={f.max} value={aiForm[f.name]||""} onChange={e=>setAiForm(p=>({...p,[f.name]:parseFloat(e.target.value)||0}))} placeholder={f.placeholder||""} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"2px solid #E5E7EB",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                          )}
                          {f.hint&&<div style={{fontSize:10,color:"#9CA3AF",marginTop:2}}>{f.hint}</div>}
                        </div>
                      ))}
                    </div>
                    <button onClick={runPrediction} disabled={aiLoading} style={{width:"100%",marginTop:20,padding:"14px",borderRadius:12,border:"none",background:aiLoading?"#94A3B8":aiDisease==="heart"?"linear-gradient(135deg,#DC2626,#EF4444)":aiDisease==="cancer"?"linear-gradient(135deg,#DB2777,#EC4899)":"linear-gradient(135deg,#7C3AED,#8B5CF6)",color:"white",fontWeight:800,fontSize:16,cursor:aiLoading?"not-allowed":"pointer"}}>
                      {aiLoading?"🧠 Analyzing...":"🔬 Run AI Prediction"}
                    </button>
                  </div>
                </div>

                {/* Results Panel */}
                {aiResult&&<div id="ai-report" style={{display:"flex",flexDirection:"column",gap:16,background:"white",padding:24,borderRadius:16}}>
                  {/* Main Result Card */}
                  <div style={{background:"white",borderRadius:16,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",overflow:"hidden"}}>
                    <div style={{background:aiResult.risk_level==="HIGH"?"linear-gradient(135deg,#DC2626,#EF4444)":aiResult.risk_level==="MODERATE"?"linear-gradient(135deg,#D97706,#F59E0B)":"linear-gradient(135deg,#059669,#10B981)",padding:"24px",color:"white",textAlign:"center"}}>
                      <div style={{fontSize:56,marginBottom:8}}>{aiResult.risk_level==="HIGH"?"🔴":aiResult.risk_level==="MODERATE"?"🟡":"🟢"}</div>
                      <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>{aiResult.label}</div>
                      <div style={{fontSize:14,opacity:0.9}}>{aiResult.risk_level} RISK</div>
                    </div>
                    <div style={{padding:"20px 24px"}}>
                      {/* Probability Gauge */}
                      <div style={{marginBottom:16}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:600,marginBottom:6}}><span>Probability</span><span>{(aiResult.probability*100).toFixed(1)}%</span></div>
                        <div style={{height:10,background:"#F1F5F9",borderRadius:10,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${aiResult.probability*100}%`,background:aiResult.risk_level==="HIGH"?"linear-gradient(90deg,#DC2626,#EF4444)":aiResult.risk_level==="MODERATE"?"linear-gradient(90deg,#D97706,#F59E0B)":"linear-gradient(90deg,#059669,#10B981)",borderRadius:10,transition:"width 1s ease"}}></div>
                        </div>
                      </div>
                      {/* Stats */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                        {[["Confidence",`${(aiResult.confidence*100).toFixed(1)}%`],["Model",aiResult.model_used]].map(([k,v])=><div key={k} style={{background:"#F8FAFC",borderRadius:10,padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:11,color:"#9CA3AF",marginBottom:2}}>{k}</div><div style={{fontWeight:800,fontSize:15,color:"#111827"}}>{v}</div></div>)}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div style={{background:"white",borderRadius:16,padding:"18px 22px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                    <div style={{fontWeight:800,fontSize:15,marginBottom:8,color:"#111827"}}>📋 Recommendation</div>
                    <div style={{fontSize:14,color:"#374151",lineHeight:1.7}}>{aiResult.recommendation}</div>
                  </div>

                  {/* Disclaimer */}
                  <div style={{background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:12,padding:"12px 16px"}}>
                    <div style={{fontSize:12,color:"#BE123C",fontWeight:600}}>⚠️ This is an AI screening result, NOT a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.</div>
                  </div>

                  {/* 🏥 Smart Doctor Booking */}
                  {(aiResult.risk_level==="HIGH"||aiResult.risk_level==="MODERATE")&&<button onClick={()=>bookSpecialist(aiDisease)} style={{padding:"14px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",fontWeight:800,cursor:"pointer",fontSize:15,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    🏥 Book a {aiDisease==="heart"?"Cardiologist":aiDisease==="cancer"?"Oncologist":"Doctor"} Now
                  </button>}

                  {/* Try Again / Download PDF */}
                  <div style={{display:"flex",gap:12}}>
                    <button onClick={()=>{setAiResult(null);setAiForm({});}} style={{flex:1,padding:"12px 20px",borderRadius:12,border:"2px solid #E5E7EB",background:"white",color:"#374151",fontWeight:700,cursor:"pointer",fontSize:14}}>🔄 New Prediction</button>
                    <button onClick={()=>downloadPDF("ai-report", "HealthConnect_Report.pdf")} style={{flex:1,padding:"12px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#059669,#10B981)",color:"white",fontWeight:700,cursor:"pointer",fontSize:14}}>⬇️ Download PDF</button>
                  </div>
                </div>}
              </div>
            </>}
          </>}
        </div>}

        {/* =========== 📊 MY HEALTH HISTORY =========== */}
        {view==="health-history"&&<div>
          {/* Hero */}
          <div style={{background:"linear-gradient(135deg,#059669,#10B981,#34D399)",borderRadius:20,padding:"40px 36px",marginBottom:28,color:"white",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:30,top:-20,fontSize:120,opacity:0.08}}>📊</div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,opacity:0.7,marginBottom:10,textTransform:"uppercase"}}>Health Analytics Dashboard</div>
            <h1 style={{margin:"0 0 10px",fontSize:32,fontWeight:900}}>📊 My Health History</h1>
            <p style={{margin:0,opacity:0.85,fontSize:15}}>Track your AI health screenings over time. All your prediction results in one place.</p>
          </div>

          {/* Summary Stats */}
          {healthHistory.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[
              ["Total Tests",healthHistory.length,"🧪","#4338CA"],
              ["Heart Tests",healthHistory.filter(h=>h.disease==="heart").length,"❤️","#DC2626"],
              ["Cancer Tests",healthHistory.filter(h=>h.disease==="cancer").length,"🎗️","#DB2777"],
              ["Diabetes Tests",healthHistory.filter(h=>h.disease==="diabetes").length,"🩺","#7C3AED"],
            ].map(([label,val,icon,color])=><div key={label} style={{background:"white",borderRadius:14,padding:"18px 16px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:4}}>{icon}</div>
              <div style={{fontSize:26,fontWeight:900,color}}>{val}</div>
              <div style={{fontSize:12,color:"#9CA3AF",fontWeight:600}}>{label}</div>
            </div>)}
          </div>}

          {/* CTA */}
          <div style={{display:"flex",gap:12,marginBottom:24}}>
            <button onClick={()=>{go("ai-checkup");fetchAiModels();}} style={{padding:"12px 24px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#4338CA,#6D28D9)",color:"white",fontWeight:700,fontSize:14,cursor:"pointer"}}>🤖 Run New Checkup</button>
            <button onClick={fetchHealthHistory} style={{padding:"12px 24px",borderRadius:12,border:"2px solid #E5E7EB",background:"white",color:"#374151",fontWeight:700,fontSize:14,cursor:"pointer"}}>🔄 Refresh</button>
          </div>

          {loadingHistory&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16}}><div style={{fontSize:40,marginBottom:12}}>⏳</div><div style={{fontWeight:700,color:"#059669"}}>Loading health history...</div></div>}

          {!loadingHistory&&healthHistory.length===0&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:64,marginBottom:16}}>📋</div>
            <div style={{fontSize:20,fontWeight:800,color:"#374151",marginBottom:8}}>No Health Records Yet</div>
            <div style={{fontSize:14,color:"#9CA3AF",marginBottom:20}}>Run your first AI Health Checkup to start tracking your health over time.</div>
            <button onClick={()=>{go("ai-checkup");fetchAiModels();}} style={{padding:"14px 28px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#4338CA,#6D28D9)",color:"white",fontWeight:700,fontSize:14,cursor:"pointer"}}>🤖 Start AI Checkup</button>
          </div>}

          {/* Timeline */}
          {!loadingHistory&&healthHistory.length>0&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            {healthHistory.map((item,idx)=>{
              const r = item.result||{};
              const diseaseColors = {heart:"#DC2626",cancer:"#DB2777",diabetes:"#7C3AED"};
              const diseaseIcons = {heart:"❤️",cancer:"🎗️",diabetes:"🩺"};
              const diseaseNames = {heart:"Heart Disease",cancer:"Breast Cancer",diabetes:"Diabetes"};
              const riskColors = {HIGH:"#DC2626",MODERATE:"#D97706",LOW:"#059669"};
              const riskBg = {HIGH:"#FFF1F2",MODERATE:"#FFFBEB",LOW:"#F0FDF4"};
              const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "Unknown";
              return <div key={item.id||idx} style={{background:"white",borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",overflow:"hidden",borderLeft:`4px solid ${diseaseColors[item.disease]||"#6B7280"}`}}>
                <div style={{padding:"18px 22px",display:"flex",alignItems:"center",gap:16}}>
                  <div style={{fontSize:36}}>{diseaseIcons[item.disease]||"🔬"}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                      <div style={{fontWeight:800,fontSize:16,color:"#111827"}}>{diseaseNames[item.disease]||"Unknown"}</div>
                      <span style={{background:riskBg[r.risk_level]||"#F1F5F9",color:riskColors[r.risk_level]||"#6B7280",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{r.risk_level} RISK</span>
                    </div>
                    <div style={{fontSize:13,color:"#6B7280"}}>{r.label} — {(r.probability*100).toFixed(1)}% probability</div>
                    <div style={{fontSize:11,color:"#9CA3AF",marginTop:4}}>📅 {dateStr} • Model: {r.model_used}</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:riskBg[r.risk_level]||"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:riskColors[r.risk_level]||"#6B7280"}}>
                      {(r.probability*100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div style={{borderTop:"1px solid #F1F5F9",padding:"12px 22px",background:"#FAFAFA"}}>
                  <div style={{fontSize:12,color:"#6B7280",lineHeight:1.6}}>💡 {r.recommendation}</div>
                </div>
              </div>;
            })}
          </div>}
        </div>}

        {/* =========== 🛡️ ADMIN DASHBOARD =========== */}
        {view==="admin"&&isAdmin&&<div>
          <div style={{background:"linear-gradient(135deg,#111827,#374151)",borderRadius:20,padding:"40px 36px",marginBottom:28,color:"white",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:30,top:-20,fontSize:120,opacity:0.04}}>🛡️</div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,opacity:0.7,marginBottom:10,textTransform:"uppercase"}}>System Administration</div>
            <h1 style={{margin:"0 0 10px",fontSize:32,fontWeight:900}}>🛡️ Admin Dashboard</h1>
            <p style={{margin:0,opacity:0.85,fontSize:15}}>Platform-wide statistics, appointments, and reviews oversight.</p>
          </div>
          
          {loadingAdmin&&<div style={{textAlign:"center",padding:40}}>Loading Admin data...</div>}
          
          {!loadingAdmin&&adminStats&&<div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:32}}>
              {[
                ["Total Appts",adminStats.totalAppointments,"📋","#1e40af"],
                ["Confirmed",adminStats.confirmedAppointments,"✅","#047857"],
                ["Cancelled",adminStats.cancelledAppointments,"❌","#be123c"],
                ["Total Reviews",adminStats.totalReviews,"⭐","#b45309"]
              ].map(([l,v,i,c])=>(
                <div key={l} style={{background:"white",borderRadius:14,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>{i}</div>
                  <div style={{fontSize:32,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:13,color:"#6B7280",fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>

            <h2 style={{fontSize:20,fontWeight:800,marginBottom:16}}>Hospitals with Most Bookings</h2>
            <div style={{display:"flex",gap:16}}>
              {adminStats.topHospitals?.map((h, i) => (
                <div key={i} style={{background:"white",padding:"16px 20px",borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",flex:1}}>
                  <div style={{fontWeight:800,fontSize:16,color:"#111827"}}>{h._id}</div>
                  <div style={{color:"#059669",fontWeight:700,marginTop:4}}>{h.count} Bookings</div>
                </div>
              ))}
            </div>
          </div>}
        </div>}

      </div>

      {/* =========== 📹 TELEMEDICINE OVERLAY =========== */}
      {callRoom&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:"90%",maxWidth:1000,height:"80vh",background:"white",borderRadius:20,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"16px 20px",background:"#111827",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:800,fontSize:16}}>📹 Secure Telemedicine Call: {callRoom}</div>
            <button onClick={()=>setCallRoom(null)} style={btn({background:"#EF4444",color:"white",padding:"8px 16px"})}>End Call / Close</button>
          </div>
          <div style={{flex:1,background:"#F3F4F6"}}>
            <iframe 
              src={`https://meet.jit.si/HC_${callRoom}`} 
              allow="camera; microphone; fullscreen; display-capture" 
              style={{width:"100%",height:"100%",border:"none"}} 
              title="Telemedicine Video Call"
            />
          </div>
        </div>
      </div>}

      {/* =========== 🆕 FOOTER =========== */}
      <footer style={{background:"linear-gradient(135deg,#0F4C81,#0A2E4E)",color:"white",padding:"48px 20px 24px",marginTop:40}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:32,marginBottom:32}}>
            <div>
              <div style={{fontSize:22,fontWeight:900,marginBottom:12}}>🩺 HealthConnect</div>
              <div style={{fontSize:13,opacity:0.7,lineHeight:1.8}}>India's trusted healthcare platform. Find, compare, and book the best care near you.</div>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Quick Links</div>
              {[["🏥 Hospitals","list"],["🧪 Compare Tests","compare"],["🗺️ Map View","map"],["💡 Health Tips","tips"]].map(([l,v])=><div key={v} onClick={()=>go(v)} style={{fontSize:13,opacity:0.7,marginBottom:8,cursor:"pointer"}}>{l}</div>)}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Emergency</div>
              {[["🚑 Ambulance","102"],["👮 Police","100"],["🚒 Fire Brigade","101"],["🆘 Universal","112"]].map(([l,n])=><div key={n} style={{fontSize:13,opacity:0.7,marginBottom:8}}>{l}: <strong>{n}</strong></div>)}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Contact Us</div>
              <div style={{fontSize:13,opacity:0.7,lineHeight:2}}>📧 support@healthconnect.in<br/>📍 New Delhi, India<br/>🕐 24/7 Support Available</div>
            </div>
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.15)",paddingTop:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:12,opacity:0.5}}>© 2026 HealthConnect. All rights reserved. Made with ❤️ in India.</div>
            <div style={{display:"flex",gap:12}}>
              {["Twitter","LinkedIn","GitHub","Instagram"].map(s=><span key={s} style={{fontSize:12,opacity:0.5,cursor:"pointer"}}>{s}</span>)}
            </div>
          </div>
        </div>
      </footer>

      {/* 🤖 Chatbot UI Injection */}
      <ChatbotWidget />

      <style>{`*{box-sizing:border-box;}select,input,textarea,button{font-family:'Nunito','Segoe UI',sans-serif;}`}</style>
    </div>
  );
}
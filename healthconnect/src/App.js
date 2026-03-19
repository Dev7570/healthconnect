/**
 * ============================================
 *  HealthConnect — Frontend Application
 * ============================================
 *  Tech: React 18 + Leaflet Maps + Firebase Auth
 *  Features: Hospital search, doctor booking,
 *            dark mode, doctor profiles, payments
 * ============================================
 */
import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// 🌐 API URL — auto-detect local vs deployed
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://healthconnect-backend-dev-7570.onrender.com";

// 🎨 Color palette for hospitals
const COLORS = ["#0066CC","#E8432D","#00A651","#6B21A8","#F59E0B","#0F766E","#DC2626","#7C3AED","#059669","#D97706"];

const ALL_TESTS = ["Blood Test (CBC)","MRI Brain","CT Scan Chest","ECG","X-Ray","Lipid Profile"];
const SPECIALITIES = ["All","Cardiology","Neurology","Orthopedics","Oncology","Pediatrics","Gastroenterology","Nephrology","General Medicine","Emergency","Surgery"];
const TIME_SLOTS = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM"];

// Fallback doctor data when backend is unreachable
const DOCTORS_DB_FALLBACK = [
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

function BookingModal({doctor,hospital,user,onClose,onBooked}){
  const [step,setStep]=useState(1);
  const [date,setDate]=useState("Mon, 24 Mar");
  const [slot,setSlot]=useState(null);
  const [name,setName]=useState(user?.displayName||"");
  const [age,setAge]=useState("");
  const [phone,setPhone]=useState("");
  const [reason,setReason]=useState("");
  const [done,setDone]=useState(false);
  const [bookingId,setBookingId]=useState("");
  const [saving,setSaving]=useState(false);
  // 💳 Payment state
  const [payMethod,setPayMethod]=useState("upi");
  const [upiId,setUpiId]=useState("");
  const [cardNum,setCardNum]=useState("");
  const [cardExpiry,setCardExpiry]=useState("");
  const [cardCvv,setCardCvv]=useState("");
  const [selectedBank,setSelectedBank]=useState("");
  const [paying,setPaying]=useState(false);
  const [paymentDone,setPaymentDone]=useState(false);
  const [paymentData,setPaymentData]=useState(null);
  const dates=["Mon, 24 Mar","Tue, 25 Mar","Wed, 26 Mar","Thu, 27 Mar","Fri, 28 Mar"];
  const banks=["State Bank of India","HDFC Bank","ICICI Bank","Axis Bank","Punjab National Bank","Bank of Baroda","Kotak Mahindra"];
  const btn=(e={})=>({padding:"10px 20px",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer",fontSize:14,...e});
  const inp2={width:"100%",padding:"12px 14px",borderRadius:10,border:"2px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const stepLabels=["Date & Time","Details","Confirm","Payment"];

  const confirmBooking = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: doctor.name, doctorSpec: doctor.spec, hospitalName: hospital.name,
          hospitalId: hospital.id, date, time: slot, patientName: name,
          patientAge: age, patientEmail: user?.email, patientPhone: phone, reason, fee: doctor.fee,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingId(data.appointment.id);
        setStep(4); // Go to payment step
      }
    } catch (err) {
      setBookingId("HC" + Math.floor(Math.random() * 90000 + 10000));
      setStep(4);
    }
    setSaving(false);
  };

  const processPayment = async () => {
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: bookingId, method: payMethod, amount: doctor.fee,
          patientEmail: user?.email, upiId: payMethod==="upi"?upiId:null,
          cardLast4: payMethod==="card"?cardNum.slice(-4):null,
        }),
      });
      const data = await res.json();
      if (data.success) { setPaymentData(data.payment); setPaymentDone(true); setDone(true); if(onBooked) onBooked(); }
    } catch (err) {
      setPaymentData({id:"PAY"+Date.now(),receiptNo:"RCP"+Math.floor(Math.random()*900000+100000),status:"Success",paidAt:new Date().toISOString()});
      setPaymentDone(true); setDone(true); if(onBooked) onBooked();
    }
    setPaying(false);
  };

  const canPay = payMethod==="upi"?upiId.includes("@"):payMethod==="card"?(cardNum.length>=12&&cardExpiry&&cardCvv.length>=3):!!selectedBank;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:500,maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 60px rgba(0,0,0,0.3)"}}>
        <div style={{background:step===4?"linear-gradient(135deg,#059669,#10B981)":"linear-gradient(135deg,#0F4C81,#1E88E5)",padding:"20px 24px",borderRadius:"20px 20px 0 0",color:"white"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div><div style={{fontSize:13,opacity:0.8,marginBottom:4}}>{step===4?"Payment":"Booking Appointment"}</div><div style={{fontSize:18,fontWeight:700}}>{doctor.name}</div><div style={{fontSize:13,opacity:0.9}}>{doctor.spec} · {hospital.name}</div></div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 10px",color:"white",cursor:"pointer",fontSize:18}}>✕</button>
          </div>
          <div style={{display:"flex",gap:6,marginTop:16}}>
            {[1,2,3,4].map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:22,height:22,borderRadius:"50%",background:step>=s?"white":"rgba(255,255,255,0.3)",color:step>=s?(step===4?"#059669":"#1E88E5"):"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{done&&s===4?"✓":s}</div><span style={{fontSize:10,opacity:step>=s?1:0.6}}>{stepLabels[s-1]}</span>{s<4&&<span style={{opacity:0.4}}>›</span>}</div>)}
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
                {[["Full Name",name,setName,"text"],["Age",age,setAge,"number"],["Phone Number",phone,setPhone,"tel"]].map(([l,v,set,t])=><div key={l} style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:500,color:"#6B7280",display:"block",marginBottom:6}}>{l}{l==="Phone Number"&&<span style={{fontSize:11,color:"#9CA3AF",marginLeft:6}}>📱 for SMS confirmation</span>}</label><input type={t} value={v} onChange={e=>set(e.target.value)} placeholder={l==="Phone Number"?"+91 XXXXX XXXXX":l} style={inp2}/></div>)}
                <div style={{marginBottom:20}}><label style={{fontSize:13,fontWeight:500,color:"#6B7280",display:"block",marginBottom:6}}>Reason for Visit</label><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe symptoms..." style={{...inp2,resize:"vertical",minHeight:80}}/></div>
                <div style={{display:"flex",gap:10}}><button onClick={()=>setStep(1)} style={btn({flex:1,border:"2px solid #E5E7EB",background:"white",color:"#374151"})}>← Back</button><button onClick={()=>name&&setStep(3)} style={btn({flex:2,background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white"})}>Review →</button></div>
              </div>}
              {step===3&&<div>
                <div style={{background:"#F8FAFC",borderRadius:14,padding:18,marginBottom:20}}>
                  <div style={{fontWeight:700,marginBottom:12,color:"#0F4C81"}}>Appointment Summary</div>
                  {[["Doctor",doctor.name],["Speciality",doctor.spec],["Hospital",hospital.name],["Date",date],["Time",slot],["Patient",name],["Phone",phone||"N/A"],["Email",user?.email],["Fee",`₹${doctor.fee}`]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}><span style={{color:"#6B7280"}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
                </div>
                <div style={{display:"flex",gap:10}}><button onClick={()=>setStep(2)} style={btn({flex:1,border:"2px solid #E5E7EB",background:"white",color:"#374151"})}>← Back</button><button onClick={confirmBooking} disabled={saving} style={btn({flex:2,background:saving?"#94A3B8":"linear-gradient(135deg,#059669,#10B981)",color:"white"})}>{saving?"Booking...":"Proceed to Pay ₹"+doctor.fee+" →"}</button></div>
              </div>}
              {step===4&&<div>
                <div style={{background:"#F0FDF4",borderRadius:12,padding:"12px 16px",marginBottom:20,border:"1px solid #BBF7D0"}}>
                  <div style={{fontSize:13,color:"#15803D",fontWeight:600}}>✅ Appointment Booked — ID: <strong>{bookingId}</strong></div>
                  <div style={{fontSize:12,color:"#6B7280",marginTop:2}}>Complete payment to confirm your slot</div>
                </div>

                <div style={{fontWeight:700,marginBottom:14,fontSize:15}}>💳 Select Payment Method</div>
                <div style={{display:"flex",gap:8,marginBottom:20}}>
                  {[["upi","📱 UPI","#7C3AED"],["card","💳 Card","#0F4C81"],["netbanking","🏦 Net Banking","#059669"]].map(([id,label,color])=>(
                    <button key={id} onClick={()=>setPayMethod(id)} style={{flex:1,padding:"12px 8px",borderRadius:12,border:payMethod===id?`2px solid ${color}`:"2px solid #E5E7EB",background:payMethod===id?`${color}10`:"white",color:payMethod===id?color:"#6B7280",fontWeight:payMethod===id?700:500,fontSize:13,cursor:"pointer",textAlign:"center"}}>{label}</button>
                  ))}
                </div>

                {payMethod==="upi"&&<div>
                  <div style={{background:"#FAF5FF",borderRadius:14,padding:20,border:"1px solid #E9D5FF"}}>
                    <div style={{fontWeight:600,marginBottom:12,color:"#7C3AED"}}>📱 Pay via UPI</div>
                    <div style={{marginBottom:14}}>
                      <label style={{fontSize:13,fontWeight:500,color:"#6B7280",display:"block",marginBottom:6}}>UPI ID</label>
                      <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="yourname@paytm / phone@gpay" style={inp2}/>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {["@paytm","@gpay","@ybl","@phonepe"].map(s=><span key={s} onClick={()=>setUpiId(prev=>prev.split("@")[0]+s)} style={{background:"#EDE9FE",color:"#7C3AED",padding:"4px 10px",borderRadius:8,fontSize:11,cursor:"pointer",fontWeight:600}}>{s}</span>)}
                    </div>
                  </div>
                </div>}

                {payMethod==="card"&&<div>
                  <div style={{background:"#EFF6FF",borderRadius:14,padding:20,border:"1px solid #BFDBFE"}}>
                    <div style={{fontWeight:600,marginBottom:12,color:"#0F4C81"}}>💳 Credit / Debit Card</div>
                    <div style={{marginBottom:14}}>
                      <label style={{fontSize:13,fontWeight:500,color:"#6B7280",display:"block",marginBottom:6}}>Card Number</label>
                      <input value={cardNum} onChange={e=>setCardNum(e.target.value.replace(/\D/g,"").slice(0,16))} placeholder="1234 5678 9012 3456" maxLength={16} style={inp2}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div><label style={{fontSize:13,fontWeight:500,color:"#6B7280",display:"block",marginBottom:6}}>Expiry</label><input value={cardExpiry} onChange={e=>setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} style={inp2}/></div>
                      <div><label style={{fontSize:13,fontWeight:500,color:"#6B7280",display:"block",marginBottom:6}}>CVV</label><input type="password" value={cardCvv} onChange={e=>setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="•••" maxLength={4} style={inp2}/></div>
                    </div>
                  </div>
                </div>}

                {payMethod==="netbanking"&&<div>
                  <div style={{background:"#F0FDF4",borderRadius:14,padding:20,border:"1px solid #BBF7D0"}}>
                    <div style={{fontWeight:600,marginBottom:12,color:"#059669"}}>🏦 Select Your Bank</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {banks.map(b=><button key={b} onClick={()=>setSelectedBank(b)} style={{padding:"12px 16px",borderRadius:10,border:selectedBank===b?"2px solid #059669":"2px solid #E5E7EB",background:selectedBank===b?"#F0FDF4":"white",color:selectedBank===b?"#059669":"#374151",fontWeight:selectedBank===b?700:400,fontSize:14,cursor:"pointer",textAlign:"left"}}>{selectedBank===b?"✓ ":""}{b}</button>)}
                    </div>
                  </div>
                </div>}

                <div style={{background:"#FFFBEB",borderRadius:12,padding:"12px 16px",marginTop:16,marginBottom:16,border:"1px solid #FDE68A",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,color:"#92400E"}}>Total Amount</div>
                  <div style={{fontSize:22,fontWeight:900,color:"#92400E"}}>₹{doctor.fee}</div>
                </div>

                <button onClick={processPayment} disabled={!canPay||paying} style={btn({width:"100%",padding:"14px",borderRadius:12,background:canPay?(paying?"#94A3B8":"linear-gradient(135deg,#059669,#10B981)"):"#E5E7EB",color:canPay?"white":"#9CA3AF",fontSize:16})}>{paying?"Processing Payment...":"Pay ₹"+doctor.fee+" →"}</button>
              </div>}
            </>
          ):(
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{fontSize:56,marginBottom:12}}>🎉</div>
              <div style={{fontSize:22,fontWeight:800,color:"#059669",marginBottom:6}}>Payment Successful!</div>
              <div style={{fontSize:14,color:"#6B7280",marginBottom:8}}>Your appointment is confirmed and paid.</div>
              {phone&&<div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#15803D",fontWeight:600,marginBottom:16}}>📱 SMS confirmation sent to {phone}</div>}

              <div style={{background:"#F8FAFC",borderRadius:14,padding:18,textAlign:"left",marginBottom:20}}>
                <div style={{fontWeight:700,marginBottom:12,color:"#0F4C81",fontSize:15}}>🧾 Payment Receipt</div>
                {[["Booking ID",bookingId],["Payment ID",paymentData?.id||"—"],["Receipt No",paymentData?.receiptNo||"—"],["Doctor",doctor.name],["Hospital",hospital.name],["Date & Time",`${date}, ${slot}`],["Patient",user?.displayName||name],["Payment Method",payMethod==="upi"?"UPI":payMethod==="card"?"Card":"Net Banking"],["Amount Paid",`₹${doctor.fee}`],["Status","✅ Success"]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}><span style={{color:"#6B7280"}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
              </div>

              <button onClick={onClose} style={btn({background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",padding:"12px 32px",borderRadius:12,fontSize:15})}>Done ✓</button>
            </div>
          )}
        </div>
      </div>
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

  // 🌙 Dark Mode
  const [darkMode,setDarkMode]=useState(()=>localStorage.getItem("hc_darkMode")==="true");
  useEffect(()=>{localStorage.setItem("hc_darkMode",darkMode);},[darkMode]);

  // 👨‍⚕️ Doctor Profile
  const [selectedDoctor,setSelectedDoctor]=useState(null);

  // 🆕 NEW STATE — Appointments, Reviews from backend
  const [myAppointments,setMyAppointments]=useState([]);
  const [loadingAppts,setLoadingAppts]=useState(false);
  const [hospitalReviews,setHospitalReviews]=useState([]);
  const [loadingReviews,setLoadingReviews]=useState(false);
  const [tipsFilter,setTipsFilter]=useState("All");
  const [cityInput,setCityInput]=useState("New Delhi");

  // 👨‍⚕️ All Doctors state
  const [allDoctors,setAllDoctors]=useState([]);
  const [loadingAllDocs,setLoadingAllDocs]=useState(false);
  const [docSpecFilter,setDocSpecFilter]=useState("All");

  // 🏥 Real hospital data from backend
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ✅ Fetch real hospitals from backend (with timeout for Render cold starts)
  const fetchHospitals = async (city = "New Delhi") => {
    setLoadingHospitals(true);
    setApiError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for cold start
      const res = await fetch(`${API_URL}/hospitals?city=${encodeURIComponent(city)}`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if(data.success && data.hospitals.length > 0){
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
      if(err.name === "AbortError") {
        setApiError("⏳ Server is waking up (free tier cold start). Please click Retry — it should work now!");
      } else {
        setApiError("Could not connect to backend. The server may be starting up — please try again in 30 seconds.");
      }
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

  // 🆕 Fetch all doctors (for standalone page) — with timeout + fallback
  const fetchAllDoctors = async () => {
    setLoadingAllDocs(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      const allDocs = [];
      for (let hid = 1; hid <= 3; hid++) {
        const res = await fetch(`${API_URL}/doctors?hospitalId=${hid}`, { signal: controller.signal });
        const data = await res.json();
        if (data.success) {
          data.doctors.forEach(d => {
            if (!allDocs.find(x => x.name === d.name)) allDocs.push(d);
          });
        }
      }
      clearTimeout(timeout);
      setAllDoctors(allDocs.length > 0 ? allDocs : DOCTORS_DB_FALLBACK);
    } catch {
      // On timeout or error, show fallback doctors immediately
      setAllDoctors(DOCTORS_DB_FALLBACK);
    }
    setLoadingAllDocs(false);
  };

  const go = async (v, h = null, doc = null) => {
    setView(v);
    if (h) {
      const docs = await fetchDoctors(h.id);
      if (docs) h = { ...h, doctors: docs };
      setSelectedHospital(h);
    }
    if (doc) setSelectedDoctor(doc);
    if (v === "detail" && h) fetchReviews(h.id);
    if (v === "appointments") fetchMyAppointments();
    if (v === "allDoctors") fetchAllDoctors();
  };
  const notifShow=(m)=>{setNotif(m);setTimeout(()=>setNotif(null),3000);};
  const toggleTest=(t)=>setSelectedTests(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const handleLogout=async()=>{ await signOut(auth); notifShow("Logged out successfully!"); };
  const handleBookClick=(doc)=>{ if(!user){ setShowAuth(true); } else { setBookingDoctor(doc); } };

  // 🆕 Cancel appointment via backend
  const cancelAppointment = async (id) => {
    try {
      await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
      notifShow("Appointment cancelled.");
      fetchMyAppointments();
    } catch (err) { notifShow("Could not cancel. Try again."); }
  };

  // 🎨 Dark mode theme
  const dm = darkMode;
  const theme = {
    bg: dm?"#0F172A":"#F1F5F9", text: dm?"#F1F5F9":"#111827",
    card: dm?"#1E293B":"white", cardBorder: dm?"#334155":"#E5E7EB",
    muted: dm?"#94A3B8":"#6B7280", subtle: dm?"#1E293B":"#F8FAFC",
    navBg: dm?"linear-gradient(135deg,#0F172A,#1E293B)":"linear-gradient(135deg,#0F4C81,#1565C0)",
    inputBorder: dm?"#475569":"#E5E7EB", inputBg: dm?"#1E293B":"white",
  };

  const card={background:theme.card,borderRadius:16,boxShadow:dm?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",overflow:"hidden",transition:"transform 0.2s,box-shadow 0.2s",cursor:"pointer",color:theme.text};
  const btn=(e={})=>({padding:"10px 20px",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer",fontSize:14,...e});
  const inp={padding:"12px 16px",borderRadius:10,border:`2px solid ${theme.inputBorder}`,fontSize:14,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:theme.inputBg,color:theme.text};

  if(authLoading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontSize:20,fontWeight:700,color:"#0F4C81",background:theme.bg}}>🩺 Loading HealthConnect...</div>;
  if(showAuth) return <AuthPage onSuccess={()=>setShowAuth(false)}/>;

  return(
    <div style={{fontFamily:"'Nunito','Segoe UI',sans-serif",minHeight:"100vh",background:theme.bg,color:theme.text,transition:"background 0.3s,color 0.3s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      {notif&&<div className="anim-notif" style={{position:"fixed",top:20,right:20,background:"linear-gradient(135deg,#065F46,#059669)",color:"white",padding:"14px 22px",borderRadius:14,zIndex:9999,fontWeight:700,fontSize:14,boxShadow:"0 10px 30px rgba(5,150,105,0.4)"}}>✓ {notif}</div>}
      {bookingDoctor&&selectedHospital&&<BookingModal doctor={bookingDoctor} hospital={selectedHospital} user={user} onClose={()=>setBookingDoctor(null)} onBooked={fetchMyAppointments}/>}

      {/* NAVBAR */}
      <nav style={{background:theme.navBg,padding:"0 20px",position:"sticky",top:0,zIndex:500,boxShadow:dm?"0 2px 20px rgba(0,0,0,0.5)":"0 2px 20px rgba(15,76,129,0.4)",animation:"slideDown 0.5s ease-out"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:16,height:60}}>
          <div style={{color:"white",fontWeight:900,fontSize:20,cursor:"pointer"}} onClick={()=>go("home")}>🩺 HealthConnect</div>
          <div style={{flex:1}}/>
          {[["Hospitals","list"],["👨‍⚕️ Doctors","allDoctors"],["Compare","compare"],["🗺️ Map","map"],["🚨 SOS","emergency"],["💡 Tips","tips"],...(user?[["📋 My Appts","appointments"]]:[])]  .map(([l,v])=><span key={v} className="anim-navlink" onClick={()=>go(v)} style={{color:"white",fontSize:13,cursor:"pointer",fontWeight:600,padding:"6px 10px",borderRadius:8,background:view===v?"rgba(255,255,255,0.2)":"transparent"}}>{l}</span>)}
          {/* 🌙 Dark Mode Toggle */}
          <button onClick={()=>setDarkMode(!dm)} style={{background:dm?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:20,padding:"6px 12px",color:"white",cursor:"pointer",fontSize:16,fontWeight:600,transition:"all 0.3s"}} title={dm?"Switch to Light Mode":"Switch to Dark Mode"}>{dm?"☀️":"🌙"}</button>
          {user ? (
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"6px 14px",color:"white",fontSize:13,fontWeight:600}}>👤 {user.displayName||user.email}</div>
              <button onClick={handleLogout} style={btn({background:"rgba(255,255,255,0.2)",color:"white",fontSize:13,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.3)"})}>Logout</button>
            </div>
          ) : (
            <button className="anim-btn anim-glow" onClick={()=>setShowAuth(true)} style={btn({background:"white",color:"#0F4C81",fontSize:13,padding:"8px 16px"})}>Sign In / Sign Up</button>
          )}
        </div>
      </nav>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>

        {/* =========== HOME =========== */}
        {view==="home"&&<div>
          <div className="hero-gradient" style={{background:"linear-gradient(135deg,#0F4C81,#1565C0 60%,#42A5F5)",borderRadius:20,padding:"48px 40px",marginBottom:32,color:"white",position:"relative",overflow:"hidden"}}>
            <div className="anim-float" style={{position:"absolute",right:40,top:-20,fontSize:120,opacity:0.08}}>🏥</div>
            {user&&<div className="anim-hero-text" style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"10px 16px",marginBottom:16,fontSize:14,fontWeight:600,display:"inline-block"}}>👋 Welcome back, {user.displayName||"User"}!</div>}
            <div className="anim-hero-text" style={{fontSize:13,fontWeight:700,letterSpacing:2,opacity:0.7,marginBottom:12,textTransform:"uppercase"}}>India's Healthcare Platform</div>
            <h1 className="anim-hero-subtitle" style={{margin:"0 0 12px",fontSize:36,fontWeight:900,lineHeight:1.2}}>Find Real Hospitals,<br/>Book Appointments</h1>
            <p className="anim-hero-search" style={{margin:"0 0 28px",opacity:0.85,fontSize:16,maxWidth:500}}>Real hospital data powered by Google Places. Search any city in India!</p>

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
            {[[hospitals.length||"20+","Hospitals Found",dm?"#1E293B":"#EFF6FF","#1E88E5"],["9","Doctors Available",dm?"#1E293B":"#F0FDF4","#10B981"],["6","Tests to Compare",dm?"#1E293B":"#FFFBEB","#F59E0B"],["24/7","Emergency Support",dm?"#1E293B":"#FFF1F2","#EF4444"]].map(([v,l,bg,c])=><div key={l} className="anim-stat" style={{background:bg,borderRadius:14,padding:20,textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:12,color:theme.muted,fontWeight:600,marginTop:4}}>{l}</div></div>)}
          </div>

          {!user&&<div style={{background:"linear-gradient(135deg,#0F4C81,#1565C0)",borderRadius:16,padding:"24px 28px",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <div><div style={{fontWeight:800,fontSize:18,marginBottom:6}}>🔐 Sign in to Book Appointments</div><div style={{opacity:0.85,fontSize:14}}>Create a free account to book doctors instantly</div></div>
            <button onClick={()=>setShowAuth(true)} style={btn({background:"white",color:"#0F4C81",padding:"12px 24px"})}>Sign Up Free →</button>
          </div>}

          {/* Loading / Error */}
          {loadingHospitals&&<div style={{textAlign:"center",padding:"40px",background:"white",borderRadius:16,marginBottom:24}}>
            <div className="anim-spinner"></div>
            <div style={{fontWeight:700,color:"#0F4C81",marginTop:8}}>Fetching real hospitals from Google...</div>
          </div>}

          {apiError&&<div style={{background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:14,padding:"16px 20px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:"#BE123C",fontWeight:600}}>⚠️ {apiError}</span><button onClick={()=>fetchHospitals(cityInput)} style={{background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",border:"none",borderRadius:10,padding:"8px 20px",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0,marginLeft:12}}>🔄 Retry</button></div>}

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
          <div style={{background:theme.card,borderRadius:14,padding:18,marginBottom:20,boxShadow:dm?"0 2px 8px rgba(0,0,0,0.3)":"0 2px 8px rgba(0,0,0,0.05)",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{flex:1,minWidth:200,position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hospitals..." style={{...inp,paddingLeft:36}}/></div>
            <select value={specFilter} onChange={e=>setSpecFilter(e.target.value)} style={{padding:"12px 16px",borderRadius:10,border:`2px solid ${theme.inputBorder}`,fontSize:14,background:theme.inputBg,color:theme.text,cursor:"pointer",fontFamily:"inherit"}}>{SPECIALITIES.map(sp=><option key={sp}>{sp}</option>)}</select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"12px 16px",borderRadius:10,border:`2px solid ${theme.inputBorder}`,fontSize:14,background:theme.inputBg,color:theme.text,cursor:"pointer",fontFamily:"inherit"}}><option value="rating">Sort: Best Rated</option><option value="reviews">Sort: Most Reviewed</option></select>
          </div>

          {loadingHospitals&&<div style={{textAlign:"center",padding:"60px",background:"white",borderRadius:16}}><div className="anim-spinner"></div><div style={{fontWeight:700,color:"#0F4C81",marginTop:8}}>Loading real hospitals...</div></div>}

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filtered.map(h=><div key={h.id} className="anim-card anim-hospital" style={card} onClick={()=>go("detail",h)}>
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
                <div onClick={()=>go("doctorProfile",null,doc)} style={{width:54,height:54,borderRadius:"50%",background:`${selectedHospital.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,cursor:"pointer",transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>👨‍⚕️</div>
                <div style={{flex:1}}><div onClick={()=>go("doctorProfile",null,doc)} style={{fontWeight:800,fontSize:16,marginBottom:3,cursor:"pointer",color:"#1E88E5"}}>{doc.name}</div><div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"}}><Badge color={`${selectedHospital.color}14`} text={selectedHospital.color}>{doc.spec}</Badge><Badge color="#FFFBEB" text="#92400E">Available: {doc.available}</Badge></div><Star rating={doc.rating}/></div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:22,fontWeight:900,color:dm?"#60A5FA":"#0F4C81",marginBottom:4}}>₹{doc.fee}</div>
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
                    {apt.status==="Confirmed"&&<button onClick={()=>cancelAppointment(apt.id)} style={btn({background:"#FFF1F2",color:"#BE123C",border:"1px solid #FECDD3",fontSize:12,padding:"6px 14px"})}>Cancel ✕</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* =========== 🆕 EMERGENCY SOS =========== */}
        {view==="emergency"&&<div>
          <div className="sos-gradient" style={{background:"linear-gradient(135deg,#DC2626,#BE123C)",borderRadius:20,padding:"36px 32px",marginBottom:28,color:"white",textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div className="anim-float" style={{position:"absolute",right:30,top:-10,fontSize:100,opacity:0.1}}>🚨</div>
            <div style={{fontSize:48,marginBottom:12,animation:"bounceIn 0.6s ease-out"}}>🆘</div>
            <h1 style={{margin:"0 0 8px",fontSize:28,fontWeight:900}}>Emergency Services</h1>
            <p style={{margin:0,opacity:0.9,fontSize:15}}>One tap to call emergency services. Stay calm, help is on the way.</p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
            {EMERGENCY_CONTACTS.map(ec=>(
              <div key={ec.number} className="anim-card anim-tipcard" style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
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

        {/* =========== 🆕 ALL DOCTORS =========== */}
        {view==="allDoctors"&&<div>
          <div className="hero-gradient" style={{background:"linear-gradient(135deg,#1565C0,#0F4C81,#42A5F5)",borderRadius:20,padding:"36px 32px",marginBottom:28,color:"white",position:"relative",overflow:"hidden"}}>
            <div className="anim-float" style={{position:"absolute",right:30,top:-10,fontSize:100,opacity:0.08}}>👨‍⚕️</div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,opacity:0.7,marginBottom:8,textTransform:"uppercase"}}>HealthConnect Doctors</div>
            <h1 style={{margin:"0 0 8px",fontSize:28,fontWeight:900}}>Our Medical Experts</h1>
            <p style={{margin:0,opacity:0.9,fontSize:15,maxWidth:500}}>Browse our panel of experienced doctors across all specialities. View profiles and book appointments instantly.</p>
          </div>

          {/* Speciality Filter */}
          <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
            {SPECIALITIES.map(sp=>(
              <button key={sp} className="anim-filter" onClick={()=>setDocSpecFilter(sp)} style={{padding:"8px 16px",borderRadius:20,border:docSpecFilter===sp?"2px solid #1E88E5":`2px solid ${theme.inputBorder}`,background:docSpecFilter===sp?(dm?"#1E3A5F":"#EFF6FF"):theme.card,color:docSpecFilter===sp?"#1E88E5":theme.muted,fontWeight:docSpecFilter===sp?700:500,fontSize:13,cursor:"pointer"}}>{sp}</button>
            ))}
          </div>

          {loadingAllDocs&&<div style={{textAlign:"center",padding:"60px",background:theme.card,borderRadius:16}}><div className="anim-spinner"></div><div style={{fontWeight:700,color:"#0F4C81",marginTop:8}}>Loading doctors...</div></div>}

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
            {allDoctors.filter(d=>docSpecFilter==="All"||d.spec===docSpecFilter).map((doc,i)=>(
              <div key={doc.id+"-"+i} className="anim-card anim-tipcard" style={{...card,cursor:"default"}}>
                <div style={{background:`linear-gradient(135deg,${COLORS[i%COLORS.length]}15,${COLORS[i%COLORS.length]}08)`,padding:"20px 22px",borderBottom:`3px solid ${COLORS[i%COLORS.length]}25`}}>
                  <div style={{display:"flex",gap:16,alignItems:"center"}}>
                    <div onClick={()=>go("doctorProfile",null,doc)} style={{width:60,height:60,borderRadius:"50%",background:`${COLORS[i%COLORS.length]}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0,cursor:"pointer",border:`2px solid ${COLORS[i%COLORS.length]}40`,transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>👨‍⚕️</div>
                    <div style={{flex:1}}>
                      <div onClick={()=>go("doctorProfile",null,doc)} style={{fontWeight:800,fontSize:17,marginBottom:4,cursor:"pointer",color:dm?"#60A5FA":"#0F4C81"}}>{doc.name}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <Badge color={`${COLORS[i%COLORS.length]}18`} text={COLORS[i%COLORS.length]}>{doc.spec}</Badge>
                        <Badge color={dm?"#1E293B":"#FFFBEB"} text="#92400E">{doc.exp} yrs exp</Badge>
                        <Badge color={doc.available==="Today"?(dm?"#064E3B":"#F0FDF4"):dm?"#1E293B":"#FFF7ED"} text={doc.available==="Today"?"#15803D":"#92400E"}>{doc.available==="Today"?"✅":"📅"} {doc.available}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{padding:"16px 22px"}}>
                  <div style={{fontSize:13,color:theme.muted,lineHeight:1.7,marginBottom:12,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{doc.bio||"Experienced medical professional providing quality patient care."}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><Star rating={doc.rating}/><span style={{fontWeight:700,fontSize:13}}>{doc.rating}/5</span></div>
                      <div style={{fontSize:20,fontWeight:900,color:dm?"#60A5FA":"#0F4C81",marginTop:4}}>₹{doc.fee}</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>go("doctorProfile",null,doc)} style={btn({background:dm?"#334155":"#F1F5F9",color:dm?"#60A5FA":"#0F4C81",border:`1px solid ${theme.inputBorder}`,padding:"8px 14px",fontSize:12})}>View Profile</button>
                      <button onClick={()=>handleBookClick(doc)} style={btn({background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",padding:"8px 16px",fontSize:12})}>{user?"📅 Book":"🔐 Login"}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loadingAllDocs&&allDoctors.filter(d=>docSpecFilter==="All"||d.spec===docSpecFilter).length===0&&<div style={{textAlign:"center",padding:"60px",background:theme.card,borderRadius:16,color:theme.muted}}><div style={{fontSize:48,marginBottom:12}}>🔍</div><div style={{fontSize:18,fontWeight:700}}>No doctors found for this speciality</div></div>}
        </div>}

        {/* =========== 🆕 HEALTH TIPS =========== */}
        {view==="tips"&&<div>
          <div className="tips-gradient" style={{background:"linear-gradient(135deg,#059669,#10B981)",borderRadius:20,padding:"36px 32px",marginBottom:28,color:"white",position:"relative",overflow:"hidden"}}>
            <div className="anim-float" style={{position:"absolute",right:30,top:-10,fontSize:100,opacity:0.1}}>💡</div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,opacity:0.7,marginBottom:8,textTransform:"uppercase"}}>HealthConnect Tips</div>
            <h1 style={{margin:"0 0 8px",fontSize:28,fontWeight:900}}>Health Tips & Awareness</h1>
            <p style={{margin:0,opacity:0.9,fontSize:15,maxWidth:500}}>Curated health tips to help you live a healthier, happier life.</p>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
            {["All","Prevention","Nutrition","Mental Health","First Aid","Fitness","Hygiene","Sleep","Hydration"].map(cat=>(
              <button key={cat} className="anim-filter" onClick={()=>setTipsFilter(cat)} style={{padding:"8px 16px",borderRadius:20,border:tipsFilter===cat?"2px solid #059669":"2px solid #E5E7EB",background:tipsFilter===cat?"#F0FDF4":"white",color:tipsFilter===cat?"#059669":"#6B7280",fontWeight:tipsFilter===cat?700:500,fontSize:13,cursor:"pointer"}}>{cat}</button>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
            {HEALTH_TIPS.filter(t=>tipsFilter==="All"||t.category===tipsFilter).map(tip=>(
              <div key={tip.id} className="anim-card anim-tipcard" style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
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

        {/* =========== 🆕 DOCTOR PROFILE =========== */}
        {view==="doctorProfile"&&selectedDoctor&&<div>
          <button onClick={()=>go(selectedHospital?"detail":"list")} style={btn({background:theme.card,color:theme.text,border:`2px solid ${theme.cardBorder}`,marginBottom:20})}>← Back</button>
          <div style={{background:"linear-gradient(135deg,#0F4C81,#1565C0,#42A5F5)",borderRadius:20,padding:"40px 36px",color:"white",marginBottom:24,position:"relative",overflow:"hidden"}}>
            <div className="anim-float" style={{position:"absolute",right:30,top:-10,fontSize:100,opacity:0.08}}>👨‍⚕️</div>
            <div style={{display:"flex",gap:24,alignItems:"center"}}>
              <div style={{width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,flexShrink:0,border:"3px solid rgba(255,255,255,0.4)"}}>👨‍⚕️</div>
              <div style={{flex:1}}>
                <div style={{fontSize:28,fontWeight:900,marginBottom:6}}>{selectedDoctor.name}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                  <span style={{background:"rgba(255,255,255,0.2)",padding:"4px 14px",borderRadius:20,fontSize:13,fontWeight:600}}>{selectedDoctor.spec}</span>
                  <span style={{background:"rgba(255,255,255,0.2)",padding:"4px 14px",borderRadius:20,fontSize:13,fontWeight:600}}>{selectedDoctor.exp} yrs exp</span>
                  <span style={{background:"rgba(255,255,255,0.2)",padding:"4px 14px",borderRadius:20,fontSize:13,fontWeight:600}}>Available: {selectedDoctor.available}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}><Star rating={selectedDoctor.rating} size={18}/><span style={{fontWeight:700,fontSize:16}}>{selectedDoctor.rating}/5</span></div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:36,fontWeight:900}}>₹{selectedDoctor.fee}</div>
                <div style={{fontSize:13,opacity:0.8}}>Consultation Fee</div>
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
            {[["🎓 Experience",`${selectedDoctor.exp} Years`,"#EFF6FF","#1E88E5"],["⭐ Rating",`${selectedDoctor.rating}/5`,"#FFFBEB","#F59E0B"],["💰 Fee",`₹${selectedDoctor.fee}`,"#F0FDF4","#10B981"]].map(([t,v,bg,c])=><div key={t} style={{background:dm?"#1E293B":bg,borderRadius:14,padding:20,textAlign:"center"}}><div style={{fontSize:13,color:theme.muted,fontWeight:600,marginBottom:6}}>{t}</div><div style={{fontSize:24,fontWeight:900,color:c}}>{v}</div></div>)}
          </div>

          <div style={{background:theme.card,borderRadius:16,padding:24,marginBottom:20,boxShadow:dm?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:4,color:dm?"#60A5FA":"#0F4C81"}}>About</div>
            <div style={{fontSize:14,color:theme.muted,lineHeight:1.8,marginBottom:16}}>{selectedDoctor.bio||"Highly experienced medical professional dedicated to providing the best patient care."}</div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:theme.text}}>📜 Qualifications</div>
            <div style={{fontSize:14,color:theme.muted,marginBottom:16}}>{selectedDoctor.qualifications||"MBBS, MD"}</div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:theme.text}}>🕐 Available Slots</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {(selectedDoctor.slots||TIME_SLOTS.slice(0,5)).map(s=><span key={s} style={{background:dm?"#334155":"#EFF6FF",color:dm?"#60A5FA":"#1E88E5",padding:"6px 14px",borderRadius:10,fontSize:13,fontWeight:600}}>{s}</span>)}
            </div>
          </div>

          {selectedHospital&&<div style={{background:theme.card,borderRadius:16,padding:20,marginBottom:20,boxShadow:dm?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,fontSize:14,marginBottom:4}}>🏥 {selectedHospital.name}</div><div style={{fontSize:13,color:theme.muted}}>{selectedHospital.address}</div></div>
            <button onClick={()=>handleBookClick(selectedDoctor)} style={btn({background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",padding:"12px 28px",fontSize:15})}>{user?"Book Appointment →":"🔐 Login to Book"}</button>
          </div>}

          {!selectedHospital&&<button onClick={()=>handleBookClick(selectedDoctor)} style={btn({background:"linear-gradient(135deg,#0F4C81,#1E88E5)",color:"white",padding:"14px 32px",fontSize:16,width:"100%",borderRadius:14})}>{user?"Book Appointment →":"🔐 Login to Book"}</button>}
        </div>}

      </div>

      {/* =========== 🆕 FOOTER =========== */}
      <footer className="anim-footer" style={{background:dm?"linear-gradient(135deg,#0F172A,#1E293B)":"linear-gradient(135deg,#0F4C81,#0A2E4E)",color:"white",padding:"48px 20px 24px",marginTop:40}}>
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

      <style>{`
        *{box-sizing:border-box;}
        select,input,textarea,button{font-family:'Nunito','Segoe UI',sans-serif;}

        /* 🎬 KEYFRAME ANIMATIONS */
        @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(100px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes bounceIn{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.05)}70%{transform:scale(0.9)}100%{transform:scale(1);opacity:1}}
        @keyframes ripple{0%{transform:scale(0);opacity:0.5}100%{transform:scale(4);opacity:0}}
        @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(30,136,229,0.4)}50%{box-shadow:0 0 24px rgba(30,136,229,0.8)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes typewriter{from{width:0}to{width:100%}}
        @keyframes blink{0%,100%{border-color:transparent}50%{border-color:white}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
        @keyframes countUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        /* 🏠 HERO ANIMATED GRADIENT */
        .hero-gradient{background:linear-gradient(-45deg,#0F4C81,#1565C0,#1E88E5,#42A5F5,#0F4C81)!important;background-size:300% 300%!important;animation:gradientShift 8s ease infinite}

        /* 🃏 CARD HOVER EFFECTS */
        .anim-card{transition:transform 0.35s cubic-bezier(.4,0,.2,1),box-shadow 0.35s cubic-bezier(.4,0,.2,1)!important}
        .anim-card:hover{transform:translateY(-8px)!important;box-shadow:0 20px 40px rgba(0,0,0,0.15)!important}

        /* 🔘 BUTTON HOVER EFFECTS */
        .anim-btn{transition:transform 0.2s,box-shadow 0.2s,filter 0.2s!important;position:relative;overflow:hidden}
        .anim-btn:hover{transform:translateY(-2px)!important;box-shadow:0 8px 25px rgba(0,0,0,0.2)!important;filter:brightness(1.08)}
        .anim-btn:active{transform:translateY(0) scale(0.97)!important}

        /* ✨ NOTIFICATION TOAST */
        .anim-notif{animation:slideInRight 0.4s cubic-bezier(.4,0,.2,1)}

        /* 📊 STATS CARDS */
        .anim-stat{animation:fadeInUp 0.6s ease-out both}
        .anim-stat:nth-child(1){animation-delay:0.1s}
        .anim-stat:nth-child(2){animation-delay:0.2s}
        .anim-stat:nth-child(3){animation-delay:0.3s}
        .anim-stat:nth-child(4){animation-delay:0.4s}

        /* 🏥 HOSPITAL LIST ITEMS — staggered */
        .anim-hospital{animation:fadeInUp 0.5s ease-out both}
        .anim-hospital:nth-child(1){animation-delay:0.05s}
        .anim-hospital:nth-child(2){animation-delay:0.10s}
        .anim-hospital:nth-child(3){animation-delay:0.15s}
        .anim-hospital:nth-child(4){animation-delay:0.20s}
        .anim-hospital:nth-child(5){animation-delay:0.25s}
        .anim-hospital:nth-child(6){animation-delay:0.30s}
        .anim-hospital:nth-child(7){animation-delay:0.35s}
        .anim-hospital:nth-child(8){animation-delay:0.40s}
        .anim-hospital:nth-child(9){animation-delay:0.45s}
        .anim-hospital:nth-child(10){animation-delay:0.50s}

        /* 🔗 NAV LINKS */
        .anim-navlink{transition:all 0.25s ease!important}
        .anim-navlink:hover{background:rgba(255,255,255,0.25)!important;transform:translateY(-1px)}

        /* 🌟 FLOATING ICON */
        .anim-float{animation:float 4s ease-in-out infinite}

        /* 💡 TIPS / SOS CARDS — staggered */
        .anim-tipcard{animation:scaleIn 0.4s ease-out both}
        .anim-tipcard:nth-child(1){animation-delay:0.05s}
        .anim-tipcard:nth-child(2){animation-delay:0.10s}
        .anim-tipcard:nth-child(3){animation-delay:0.15s}
        .anim-tipcard:nth-child(4){animation-delay:0.20s}
        .anim-tipcard:nth-child(5){animation-delay:0.25s}
        .anim-tipcard:nth-child(6){animation-delay:0.30s}
        .anim-tipcard:nth-child(7){animation-delay:0.35s}
        .anim-tipcard:nth-child(8){animation-delay:0.40s}

        /* 🏷️ BADGE PULSE */  
        .anim-badge-pulse{animation:pulse 2s ease-in-out infinite}

        /* 🌀 LOADING SPINNER */
        .anim-spinner{width:40px;height:40px;border:4px solid #E5E7EB;border-top-color:#1E88E5;border-radius:50%;animation:spin 0.8s linear infinite;margin:20px auto}

        /* 🎯 HERO TEXT */
        .anim-hero-text{animation:fadeInUp 0.8s ease-out both}
        .anim-hero-subtitle{animation:fadeInUp 0.8s ease-out 0.2s both}
        .anim-hero-search{animation:fadeInUp 0.8s ease-out 0.4s both}

        /* 🚨 SOS GRADIENT */
        .sos-gradient{background:linear-gradient(-45deg,#DC2626,#BE123C,#E11D48,#DC2626)!important;background-size:300% 300%!important;animation:gradientShift 5s ease infinite}

        /* 💡 TIPS GRADIENT */
        .tips-gradient{background:linear-gradient(-45deg,#059669,#10B981,#34D399,#059669)!important;background-size:300% 300%!important;animation:gradientShift 6s ease infinite}

        /* 📋 FOOTER */
        .anim-footer{animation:fadeIn 0.6s ease-out}
        .anim-footer a,.anim-footer span{transition:opacity 0.2s}
        .anim-footer span:hover{opacity:1!important}

        /* 🔵 GLOW CTA */
        .anim-glow{animation:glow 2.5s ease-in-out infinite}

        /* 🎭 VIEW TRANSITION */
        .anim-view{animation:fadeInUp 0.5s ease-out}

        /* 📱 SMOOTH SCROLL */
        html{scroll-behavior:smooth}

        /* 🎨 FOCUS RING */
        input:focus,textarea:focus,select:focus{border-color:#1E88E5!important;box-shadow:0 0 0 3px rgba(30,136,229,0.15)!important;transition:all 0.2s}

        /* 🔄 FILTER BUTTON TRANSITION */
        .anim-filter{transition:all 0.2s ease!important}
        .anim-filter:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.08)}
      `}</style>
    </div>
  );
}
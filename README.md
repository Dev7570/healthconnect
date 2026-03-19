# 🩺 HealthConnect — India's Healthcare Platform

> A full-stack healthcare web application for finding real hospitals, booking doctor appointments, comparing test prices, and accessing emergency services.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Credits](#-credits)

---

## ✨ Features

### 🏥 Hospital Search (Real Data)
- Search hospitals in **any Indian city** using real Google Places data
- View real ratings, reviews, phone numbers, and opening hours
- Interactive **Leaflet map** with markers and directions

### 👨‍⚕️ Doctor Booking
- Browse doctors by hospital with speciality filters
- **4-step booking flow**: Date/Time → Patient Details → Review → Payment
- Payment via **UPI, Credit Card, or Net Banking**
- SMS notification support (phone number capture)

### 👨‍⚕️ Doctor Profiles
- Detailed doctor profile pages with bio, qualifications, experience
- Available time slots and consultation fees
- Direct booking from profile page

### 🌙 Dark Mode
- Full dark theme toggle with smooth transitions
- Preference persisted in localStorage
- Consistent dark styling across all components

### 🧪 Test Price Comparison
- Compare prices of medical tests (CBC, MRI, ECG, X-Ray, etc.) across hospitals
- Color-coded cheapest/most expensive indicators

### 🚨 Emergency SOS
- One-tap calling for Ambulance (102), Police (100), Fire (101)
- Mental health helpline, child helpline, women helpline
- Quick access to nearest hospital via map

### 💡 Health Tips
- Curated health tips across categories: Prevention, Nutrition, Mental Health, Fitness, Sleep, Hydration
- Category-based filtering

### 🔐 User Authentication (Firebase)
- Email/password sign up and login
- Profile display in navbar
- Protected booking and appointment management

### 📋 Appointment Management
- View all booked appointments with status
- Cancel appointments
- Payment status tracking

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Leaflet.js, CSS-in-JS |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | Firebase Authentication |
| **APIs** | Google Places via RapidAPI |
| **Deployment** | Vercel (frontend), Render (backend) |

## 🏗 Architecture

```mermaid
graph TB
    subgraph Frontend ["🖥️ React Frontend (Vercel)"]
        A[App.js - SPA] --> B[Firebase Auth]
        A --> C[Leaflet Maps]
        A --> D[API Calls]
    end

    subgraph Backend ["⚙️ Express Backend (Render.com)"]
        E[server.js] --> F["/hospitals"]
        E --> G["/doctors"]
        E --> H["/appointments"]
        E --> I["/reviews"]
        E --> J["/payment"]
    end

    subgraph Database ["🗄️ MongoDB Atlas"]
        K[(Appointments)]
        L[(Reviews)]
        M[(Payments)]
    end

    subgraph External ["🌐 External APIs"]
        N[Google Places - RapidAPI]
        O[Firebase Auth]
    end

    D -->|REST API| E
    F -->|Search| N
    H --> K
    I --> L
    J --> M
    B --> O
```

---

## 📁 Project Structure

```
project 2/
├── healthconnect/                  # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                  # Main application (all views)
│   │   ├── App.css                 # Default styles
│   │   ├── firebase.js             # Firebase config
│   │   ├── index.js                # Entry point
│   │   └── index.css               # Global styles
│   ├── package.json
│   └── .env                        # Frontend env vars
│
├── healthconnect-backend/          # Node.js Backend
│   ├── models/
│   │   ├── Appointment.js          # Appointment schema
│   │   ├── Review.js               # Review schema
│   │   └── Payment.js              # Payment schema
│   ├── server.js                   # Express server + all routes
│   ├── package.json
│   └── .env                        # Backend env vars (API keys, MongoDB URI)
│
└── README.md                       # This file
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** (local install or MongoDB Atlas account)
- **RapidAPI Key** (for Google Places API)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/healthconnect.git
cd healthconnect
```

### 2. Setup Backend
```bash
cd healthconnect-backend
npm install
```

Create a `.env` file:
```env
GOOGLE_PLACES_API_KEY=your_rapidapi_key_here
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthconnect
```

> **MongoDB Atlas**: Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://username:password@cluster.mongodb.net/healthconnect`

Start the backend:
```bash
npm start
```

### 3. Setup Frontend
```bash
cd healthconnect
npm install
npm start
```

The app will open at `http://localhost:3000`.

---

## 📡 API Documentation

**Base URL**: `http://localhost:5000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check + DB status |
| `GET` | `/hospitals?city=Delhi` | Search real hospitals by city |
| `GET` | `/doctors?hospitalId=1` | Get doctors for a hospital |
| `GET` | `/doctors/:id` | Get single doctor profile |
| `POST` | `/appointments` | Book an appointment |
| `GET` | `/appointments/:email` | Get user's appointments |
| `DELETE` | `/appointments/:id` | Cancel an appointment |
| `POST` | `/reviews` | Submit a hospital review |
| `GET` | `/reviews/:hospitalId` | Get reviews for a hospital |
| `POST` | `/payment` | Process a payment |

### Example: Book an Appointment
```bash
curl -X POST http://localhost:5000/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "doctorName": "Dr. Priya Sharma",
    "doctorSpec": "Cardiology",
    "hospitalName": "AIIMS",
    "date": "Mon, 24 Mar",
    "time": "10:00 AM",
    "patientName": "John Doe",
    "patientEmail": "john@example.com",
    "patientPhone": "+919876543210",
    "fee": 800
  }'
```

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd healthconnect
npm run build
npx vercel --prod
```

### Backend → Render.com
1. Push `healthconnect-backend` to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: `GOOGLE_PLACES_API_KEY`, `MONGODB_URI`, `PORT=5000`

---

## 📸 Screenshots

> Add screenshots of your application here:
> - Home page with city search
> - Hospital detail with doctor cards
> - Booking flow and payment
> - Dark mode view
> - Doctor profile page
> - Emergency SOS page

---

## 👨‍💻 Credits

- **Developer**: Dev Gupta
- **APIs**: Google Places (via RapidAPI)
- **Auth**: Firebase Authentication
- **Maps**: OpenStreetMap + Leaflet.js
- **Icons**: Native emoji icons

---

## 📄 License

This project is built for educational purposes and is part of a college submission.

© 2026 HealthConnect. All rights reserved.

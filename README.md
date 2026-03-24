# 🩺 HealthConnect — Comprehensive Healthcare Platform

> A full-stack MERN healthcare web application for finding real hospitals, booking doctor appointments, comparing test prices, and accessing emergency services. Built as a comprehensive academic project submission.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)

---

## 🌐 Live Project Links

- **Live Web Application (Frontend)**: [https://healthconnect-snowy.vercel.app](https://healthconnect-snowy.vercel.app)
- **Backend API Server**: [https://healthconnect-backend-dev-7570-uniquehealthconnect-backend-api.onrender.com](https://healthconnect-backend-dev-7570-uniquehealthconnect-backend-api.onrender.com)

---

## 📋 Table of Contents

- [Core Features](#-core-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [API Documentation](#-api-documentation)
- [Deployment Strategy](#-deployment-strategy)
- [Credits](#-credits)

---

## ✨ Core Features

### 🏥 Hospital Search (Real-Time Data)
- Dynamically search hospitals in **any Indian city** utilizing the real Google Places API.
- View accurate ratings, reviews, international phone numbers, and operational hours.
- Interactive **Leaflet map** integration featuring geospatial markers and direct routing.

### 👨‍⚕️ Comprehensive Doctor Booking & Payments
- Browse specialist doctors associated with chosen hospitals.
- **Advanced 4-step booking flow**: Slot Selection → Patient Details (with 10-digit validation) → Review → Payment.
- **Dynamic Payment Status**: Appointments initially register as "Pending" (📅) and automatically upgrade to "Confirmed" (✅) upon successful simulated payment (UPI, Credit Card, or Net Banking).
- Automated SMS notification UI simulations.

### 👨‍⚕️ Doctor Profiles
- Detailed doctor profile pages with bio, qualifications, and years of experience.
- Real-time availability tracking and consultation fee transparency.
- Direct seamless booking directly from the profile page.

### 🌙 Dark Mode & Responsive UI
- Full dark theme toggle capability with persistent `localStorage` memory.
- Modern glassmorphism UI elements, smooth CSS transitions, and micro-animations.
- Fully responsive design optimized for mobile, tablet, and desktop viewports.

### 🧪 Test Price Comparison Engine
- Compare prices of critical diagnostic tests (CBC, MRI, ECG, X-Ray, etc.) across multiple hospitals simultaneously.
- Automated color-coded visual indicators for the cheapest and most expensive options to aid decision-making.

### 🚨 Emergency SOS & Health Tips
- **SOS Dashboard**: One-tap rapid calling for Ambulance (102), Police (100), Fire (101), and mental health helplines.
- **Health Tips Engine**: Curated health and wellness tips across categories like Prevention, Nutrition, Mental Health, Fitness, and Hydration.

### 🔐 Secure User Authentication
- Firebase-backed Email/Password authentication system.
- Protected routes for booking appointments and managing profiles.
- Persistent user sessions.

---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, HTML5, CSS3 | Single Page Application (SPA), UI rendering |
| **Backend** | Node.js, Express 5 | RESTful API creation, strict routing |
| **Database** | MongoDB & Mongoose | Persistent NoSQL data storage |
| **Auth** | Firebase Authentication | Secure user credential management |
| **Geospatial** | React-Leaflet & OpenStreetMap | Mapping and location plotting |
| **External APIs**| Google Places (RapidAPI) | Fetching real hospital data dynamically |
| **Deployment** | Vercel & Render.com | Cloud hosting and continuous integration |

---

## 🏗 System Architecture

```mermaid
graph TB
    subgraph Frontend ["🖥️ React Frontend (Vercel)"]
        A[App.js - SPA] --> B[Firebase Auth]
        A --> C[Leaflet Maps]
        A --> D[API Service Layer]
    end

    subgraph Backend ["⚙️ Node.js/Express Backend (Render)"]
        E[server.js] --> F["/hospitals (Google API Proxy)"]
        E --> G["/doctors"]
        E --> H["/appointments (Pending/Confirmed logic)"]
        E --> I["/reviews"]
        E --> J["/payment"]
    end

    subgraph Database ["🗄️ MongoDB Atlas"]
        K[(Appointments)]
        L[(Reviews)]
        M[(Payments)]
    end

    subgraph External ["🌐 External Cloud Services"]
        N[Google Places API]
        O[Firebase Auth]
    end

    D -->|REST Requests| E
    F -->|Geospatial Queries| N
    H --> K
    I --> L
    J --> M
    B --> O
```

---

## 📁 Project Structure

```text
project/
├── healthconnect/                  # 🖥️ React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                  # Main application routing and core logic
│   │   ├── App.css                 # Default specific styles
│   │   ├── firebase.js             # Firebase initialization config
│   │   ├── index.js                # React DOM entry point
│   │   └── index.css               # Global theme variables & Dark Mode styling
│   ├── package.json
│   ├── vercel.json                 # Vercel CI deployment overrides
│   └── .env                        # Frontend environment variables
│
├── healthconnect-backend/          # ⚙️ Node.js REST API
│   ├── models/
│   │   ├── Appointment.js          # Mongoose schema for Bookings
│   │   ├── Review.js               # Mongoose schema for User Reviews
│   │   └── Payment.js              # Mongoose schema for Transactions
│   ├── server.js                   # Express server + API Routes
│   ├── package.json
│   └── .env                        # Backend environment variables
│
└── README.md                       # Comprehensive Project Documentation
```

---

## 🚀 Setup & Installation (Local Development)

### Prerequisites
- **Node.js** v18.0 or higher
- **MongoDB** (Local instance or MongoDB Atlas URI)
- **RapidAPI Key** (For Google Places API access)

### 1. Clone the Repository
```bash
git clone https://github.com/Dev7570/healthconnect.git
cd healthconnect
```

### 2. Configure & Start Backend
```bash
cd healthconnect-backend
npm install
```

Create a `.env` file inside `healthconnect-backend`:
```env
GOOGLE_PLACES_API_KEY=your_rapidapi_key_here
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthconnect
```

Start the backend server:
```bash
npm run start
```
*The server will run on `http://localhost:5000`.*

### 3. Configure & Start Frontend
Open a new terminal window:
```bash
cd healthconnect
npm install
npm start
```
*The React app will launch automatically at `http://localhost:3000`.*

---

## 📡 API Documentation

**Base API URL**: `https://healthconnect-backend-dev-7570-uniquehealthconnect-backend-api.onrender.com`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API Health check & Database connection status |
| `GET` | `/hospitals?city=Delhi` | Query real Indian hospitals via Google Places proxy |
| `GET` | `/doctors?hospitalId=1` | Retrieve available doctors for a specific hospital |
| `GET` | `/doctors/:id` | Fetch an individual doctor's deep profile |
| `POST` | `/appointments` | Create a new booking (Defaults to `Pending` status) |
| `GET` | `/appointments/:email` | Retrieve all appointments for a specific user |
| `DELETE` | `/appointments/:id` | Cancel an existing appointment |
| `POST` | `/reviews` | Submit a hospital review and rating |
| `GET` | `/reviews/:hospitalId` | Fetch aggregated reviews and average ratings |
| `POST` | `/payment` | Process simulated payment & update Appointment to `Confirmed` |

---

## 🌐 Deployment Strategy

This project utilizes a modern decoupled deployment strategy for maximum performance and scalability:

1. **Frontend (Vercel)**: The React application is deployed to Vercel. It utilizes an overridden `vercel.json` to seamlessly compile the optimized static build and serve it globally via Vercel's Edge Network.
2. **Backend (Render)**: The Node.js/Express 5 API is hosted on Render.com as a Web Service. It connects directly to MongoDB Atlas and handles all cross-origin (CORS) requests securely from the Vercel domain.

---

## 👨‍💻 Credits & Attributes

- **Developer**: Dev Gupta
- **Co-Founder & Developer**: Aradhya Srivastava
- **APIs**: Google Places (via RapidAPI)
- **Auth**: Firebase Authentication by Google
- **Maps**: OpenStreetMap + React-Leaflet
- **License**: Built for educational purposes as an academic submission.

---
© 2026 HealthConnect. All rights reserved.

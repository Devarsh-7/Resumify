# 🎯 Resumify — AI Resume Analyzer

> **An AI-powered resume analyzer** that helps job seekers optimize their resumes for ATS (Applicant Tracking Systems) by comparing them against specific job descriptions using Google Gemini AI.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green?style=for-the-badge)
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## 📋 Overview

Resumify is a full-stack web application built as a college mini project. Users can upload their resume (PDF/DOCX), paste a job description, and receive:

- **ATS Compatibility Score** (0-100) with visual chart
- **Matched Skills** — skills from the JD found in your resume
- **Missing Skills** — skills you need to add
- **Actionable Suggestions** — tailored tips to improve your resume
- **Strengths** — what your resume does well

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Advanced Auth** | Secure Signup, Login, & 6-digit Email Verification (OTP) |
| 🌐 **Google OAuth** | One-click login and registration via Google Cloud |
| 📄 **Resume Upload** | High-speed processing of PDF and DOCX files |
| 🤖 **AI Analysis** | Deep-dive ATS scoring powered by Google Gemini 1.5 Flash |
| 📊 **Interactive UI** | Glassmorphic dark/light mode with real-time score visualization |
| 📜 **Analysis Vault** | Persistent history and text extraction for instant re-analysis |
| 📑 **PDF Reports** | Export professional analysis reports with charts and suggestions |
| 👤 **User Profiles** | Manage career defaults and GDPR-compliant account deletion |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — Dynamic UI components
- **Vite** — High-speed build and HMR environment
- **Tailwind CSS v4** — Utility-first styling with modern tokens
- **Chart.js** — ATS score and matching visualization
- **jsPDF & html2canvas** — Multi-page professional report generation
- **React Router v6** — Advanced client-side navigation
- **Axios** — Centralized API client with interceptors

### Backend
- **Node.js & Express.js** — RESTful API orchestration
- **MongoDB Atlas** — Document-oriented cloud storage
- **Google Gemini API** — GenAI engine for career coaching
- **Nodemailer** — Robust SMTP dispatch for verification codes
- **google-auth-library** — Secure GCP OAuth token validation
- **pdf-parse & mammoth** — Text extraction suite
- **JWT & bcryptjs** — Stateless identity and security

---

## 📁 Project Structure

```
Resumify/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # Auth context
│   │   ├── services/          # API service
│   │   ├── App.jsx            # Main app with routes
│   │   └── index.css          # Global styles
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── config/                # DB connection
│   ├── controllers/           # Route handlers
│   ├── middleware/             # JWT auth middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API route definitions
│   ├── utils/                 # Resume parser & AI analyzer
│   ├── server.js              # Entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher) — [Download](https://nodejs.org)
- **MongoDB Atlas** account — [Sign up free](https://www.mongodb.com/atlas)
- **Gemini API Key** — [Get free](https://aistudio.google.com/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/resumify.git
cd resumify
```

### 2. Setup Backend
```bash
cd server
npm install
```

Create a `.env` file in the `server/` folder:
```env
# Database & Auth
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173

# AI & Cloud
GEMINI_API_KEY=your-gemini-key
GOOGLE_CLIENT_ID=your-gcp-client-id

# Email (SMTP)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password

PORT=5000
```

Start the backend:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```

### 4. Open the App
Visit **http://localhost:5173** in your browser! 🎉

---

## 📸 Screenshots

> *Screenshots will be added after the app is running*

| Page | Preview |
|------|---------|
| Landing Page | _screenshot_ |
| Login/Signup | _screenshot_ |
| Dashboard | _screenshot_ |
| Analysis Results | _screenshot_ |

---

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Create account & send OTP | ❌ |
| POST | `/api/auth/verify-email` | Validate OTP & issue JWT | ❌ |
| POST | `/api/auth/google` | OAuth login/signup | ❌ |
| POST | `/api/auth/login` | Login existing user | ❌ |
| GET | `/api/auth/me` | Fetch active profile | ✅ |
| PUT | `/api/auth/profile` | Update info & career defaults | ✅ |
| DELETE | `/api/auth/account` | Permanent GDPR deletion | ✅ |
| POST | `/api/resume/analyze` | Process resume against JD | ✅ |
| GET | `/api/resume/history` | List all past analyses | ✅ |

---

## 🚢 Deployment

### Frontend → Vercel
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set root directory to `client`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
5. Deploy!

### Backend → Render
1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set root directory to `server`
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Add environment variables (MONGO_URI, JWT_SECRET, GEMINI_API_KEY, CLIENT_URL)
7. Deploy!

---

## 🔮 Future Improvements

- [ ] LinkedIn profile analysis
- [ ] Multiple resume comparison side-by-side
- [ ] AI-driven cover letter generator
- [ ] Interview question suggestions based on JD
- [ ] Resume template suggestions
- [ ] Custom scoring weights (Experience vs. Skills)

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Google Gemini AI** — For powering the resume analysis
- **MongoDB Atlas** — Free cloud database
- **Chart.js** — Beautiful chart visualizations

---

<p align="center">
  Built with ❤️ as a college mini project
</p>

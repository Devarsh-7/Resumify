# 🎯 Resumify — AI Resume Analyzer & Content Humanizer

> **An AI-powered resume personalization hub** that helps job seekers optimize their resumes for ATS (Applicant Tracking Systems) and humanize machine-like AI generated phrasing using Google Gemini 3.1 Flash Lite.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green?style=for-the-badge)
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%203.1-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## 📋 Overview

Resumify is a decoupled full-stack monorepo application. It bridges the "Insight Gap" in modern hiring by offering a transparent feedback loop for job seekers:

1. **ATS Compatibility Audits**: Upload resumes (PDF/DOCX) to receive a scored compatibility feedback report comparing the file against specific job descriptions.
2. **AI Content Humanizer**: Paste or import resume text to evaluate machine-likeness probability and perform side-by-side rewrites targeting natural, active, and professional phrasing.
3. **Resume Vault**: Secure cloud vault storing extracted text summaries for rapid re-analysis against multiple job listings without re-uploading files.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Advanced Auth** | Secure Signup, Login, & 6-digit Email Verification OTPs. |
| 🔄 **Account Recovery** | Secure password recovery with 6-digit OTP verification via SMTP. |
| 🌐 **Google OAuth** | One-click login and registration via Google Cloud, optimized with lazy-loaded providers. |
| 📄 **Asynchronous Parsing** | High-speed, non-blocking asynchronous PDF & DOCX text extraction. |
| 🤖 **AI ATS Auditing** | Scoring algorithms powered by Google Gemini 3.1 Flash Lite evaluating skills alignment, keyword matching, and structure. |
| ✍️ **AI Humanizer Workspace** | Synchronized side-by-side editor showing AI likeness, sentence burstiness, and interactive red/green highlights of robotic vs. humanized phrases. |
| 📜 **Analysis Vault** | Persistent history, caching, and text extraction for instant reuse. |
| 📑 **PDF Reports** | Export professional analysis reports with theme-aware background colors, utilizing on-demand dynamic package loading. |
| 👤 **User Profiles** | Manage career defaults and GDPR-compliant account deletion. |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — Dynamic UI component rendering
- **Vite 8** — High-speed build and dev server
- **Tailwind CSS v3** — Utility-first glassmorphic styling
- **React Router v7** — Lazy-loaded client-side navigation paths
- **Axios** — Centralized client with authorization header interceptors
- **jsPDF & html2canvas** — Theme-aware, dynamic import report generator

### Backend
- **Node.js & Express 5** — RESTful API orchestration
- **MongoDB Atlas + Mongoose 9** — Document storage with compound search indexes
- **Google Gemini 3.1 Flash Lite** — GenAI engine for resume scoring and text humanization
- **Nodemailer** — Robust SMTP dispatch for OTP verification and password reset codes
- **google-auth-library** — Secure GCP OAuth credential token validation
- **Compression** — Brotli/Gzip middleware for smaller payloads and lower page latency
- **Rate Limiters** — Multi-tier IP-based rate limiting safeguarding high-cost AI operations

---

## 📁 Project Structure

```
Resumify/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   └── stitch-ui/      # View pages (Dashboard, Humanizer, Profile, MyResumes, etc.)
│   │   ├── context/            # Auth state and context
│   │   ├── api/                # Axios configuration
│   │   ├── utils/              # Dynamic PDF report compiler
│   │   └── App.jsx             # Main app with lazy-loaded Suspense routing
│   ├── vercel.json             # Edge hosting routing and asset cache config
│   └── package.json
│
├── server/                     # Node.js Backend
│   ├── config/                 # DB connector
│   ├── controllers/            # Route controllers (Auth & Resume actions)
│   ├── middleware/             # JWT protect and upload middleware
│   ├── models/                 # Database schemas (User, Analysis, Resume Vault)
│   ├── routes/                 # API endpoint mappings
│   ├── utils/                  # Text extraction, Gemini, and Nodemailer configs
│   ├── server.js               # Express entry point
│   └── package.json
│
├── .gitignore                  # Version control ignores including Claude context files
└── README.md                   # This file
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
cd ../client
npm install
npm run dev
```

### 4. Open the App
Visit **http://localhost:5173** in your browser! 🎉


## 🚢 Deployment

### Frontend (Vercel)
1. Push code to GitHub.
2. Link repository to [Vercel](https://vercel.com).
3. Set root directory to `client`.
4. Configure Build Command: `npm run build` and Output Directory: `dist`.
5. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
6. Deploy!

### Backend (Render)
1. Go to [Render](https://render.com) and create a new Web Service.
2. Link your GitHub repository.
3. Set root directory to `server`.
4. Set Build Command to `npm install` and Start Command to `node server.js`.
5. Add environment variables (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL`).
6. Deploy!

---

## 🔮 Future Improvements

- [ ] LinkedIn profile importer
- [ ] AI-driven cover letter customizer matching target JD
- [ ] Real-time speech analyzer for interactive interview preparation
- [ ] Drag-and-drop resume design builder with pre-approved ATS layouts
- [ ] Collaborative editing options for recruiting reviews

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Google Gemini AI** — For powering the analysis and humanization rewrites
- **MongoDB Atlas** — Secure cloud database storage
- **Lucide React** — Elegant minimal vector icons
- **Vercel** — Static site edge hosting platform

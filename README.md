# HackUTD-Nexus - Compliance & Auditing Platform

## 🚀 Project Overview

An intelligent client/vendor onboarding platform that performs due diligence checks and compliance auditing using Google's Gemini AI.

### Key Features
- ✅ User authentication (clients, vendors, admins)
- ✅ Document upload and analysis
- ✅ AI-powered compliance checking with Gemini
- ✅ Automatic audit report generation
- ✅ Risk assessment and scoring
- ✅ Secure Firebase backend
- ✅ Role-based access control

---

## ⚡ Quick Start

### 1. Get Gemini API Key
Visit: **https://ai.google.dev/** and create a free API key

### 2. Setup Environment
```bash
cd my-react-app
echo "VITE_GEMINI_API_KEY=your-key-here" > .env.local
npm install
```

### 3. Run the App
```bash
npm run dev
```

### 4. Open in Browser
```
http://localhost:5173
```

---

## 📚 Documentation

### Start Here
- **`FINAL_STATUS.md`** - Current status and overview ⭐
- **`COMPLETE_SUMMARY.md`** - Complete summary
- **`QUICK_REFERENCE.md`** - One-page quick guide

### Setup & Configuration
- **`API_KEY_LOCATION.md`** - Where to put your Gemini API key
- **`GEMINI_QUICKSTART.md`** - 5-minute setup guide
- **`GEMINI_SETUP.md`** - Complete setup guide
- **`FIREBASE_SETUP.md`** - Firebase configuration

### Technical Documentation
- **`GEMINI_DATA_FLOW.md`** - System architecture and data flow
- **`README_GEMINI_INTEGRATION.md`** - Gemini integration details
- **`GEMINI_INTEGRATION_SUMMARY.md`** - Technical summary

### Testing & Deployment
- **`GEMINI_CHECKLIST.md`** - Pre-deployment checklist
- **`DOCUMENTATION_INDEX.md`** - Full documentation index

---

## 🔑 Critical: API Key Setup

### File Path
```
my-react-app/.env.local
```

### Content
```
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
```

### Get Your Key
1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Copy the generated key
4. Add to `.env.local` as shown above

### Important
- ⚠️ **NEVER** commit `.env.local` to Git
- ✅ Add to `.gitignore` immediately
- 🔑 Key should start with `AIzaSy...`

---

## 📁 Project Structure

```
HackUTD-Nexus/
├── my-react-app/                    # React frontend
│   ├── src/
│   │   ├── services/
│   │   │   ├── geminiService.ts      # Gemini AI integration
│   │   │   ├── complianceService.ts  # Compliance checking
│   │   │   ├── auditService.ts       # Audit reports
│   │   │   └── userService.ts        # User management
│   │   ├── dashboard.tsx             # Main dashboard
│   │   ├── App.tsx                   # App component
│   │   └── firebase.ts               # Firebase config
│   ├── .env.local                    # Environment variables (CREATE THIS)
│   ├── .env.local.example            # Template
│   ├── package.json
│   └── vite.config.ts
│
├── FINAL_STATUS.md                   # ⭐ READ THIS FIRST
├── COMPLETE_SUMMARY.md
├── API_KEY_LOCATION.md
├── GEMINI_SETUP.md
├── GEMINI_QUICKSTART.md
├── QUICK_REFERENCE.md
├── DOCUMENTATION_INDEX.md
└── ... (other documentation files)
```

---

## 🎯 Features

### User Management
- ✅ Sign up / Login
- ✅ Three account types: Client, Vendor, Admin
- ✅ Temporary and permanent storage
- ✅ Role-based access control

### Document Processing
- ✅ Multiple file upload
- ✅ Document categorization
- ✅ Temporary storage during review
- ✅ Permanent storage after approval

### Compliance Analysis
- ✅ AI-powered document analysis
- ✅ Risk level assessment (low/medium/high/critical)
- ✅ Compliance scoring (0-100)
- ✅ Finding and issue identification

### Audit Reports
- ✅ Automated report generation
- ✅ Executive summaries
- ✅ Key findings list
- ✅ Required actions
- ✅ Implementation timeline

### Security
- ✅ Firebase Authentication
- ✅ Firestore Database
- ✅ Cloud Storage
- ✅ Security rules enforced

---

## 🛠️ Tech Stack

### Frontend
- React 19.1
- TypeScript 5.9
- Vite 7.1
- React DOM 19.1

### Backend/Services
- Firebase Auth
- Firestore Database
- Firebase Cloud Storage
- Google Generative AI (Gemini)

### Development
- ESLint
- TypeScript Compiler
- Vite Dev Server

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Gemini API key (free)
- Google account for Firebase

### Installation

```bash
# Navigate to app directory
cd my-react-app

# Install dependencies
npm install

# Create environment file
echo "VITE_GEMINI_API_KEY=your-key-here" > .env.local

# Start development server
npm run dev
```

### Running Tests
```bash
npm run build  # Build for production
npm run lint   # Run linter
```

---

## 📖 Usage Guide

### For New Users
1. Read **FINAL_STATUS.md**
2. Follow **GEMINI_QUICKSTART.md**
3. Create account at http://localhost:5173
4. Upload test documents
5. Review generated audit report

### For Developers
1. Review **GEMINI_DATA_FLOW.md**
2. Study `src/services/geminiService.ts`
3. Examine `complianceService.ts` integration
4. Check `auditService.ts` implementation

### For DevOps/Deployment
1. Follow **GEMINI_CHECKLIST.md**
2. Review **FIREBASE_SETUP.md**
3. Configure production environment
4. Test all scenarios

---

## 🔄 Workflow

```
1. User Signs Up
   ↓
2. Creates Account (Temporary Storage)
   ↓
3. Uploads Documents
   ↓
4. System Analyzes with Gemini
   ↓
5. Generates Compliance Report
   ↓
6. Shows Results to User
   ├─ If PASS: Account activated ✅
   └─ If FAIL: Show required actions ⚠️
```

---

## 🐛 Troubleshooting

### Issue: "Gemini API key not found"
**Solution:** Create `.env.local` with `VITE_GEMINI_API_KEY=your-key`

### Issue: "Invalid API key"
**Solution:** Get new key from https://ai.google.dev/

### Issue: "Cannot connect to Firebase"
**Solution:** Check Firebase configuration in `src/firebase.ts`

### Issue: "Permission denied" error
**Solution:** Update Firestore security rules

See **GEMINI_SETUP.md** for detailed troubleshooting.

---

## 📞 Support & Resources

### Documentation
- All documentation files in project root
- See **DOCUMENTATION_INDEX.md** for navigation
- Start with **FINAL_STATUS.md** ⭐

### External Resources
- Gemini API: https://ai.google.dev/
- Firebase: https://firebase.google.com/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/

### Debugging
1. Open browser console (F12)
2. Check terminal output
3. Review error messages
4. See relevant documentation file

---

## ✅ Implementation Status

| Component | Status |
|-----------|--------|
| Firebase Setup | ✅ Complete |
| User Authentication | ✅ Complete |
| Document Upload | ✅ Complete |
| Gemini Integration | ✅ Complete |
| Compliance Analysis | ✅ Complete |
| Audit Report Generation | ✅ Complete |
| Error Handling | ✅ Complete |
| Documentation | ✅ Complete |
| Testing | ✅ Ready |
| Production Ready | ✅ Yes |

---

## 📝 Latest Updates

**November 9, 2025**
- ✅ Gemini AI integration complete
- ✅ Compliance analysis working
- ✅ Audit report generation working
- ✅ Complete documentation provided
- ✅ Ready for production deployment

---

## 🎯 Next Steps

### Immediate
1. Get Gemini API key
2. Add to `.env.local`
3. Run `npm install && npm run dev`
4. Test the system

### Short Term
- Customize compliance rules
- Add email notifications
- Create admin dashboard
- Deploy to production

### Long Term
- Add PDF support
- Advanced analytics
- Custom compliance rules
- Multi-language support

---

## 📄 License

This project is part of HackUTD Nexus hackathon.

---

## 👥 Contributors

- Backend Development with Gemini AI Integration
- Compliance & Auditing System
- Documentation & Testing

---

## 🎉 Ready to Launch!

Everything is set up and ready. Just add your Gemini API key and start using the platform!

**Quick Start:** `FINAL_STATUS.md` → `GEMINI_QUICKSTART.md` → Start Testing!

---

**Last Updated:** November 9, 2025  
**Status:** ✅ Production Ready  
**Version:** 1.0
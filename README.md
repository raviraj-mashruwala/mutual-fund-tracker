# Mutual Fund Tracker (Firebase + React)

A modern, authenticated web app to track mutual fund investments. It stores your data in Firebase Firestore, fetches daily NAVs from AMFI via Firebase Cloud Functions, and provides analytics, charts, and LTCG insights.

---

## ✨ Features

- **Authentication**: Email/password signup, login, logout, password reset (Firebase Auth)
- **Protected routes**: App pages guarded by `PrivateRoute` using `AuthContext`
- **Investments CRUD**: Add, edit, delete investments scoped to the logged-in user
- **AMFI NAV integration**:
  - Cloud Function `manualUpdateNAV` hits AMFI (`NAVAll.txt`) and updates Firestore
  - Scheduled update on weekdays at 23:50 IST (`Asia/Kolkata`)
  - Latest NAV saved to `navData`, daily history saved to `navHistory`
- **Analytics dashboard**: Portfolio overview, top performers, LTCG opportunities, allocation and trend charts (Recharts)
- **Dual views**: Individual investments and grouped by fund with aggregated metrics
- **Theme toggle**: Light/dark theme via `ThemeContext`
- **Responsive UI**: Optimized layout for desktop and mobile

---

## 🧱 Tech Stack

- **Frontend**: React 18, React Router, Recharts, react-scripts
- **Backend**: Firebase Cloud Functions (Node.js 20)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Hosting/Deploy**: GitHub Pages for frontend (via `gh-pages`) + Firebase for Cloud Functions

---

## 📁 Project Structure

```
mutual-fund-tracker/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Dashboard.js
│   │   ├── Analytics.js
│   │   ├── InvestmentForm.js
│   │   ├── InvestmentTable.js
│   │   ├── GroupedInvestmentView.js
│   │   ├── ThemeToggle.js
│   │   ├── Login.js / Signup.js / ForgotPassword.js
│   │   └── PrivateRoute.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── utils/
│   │   ├── calculations.js
│   │   ├── dateFormatter.js
│   │   ├── firebaseService.js
│   │   ├── navHistoryService.js
│   │   └── navService.js
│   ├── firebase.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── functions/
│   ├── index.js           # Cloud Functions: AMFI NAV fetch + schedule
│   └── package.json
├── firebase.json          # Functions codebase config
├── package.json           # Frontend scripts and deps
├── README.md
└── SETUP_GUIDE.md
```

---

## 🔐 Data Model (Firestore)

- **investments**
  - Per-document fields (subset): `userId`, `fundName`, `schemeCode`, `buyDate`, `quantity`, `buyNAV`, `buyTotalAmount`, `currentNAV`, `currentNAVDate`, timestamps
  - Scoped by `userId` so each user only sees their data
- **navData**
  - Document ID: `schemeCode`
  - Fields: `schemeCode`, `schemeName`, `currentNAV`, `navDate`, `lastUpdated`
- **navHistory**
  - Document ID: `${schemeCode}_${YYYY-MM-DD}`
  - Fields: `schemeCode`, `schemeName`, `nav`, `date`, `createdAt`, `year`, `month`, `yearMonth`

---

## ⚙️ Configuration

Update `src/firebase.js` with your Firebase project credentials (from Firebase Console → Project Settings → Web app).

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

Tip: For production, prefer environment variables and do not commit secrets.

---

## 📦 Installation

```bash
# From repository root
npm install
```

Useful scripts from `package.json`:

- `npm start` – run React dev server
- `npm run build` – production build
- `npm run deploy` – deploy build to GitHub Pages (requires `homepage` set and repo configured)

---

## 🏃 Run Locally

```bash
npm start
# open http://localhost:3000
```

Login or create an account, then add investments. If you add with a valid `schemeCode`, the app will try to fetch the latest NAV (via Cloud Function) and store `navData` and `navHistory` entries.

---

## ☁️ Cloud Functions (AMFI NAV)

Location: `functions/index.js`

- **manualUpdateNAV (HTTPS)**
  - URL pattern (after deploy): `https://<REGION>-<PROJECT>.cloudfunctions.net/manualUpdateNAV`
  - Fetches AMFI `NAVAll.txt`, parses report date, updates all matching investments with `currentNAV` and `currentNAVDate`
  - Writes latest NAV to `navData` and appends to `navHistory`
- **scheduledNavUpdate (Scheduled Pub/Sub)**
  - Cron: `50 23 * * 1-5` in `Asia/Kolkata`
  - Updates existing investments and persists NAV + history

Frontend utility `src/utils/navService.js` calls `manualUpdateNAV` and reads `navData` when adding new investments or when refreshing NAVs.

### Deploying Functions

Prereqs: Firebase CLI and a Firebase project selected (or use `--project ...`).

```bash
npm i -g firebase-tools
firebase login
# from repo root
firebase deploy --only functions
```

Note: This repo’s `firebase.json` defines only the Functions codebase. Frontend is intended for GitHub Pages via `gh-pages`.

---

## 🔒 Security Rules (suggested)

Start in test mode for development. Before production, lock down rules so only the authenticated user can access their own docs.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /investments/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /navData/{docId} {
      allow read: if true;           // public read OK
      allow write: if request.auth != null; // written by functions/app
    }
    match /navHistory/{docId} {
      allow read: if true;           // public read OK
      allow write: if request.auth != null; // written by functions/app
    }
  }
}
```

---

## 📊 Calculations & Analytics

Computed per investment and portfolio:

- Net P/L and P/L%
- Holding period and LTCG eligibility (≥ 365 days)
- CAGR
- Fund allocation and top performers
- Approximate portfolio value over time

Implemented in `src/utils/calculations.js` and visualized in `src/components/Analytics.js` using Recharts.

---

## 🚀 Deployment (Frontend)

This project ships with `gh-pages` for static hosting:

1. Set `homepage` in `package.json` to your GitHub Pages URL, e.g. `https://<user>.github.io/<repo>`

2. Build and deploy:

```bash
npm run deploy
```

Alternatively, deploy the build output (`build/`) to any static host (Netlify, Vercel, Firebase Hosting, etc.). If you use Firebase Hosting, add hosting config to `firebase.json`.

---

## 🧪 Troubleshooting

- Failed to fetch investments: verify Firebase config and that Firestore is enabled
- NAV not updating: ensure Functions are deployed; check function logs
- Auth redirect loop: ensure you’re logged in; inspect `AuthContext` consumer
- Local time/date parsing: app normalizes AMFI dates to `YYYY-MM-DD`

Function logs (locally or after deploy):

```bash
# from functions/ if using emulators
npm run serve
# tail logs after deploy
firebase functions:log
```

---

## 📚 Additional Docs

- See `SETUP_GUIDE.md` for a step-by-step setup walkthrough
- Key source files: `src/firebase.js`, `src/contexts/AuthContext.js`, `functions/index.js`

---

## 📄 License

Open source. Use freely for personal and commercial projects.

# Mutual Fund Portfolio Tracker with Firebase

A modern, interactive web application for tracking mutual fund portfolios with Firebase database integration.

## 🚀 Features

- ✅ Add, edit, and delete investment entries
- 📊 Real-time calculation of metrics (P&L, CAGR, LTCG eligibility)
- 👥 Dual view modes: Individual entries and Grouped by fund
- 📈 Dashboard with portfolio analytics
- 🔥 Firebase Firestore for permanent data storage
- 📱 Fully responsive design

---

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v14 or higher) installed on your machine
   - Download from: https://nodejs.org/

2. **A Firebase account and project**
   - Go to: https://console.firebase.google.com/
   - Create a new project (or use existing one)

---

## 🔧 Setup Instructions

### Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click on the **Settings icon** (⚙️) → **Project settings**
4. Scroll down to **"Your apps"** section
5. Click on the **Web icon** (`</>`) to add a web app
6. Register your app with a nickname (e.g., "Mutual Fund Tracker")
7. Copy the `firebaseConfig` object - you'll need these values:
   ```javascript
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   }
   ```

### Step 2: Enable Firestore Database

1. In Firebase Console, go to **"Firestore Database"** from the left menu
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location closest to you
5. Click **"Enable"**

⚠️ **Important**: Test mode allows anyone to read/write. Before deploying to production, configure proper security rules!

---

## 💻 Installation Steps

### 1. Extract and Open the Project

Extract the `mutual-fund-tracker-firebase.zip` file to your desired location, then:

```bash
cd mutual-fund-tracker-firebase
```

### 2. Install Dependencies

```bash
npm install
```

This will install React, Firebase, and all other required packages.

---

## ⚙️ Configuration

### **IMPORTANT: Add Your Firebase Credentials**

Open the file: **`src/firebase.js`**

Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",              // ← Replace this
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",  // ← Replace this
  projectId: "YOUR_PROJECT_ID",             // ← Replace this
  storageBucket: "YOUR_PROJECT_ID.appspot.com",   // ← Replace this
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // ← Replace this
  appId: "YOUR_APP_ID"                      // ← Replace this
};
```

**This is the ONLY file you need to modify!**

---

## 🏃 Running the Application

After adding your Firebase configuration, start the development server:

```bash
npm start
```

The application will automatically open in your browser at:
```
http://localhost:3000
```

If it doesn't open automatically, manually navigate to that URL.

---

## 📱 Using the Application

### Dashboard Tab
- View portfolio summary metrics
- See fund allocation and performance
- View top performing funds (in grouped mode)

### Manage Investments Tab
- **Add Investment**: Click "Add New Investment" button
- **Edit Investment**: Click "Edit" button on any entry
- **Delete Investment**: Click "Delete" button (with confirmation)
- **Switch Views**: Toggle between "Individual" and "Grouped by Fund" views

### View Modes
1. **Individual View**: All investments in a flat table
2. **Grouped View**: Investments organized by fund with aggregated metrics

---

## 📊 Calculated Metrics

The application automatically calculates:

1. **Net Profit/Loss**: Total gain or loss from investment
2. **Net Profit/Loss %**: Percentage return on investment
3. **Holding Period**: Number of days held
4. **LTCG Eligibility**: Yes if held ≥ 365 days (India)
5. **CAGR**: Compound Annual Growth Rate
6. **Current NAV**: Simulated (replace with actual API in production)
7. **Decision to Sell**: Recommendation based on LTCG and performance

---

## 🗂️ Project Structure

```
mutual-fund-tracker-firebase/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Dashboard.js          # Portfolio dashboard
│   │   ├── InvestmentForm.js     # Add/Edit form
│   │   ├── InvestmentTable.js    # Individual view table
│   │   └── GroupedInvestmentView.js  # Grouped view
│   ├── utils/
│   │   ├── calculations.js       # All metric calculations
│   │   └── firebaseService.js    # Firebase CRUD operations
│   ├── firebase.js               # ⚠️ CONFIGURE THIS FILE
│   ├── App.js                    # Main app component
│   ├── index.js                  # React entry point
│   └── index.css                 # Global styles
├── package.json
├── .gitignore
└── README.md
```

---

## 🔒 Security Considerations

### For Production:

1. **Update Firestore Security Rules**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /investments/{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Add Firebase Authentication**:
   - Enable authentication in Firebase Console
   - Implement user login/signup
   - Restrict data access per user

3. **Environment Variables**:
   - Store Firebase config in `.env` file
   - Never commit sensitive data to Git

---

## 🐛 Troubleshooting

### "Failed to load investments" error
- ✅ Check that you've replaced ALL placeholder values in `src/firebase.js`
- ✅ Verify Firestore database is created and enabled
- ✅ Check browser console for detailed error messages

### Application won't start
- ✅ Run `npm install` again
- ✅ Delete `node_modules` folder and `package-lock.json`, then run `npm install`
- ✅ Ensure Node.js version is 14+

### Data not persisting
- ✅ Check Firestore security rules (should be in test mode for development)
- ✅ Verify your Firebase project is active

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

This creates a `build/` folder with optimized files ready for deployment.

---

## 🚀 Deployment Options

- **Firebase Hosting**: `firebase init hosting` and `firebase deploy`
- **Netlify**: Drag and drop the `build/` folder
- **Vercel**: Connect your Git repository

---

## 📝 Next Steps

1. ✅ Replace simulated NAV with actual API integration
2. ✅ Add Firebase Authentication for user-specific data
3. ✅ Implement advanced charts (using Chart.js or Recharts)
4. ✅ Add export functionality (PDF/Excel reports)
5. ✅ Set up SIP (Systematic Investment Plan) tracking

---

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Ensure Firestore database is properly set up
4. Review Firestore security rules

---

## 📄 License

This project is open source and available for personal and commercial use.

---

**Happy Investing! 💰📈**

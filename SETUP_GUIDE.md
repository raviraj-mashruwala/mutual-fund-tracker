# 🎯 Quick Setup Guide

Follow these exact steps to get your Mutual Fund Portfolio Tracker running with Firebase.

---

## ⏱️ Estimated Time: 10 minutes

---

## Step 1: Install Node.js (if not already installed)

1. Go to https://nodejs.org/
2. Download and install the **LTS version** (recommended)
3. Verify installation by opening a terminal/command prompt and typing:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers.

---

## Step 2: Set Up Firebase Project

### 2.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** or select an existing project
3. Enter project name (e.g., "my-mutual-fund-tracker")
4. Disable Google Analytics (optional, not needed for this app)
5. Click **"Create project"**
6. Wait for project to be created, then click **"Continue"**

### 2.2 Get Firebase Configuration

1. In your Firebase project, click the **Settings icon (⚙️)** → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **Web icon (`</>`)**
4. Enter app nickname: "Mutual Fund Tracker"
5. **DO NOT** check "Firebase Hosting" (not needed)
6. Click **"Register app"**
7. **COPY** the `firebaseConfig` object that appears - you'll need this!

   It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

8. Click **"Continue to console"**

### 2.3 Enable Firestore Database

1. From the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (important for now!)
4. Click **"Next"**
5. Choose a location closest to you
6. Click **"Enable"**
7. Wait for database to be created

✅ Firebase setup complete!

---

## Step 3: Download and Extract the Application

1. Download the `mutual-fund-tracker-firebase.zip` file
2. Extract it to a folder of your choice (e.g., `Documents/Projects/`)
3. Remember the location!

---

## Step 4: Configure Firebase in Your App

### 4.1 Open the Project in VS Code

1. Open **Visual Studio Code**
2. Go to **File → Open Folder**
3. Navigate to and select the `mutual-fund-tracker-firebase` folder
4. Click **"Select Folder"** or **"Open"**

### 4.2 Edit Firebase Configuration

1. In VS Code's file explorer (left sidebar), navigate to:
   ```
   src → firebase.js
   ```

2. Click to open `firebase.js`

3. Find this section (around line 8-16):
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY_HERE",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **REPLACE** each placeholder with the values from Step 2.2

   Example:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "my-fund-tracker.firebaseapp.com",
     projectId: "my-fund-tracker",
     storageBucket: "my-fund-tracker.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

5. Save the file (**Ctrl+S** or **Cmd+S**)

---

## Step 5: Install Dependencies and Run

### 5.1 Open Terminal in VS Code

1. In VS Code, go to **Terminal → New Terminal** (or press **Ctrl+`**)
2. You should see a terminal at the bottom of VS Code

### 5.2 Install Required Packages

In the terminal, type:
```bash
npm install
```

Press **Enter** and wait. This will:
- Download all required packages (React, Firebase, etc.)
- Take 1-3 minutes depending on your internet speed
- Show a progress bar

### 5.3 Start the Application

After installation completes, type:
```bash
npm start
```

Press **Enter**.

The application will:
- Compile and start
- Automatically open in your default browser at `http://localhost:3000`
- Show "Compiling..." in the terminal

**If browser doesn't open automatically**: Manually go to http://localhost:3000

---

## Step 6: Verify Everything Works

### 6.1 Check for Errors

- The app should load without errors
- You should see the header: "💰 Mutual Fund Portfolio Tracker"
- Dashboard should show "0 Total Investments"

### 6.2 Add a Test Investment

1. Click the **"Manage Investments"** tab
2. Click **"➕ Add New Investment"**
3. Fill in the form:
   - Fund Name: "Test Fund"
   - Buy Date: Any date
   - Buy NAV: 100
   - Quantity: 10
   - Buy Total Amount: 1000
4. Click **"Add Investment"**
5. You should see an alert: "Investment added successfully!"

### 6.3 Verify Data in Firebase

1. Go back to Firebase Console
2. Click **"Firestore Database"** in the left menu
3. You should see a collection named **"investments"**
4. Click on it to see your test investment data

✅ **Success!** Your app is working and connected to Firebase!

---

## 🎉 You're Done!

Your application is now:
- ✅ Running locally
- ✅ Connected to Firebase
- ✅ Saving data permanently
- ✅ Ready to track your investments

---

## 🔄 Starting the App Later

Whenever you want to use the app again:

1. Open VS Code
2. Open the project folder
3. Open terminal (**Ctrl+`**)
4. Run: `npm start`
5. App opens at `http://localhost:3000`

---

## 🛑 Stopping the App

To stop the development server:
- In the VS Code terminal, press **Ctrl+C**
- Type `y` if asked to confirm
- Close the browser tab

---

## ⚠️ Common Issues

### Issue: "Failed to load investments"
**Solution**: 
- Double-check your Firebase config in `src/firebase.js`
- Ensure Firestore is enabled in Firebase Console
- Check Firestore is in "test mode"

### Issue: "npm command not found"
**Solution**: 
- Node.js not installed or not in PATH
- Restart VS Code after installing Node.js
- Reinstall Node.js from https://nodejs.org/

### Issue: Port 3000 already in use
**Solution**: 
- Another app is using port 3000
- Close other React apps
- Or the app will prompt to use port 3001 instead

---

## 📞 Need Help?

Check:
1. Browser console (F12 → Console tab) for errors
2. VS Code terminal for error messages
3. README.md for detailed documentation

---

**Happy tracking! 💰📈**

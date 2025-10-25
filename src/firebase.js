// src/firebase.js
// Firebase configuration and initialization

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ========================================
// TODO: REPLACE WITH YOUR FIREBASE CONFIG
// ========================================
// Get these values from Firebase Console > Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7oLdpsfhgreCL_2W8MEK2v8k9Q5zLrjE",
  authDomain: "mutual-fund-tracker-d93c4.firebaseapp.com",
  projectId: "mutual-fund-tracker-d93c4",
  storageBucket: "mutual-fund-tracker-d93c4.firebasestorage.app",
  messagingSenderId: "73567998993",
  appId: "1:73567998993:web:72ea08f1de8e238eb00db0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

export { db };

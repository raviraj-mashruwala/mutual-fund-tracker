// src/index.js - WITH AUTHENTICATION ROUTING
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Route - Dashboard */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <App />
                </PrivateRoute>
              }
            />

            {/* Redirect root to dashboard (or login if not authenticated) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 - Redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

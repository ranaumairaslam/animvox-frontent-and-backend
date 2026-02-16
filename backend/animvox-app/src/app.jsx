import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Voiceover from "./pages/Voiceover.jsx";
import Static from "./pages/Static.jsx";
import Animated from "./pages/Animated.jsx";
import Profile from "./pages/Profile.jsx";   // ✅ ADD THIS

export default function App() {
  return (
    <Routes>
      {/* Dashboard is the default home page */}
      <Route path="/" element={<Dashboard />} />

      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Profile page */}
      <Route path="/profile" element={<Profile />} />   {/* ✅ ADD THIS */}

      {/* Tool routes */}
      <Route path="/voiceover" element={<Voiceover />} />
      <Route path="/static" element={<Static />} />
      <Route path="/animated" element={<Animated />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

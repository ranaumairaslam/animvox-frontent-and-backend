import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AdminLogin from "./Adminlogin";
import AdminDashboard from "./Admindashboard"; // main dashboard
import Users from "./Users";
import Plans from "./Plans";
import Usage from "./Usage";

// Wrapper component to ensure nested routes work properly
function DashboardLayout() {
  return <Outlet />; // renders the nested route components inside AdminDashboard
}

export default function AdminApp() {
  return (
    <Routes>
      {/* Default route redirects to login */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Admin Panel with nested routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />}>
        <Route index element={<Users />} /> {/* default nested tab */}
        <Route path="users" element={<Users />} />
        <Route path="plans" element={<Plans />} />
        <Route path="usage" element={<Usage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

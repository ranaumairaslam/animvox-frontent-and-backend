import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import Dashboard from "./Dashboard";
import Users from "./Users";
import Plans from "./Plans";
import Usage from "./Usage";

export default function AdminApp() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/plans" element={<Plans />} />
        <Route path="/admin/usage" element={<Usage />} />
        <Route path="*" element={<div>Admin Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

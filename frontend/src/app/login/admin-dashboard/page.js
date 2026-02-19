// src/app/login/admin-dashboard/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Users, Package, BarChart3, Settings, Activity, Film, Download } from "lucide-react";
import API from "@/lib/api";

const ease = [0.77, 0, 0.18, 1];

// ================== Admin App ==================
export default function AdminApp() {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  // Auth guard - only admin should access this
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("role");
    } catch {}
    router.push("/login");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={20} /> },
    { id: "users", label: "Users", icon: <Users size={20} /> },
    { id: "plans", label: "Plans", icon: <Package size={20} /> },
    { id: "usage", label: "Usage", icon: <Activity size={20} /> },
    { id: "videos", label: "Videos", icon: <Film size={20} /> },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans">
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full opacity-60"
      />
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full opacity-60"
      />

      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-6 border-b border-white/10 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease }}
          className="flex items-center gap-3"
        >
          <Settings size={28} className="text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              ADMIN PANEL
            </h1>
            <p className="text-xs text-purple-300/60 mt-1">AnimVox Management System</p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05, borderColor: "#EC4899", backgroundColor: "rgba(236, 72, 153, 0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-pink-400/40 bg-pink-500/10 text-pink-300 hover:text-pink-200 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </nav>

      <div className="relative z-10 px-8 md:px-16 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="flex gap-4 mb-8 flex-wrap"
        >
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: index * 0.1 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 border ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400/50 text-white shadow-lg shadow-purple-500/30"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          key={activeTab}
        >
          {activeTab === "overview" && <Overview />}
          {activeTab === "users" && <UsersComponent />}
          {activeTab === "plans" && <Plans />}
          {activeTab === "usage" && <Usage />}
          {activeTab === "videos" && <VideosList />}
        </motion.div>
      </div>
    </div>
  );
}

// ================== Overview Component ==================
function Overview() {
  const [stats, setStats] = useState({ totalUsers: 0, totalVideos: 0, activePlans: 0 });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real backend se data fetch karo
    Promise.all([
      API.adminFetchUsers().catch(() => ({ data: [] })),
      API.adminFetchVideos().catch(() => ({ data: [] })),
      API.adminFetchPlans().catch(() => ({ data: [] })),
      API.adminSystemHealth().catch(() => ({ data: null })),
    ]).then(([usersRes, videosRes, plansRes, healthRes]) => {
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const videos = Array.isArray(videosRes.data) ? videosRes.data : [];
      const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
      setStats({
        totalUsers: users.length,
        totalVideos: videos.length,
        activePlans: plans.length,
      });
      setHealth(healthRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", gradient: "from-blue-600 to-cyan-600" },
    { label: "Total Videos", value: stats.totalVideos, icon: "🎬", gradient: "from-purple-600 to-pink-600" },
    { label: "Active Plans", value: stats.activePlans, icon: "📦", gradient: "from-emerald-600 to-teal-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: i * 0.1 }}
            whileHover={{ y: -10, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
            className={`relative rounded-2xl overflow-hidden border border-white/10 p-8 backdrop-blur-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}
          >
            <div className="relative z-10">
              <span className="text-4xl">{stat.icon}</span>
              <p className="text-white/60 text-sm font-medium mb-2 mt-4">{stat.label}</p>
              <p className="text-4xl font-bold text-white">
                {loading ? <span className="animate-pulse text-2xl">Loading...</span> : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Health Card */}
      {health && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 p-6 backdrop-blur-xl bg-white/5"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-purple-400" /> System Health
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 mb-1">CPU</p>
              <p className="text-2xl font-bold text-purple-400">{health.cpu_percent}%</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 mb-1">Memory Used</p>
              <p className="text-2xl font-bold text-blue-400">{health.memory_used_mb} MB</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 mb-1">Disk Free</p>
              <p className="text-2xl font-bold text-emerald-400">{health.disk_free_gb} GB</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 mb-1">Queue Size</p>
              <p className="text-2xl font-bold text-pink-400">{health.queue_size}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ================== Users Component ==================
function UsersComponent() {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkPlan, setBulkPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Real backend se users aur plans fetch karo
    Promise.all([
      API.adminFetchUsers(),
      API.adminFetchPlans().catch(() => ({ data: [] })),
    ])
      .then(([usersRes, plansRes]) => {
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Users load nahi ho sake. Backend check karo.");
        setLoading(false);
      });
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      (u.email?.toLowerCase().includes(search) ||
        u.name?.toLowerCase().includes(search) ||
        u.mobile?.toLowerCase().includes(search)) &&
      (filterPlan ? u.plan === filterPlan : true)
    );
  });

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Real API: Plan change karo
  const changePlan = async (userId, plan) => {
    try {
      await API.adminUpdateUser(userId, { plan });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan } : u));
      showSuccess("Plan update ho gaya!");
    } catch {
      setError("Plan update failed.");
    }
  };

  // Real API: Suspend/Activate toggle
  const toggleSuspend = async (userId, currentStatus) => {
    try {
      await API.adminUpdateUser(userId, { suspend: !currentStatus });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, suspend: !currentStatus } : u));
      showSuccess("User status update ho gaya!");
    } catch {
      setError("Status update failed.");
    }
  };

  // Real API: Password reset
  const resetPassword = async (userId) => {
    try {
      const res = await API.adminResetPassword(userId);
      const tempPass = res.data.temp_password;
      alert(`New temporary password: ${tempPass}\n\nUser ko yeh password bata do!`);
      showSuccess("Password reset ho gaya!");
    } catch {
      setError("Password reset failed.");
    }
  };

  // Real API: Bulk plan update
  const handleBulkUpdate = async () => {
    if (!selectedUsers.length || !bulkPlan) return;
    try {
      await API.adminBulkUpdatePlan({ user_ids: selectedUsers, plan: bulkPlan });
      setUsers((prev) => prev.map((u) => selectedUsers.includes(u.id) ? { ...u, plan: bulkPlan } : u));
      setSelectedUsers([]);
      showSuccess(`${selectedUsers.length} users ka plan update ho gaya!`);
    } catch {
      setError("Bulk update failed.");
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    try {
      const res = await API.adminExportUsersCsv();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users_export.csv";
      a.click();
    } catch {
      setError("CSV export failed.");
    }
  };

  if (loading) return <div className="text-white/60 text-center py-12">Users load ho rahe hain...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-400/30 text-green-300 text-sm">
          ✅ {successMsg}
        </div>
      )}

      {/* Search, Filter, Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 flex-col md:flex-row flex-wrap"
      >
        <input
          type="text"
          placeholder="Name, email ya mobile se search karo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        >
          <option value="">All Plans</option>
          {plans.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 transition-all font-semibold"
        >
          <Download size={18} /> Export CSV
        </button>
      </motion.div>

      {/* Bulk Update Bar */}
      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 items-center p-4 rounded-xl bg-purple-500/10 border border-purple-400/30"
        >
          <span className="text-purple-300 font-semibold">{selectedUsers.length} users selected</span>
          <select
            value={bulkPlan}
            onChange={(e) => setBulkPlan(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
          >
            <option value="">Plan chuno</option>
            {plans.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <button
            onClick={handleBulkUpdate}
            disabled={!bulkPlan}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 disabled:opacity-50 transition-all"
          >
            Bulk Update
          </button>
        </motion.div>
      )}

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-white/5 to-white/0 border-b border-white/10">
                {["Select", "Name", "Email", "Mobile", "Plan", "Role", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-white/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-white/40">
                    Koi user nahi mila
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => handleSelectUser(u.id)}
                        className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{u.name || "-"}</td>
                    <td className="px-6 py-4 text-white/70">{u.email}</td>
                    <td className="px-6 py-4 text-white/70">{u.mobile || "-"}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.plan || ""}
                        onChange={(e) => changePlan(u.id, e.target.value)}
                        className="px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">No Plan</option>
                        {plans.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.suspend ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}>
                        {u.suspend ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSuspend(u.id, u.suspend)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${u.suspend ? "bg-green-500/20 text-green-300 hover:bg-green-500/30" : "bg-red-500/20 text-red-300 hover:bg-red-500/30"}`}
                      >
                        {u.suspend ? "Activate" : "Suspend"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => resetPassword(u.id)}
                        className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-medium transition-all"
                      >
                        Reset Password
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// ================== Plans Component ==================
function Plans() {
  const [plans, setPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({ name: "", tool1_videos: 0, tool2_videos: 0, tool3_videos: 0, price: 0 });
  const [editPlanId, setEditPlanId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  useEffect(() => {
    // Real backend se plans fetch karo
    API.adminFetchPlans()
      .then((res) => { setPlans(Array.isArray(res.data) ? res.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addPlan = async () => {
    if (!newPlan.name) return;
    try {
      await API.adminCreatePlan(newPlan);
      const res = await API.adminFetchPlans();
      setPlans(Array.isArray(res.data) ? res.data : []);
      setNewPlan({ name: "", tool1_videos: 0, tool2_videos: 0, tool3_videos: 0, price: 0 });
      showSuccess("Plan ban gaya!");
    } catch {
      setError("Plan create nahi ho saka.");
    }
  };

  const saveEdit = async () => {
    try {
      await API.adminUpdatePlan(editPlanId, editValues);
      setPlans(plans.map((p) => p.id === editPlanId ? { ...p, ...editValues } : p));
      setEditPlanId(null);
      showSuccess("Plan update ho gaya!");
    } catch {
      setError("Plan update failed.");
    }
  };

  const deletePlan = async (planId) => {
    if (!confirm("Kya aap is plan ko delete karna chahte hain?")) return;
    try {
      await API.adminDeletePlan(planId);
      setPlans(plans.filter((p) => p.id !== planId));
      showSuccess("Plan delete ho gaya!");
    } catch {
      setError("Plan delete failed.");
    }
  };

  if (loading) return <div className="text-white/60 text-center py-12">Plans load ho rahe hain...</div>;

  return (
    <div className="space-y-6">
      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-sm">❌ {error}</div>}
      {successMsg && <div className="p-4 rounded-xl bg-green-500/10 border border-green-400/30 text-green-300 text-sm">✅ {successMsg}</div>}

      {/* Add New Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Naya Plan Banao</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { placeholder: "Plan Name (e.g. Basic)", key: "name", type: "text" },
            { placeholder: "Voiceover Videos", key: "tool1_videos", type: "number" },
            { placeholder: "Static Videos", key: "tool2_videos", type: "number" },
            { placeholder: "Animated Videos", key: "tool3_videos", type: "number" },
            { placeholder: "Price ($)", key: "price", type: "number" },
          ].map(({ placeholder, key, type }) => (
            <input
              key={key}
              type={type}
              placeholder={placeholder}
              value={newPlan[key]}
              onChange={(e) => setNewPlan({ ...newPlan, [key]: type === "number" ? +e.target.value : e.target.value })}
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addPlan}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Plan Banao
          </motion.button>
        </div>
      </motion.div>

      {/* Plans Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-white/5 to-white/0 border-b border-white/10">
                {["Plan Name", "Voiceovers", "Static Videos", "Animated Videos", "Price", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-white/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-white/40">Koi plan nahi hai abhi</td></tr>
              ) : plans.map((p) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    {editPlanId === p.id
                      ? <input value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-full focus:outline-none" />
                      : <span className="text-white font-medium">{p.name}</span>}
                  </td>
                  {["tool1_videos", "tool2_videos", "tool3_videos"].map((field) => (
                    <td key={field} className="px-6 py-4">
                      {editPlanId === p.id
                        ? <input type="number" value={editValues[field]} onChange={(e) => setEditValues({ ...editValues, [field]: +e.target.value })} className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-20 focus:outline-none" />
                        : <span className="text-white/70">{p[field]}</span>}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    {editPlanId === p.id
                      ? <input type="number" value={editValues.price} onChange={(e) => setEditValues({ ...editValues, price: +e.target.value })} className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-24 focus:outline-none" />
                      : <span className="text-white font-medium">${p.price}</span>}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {editPlanId === p.id ? (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={saveEdit} className="px-3 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs font-medium">Save</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => setEditPlanId(null)} className="px-3 py-1 rounded bg-gray-500/20 text-gray-300 text-xs font-medium">Cancel</motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setEditPlanId(p.id); setEditValues(p); }} className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-medium">Edit</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => deletePlan(p.id)} className="px-3 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium">Delete</motion.button>
                      </>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// ================== Usage Component ==================
function Usage() {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Real backend se usage data fetch karo
    API.adminFetchUsage()
      .then((res) => {
        setUsageData(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Usage data load nahi ho saka.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-white/60 text-center py-12">Usage data load ho raha hai...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
    >
      {error && <div className="p-4 m-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-sm">❌ {error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-white/5 to-white/0 border-b border-white/10">
              {["User Email", "Total Videos", "Voiceovers (Tool1)", "Static (Tool2)", "Animated (Tool3)"].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-white/80">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usageData.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">Koi usage data nahi hai</td></tr>
            ) : usageData.map((u, i) => (
              <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-white">{u.email}</td>
                <td className="px-6 py-4 text-center"><span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold">{u.total_videos || 0}</span></td>
                <td className="px-6 py-4 text-center text-white/70">{u.tool1 || 0}</td>
                <td className="px-6 py-4 text-center text-white/70">{u.tool2 || 0}</td>
                <td className="px-6 py-4 text-center text-white/70">{u.tool3 || 0}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ================== Videos List Component ==================
function VideosList() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  useEffect(() => {
    API.adminFetchVideos()
      .then((res) => { setVideos(Array.isArray(res.data) ? res.data : []); setLoading(false); })
      .catch(() => { setError("Videos load nahi ho sake."); setLoading(false); });
  }, []);

  const handleDelete = async (videoId) => {
    if (!confirm("Kya is video ko delete karna hai?")) return;
    try {
      await API.adminDeleteVideo(videoId);
      setVideos(videos.filter((v) => v.id !== videoId));
      showSuccess("Video delete ho gayi!");
    } catch {
      setError("Delete failed.");
    }
  };

  if (loading) return <div className="text-white/60 text-center py-12">Videos load ho rahi hain...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-sm">❌ {error}</div>}
      {successMsg && <div className="p-4 rounded-xl bg-green-500/10 border border-green-400/30 text-green-300 text-sm">✅ {successMsg}</div>}

      <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-white/5 to-white/0 border-b border-white/10">
                {["Video ID", "User ID", "Tool", "Status", "Created", "Action"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-white/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-white/40">Koi video nahi hai</td></tr>
              ) : videos.map((v) => (
                <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white/70 font-mono text-xs">{v.video_id || v.id}</td>
                  <td className="px-6 py-4 text-white/50 font-mono text-xs">{v.user_id}</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">{v.tool || "-"}</span></td>
                  <td className="px-6 py-4"><span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">{v.status || "done"}</span></td>
                  <td className="px-6 py-4 text-white/50 text-sm">{v.created_at || "-"}</td>
                  <td className="px-6 py-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleDelete(v.id)}
                      className="px-3 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium transition-all"
                    >
                      Delete
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
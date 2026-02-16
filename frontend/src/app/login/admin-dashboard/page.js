// src/app/login/admin-dashboard/page.js

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Users, Package, BarChart3, Settings } from "lucide-react";

const ease = [0.77, 0, 0.18, 1];

// ================== Admin App (Routes Simulation) ==================
export default function AdminApp() {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("role");
    } catch {}
    router.push("/login");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={20} /> },
    { id: "users", label: "Users", icon: <Users size={20} /> },
    { id: "plans", label: "Plans", icon: <Package size={20} /> },
    { id: "usage", label: "Usage", icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans">
      {/* Animated background blobs */}
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full opacity-60"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, -10, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full opacity-60"
      />

      {/* Header */}
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
            <p className="text-xs text-purple-300/60 mt-1">Management System</p>
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

      {/* Tabs */}
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

        {/* Content */}
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
        </motion.div>
      </div>
    </div>
  );
}

// ================== Overview Component ==================
function Overview() {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState([]);

  // Simulated data fetch
  useEffect(() => {
    setUsers([{ id: 1, email: "user1@test.com", total_videos: 5 }]);
    setPlans([{ id: 1, name: "Basic", tool1_videos: 10, tool2_videos: 5, tool3_videos: 2, price: 10 }]);
    setUsage([{ id: 1, email: "user1@test.com", total_videos: 5, tool1: 2, tool2: 2, tool3: 1 }]);
  }, []);

  const stats = [
    { label: "Total Users", value: users.length, icon: "👥", gradient: "from-blue-600 to-cyan-600" },
    { label: "Total Videos", value: usage.reduce((acc, u) => acc + (u.total_videos || 0), 0), icon: "🎬", gradient: "from-purple-600 to-pink-600" },
    { label: "Active Plans", value: plans.length, icon: "📦", gradient: "from-emerald-600 to-teal-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: i * 0.1 }}
          whileHover={{ y: -10, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
          className={`relative rounded-2xl overflow-hidden border border-white/10 p-8 backdrop-blur-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.1), transparent)`,
          }} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{stat.icon}</span>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.gradient} opacity-20 flex items-center justify-center`} />
            </div>
            <p className="text-white/60 text-sm font-medium mb-2">{stat.label}</p>
            <p className="text-4xl font-bold text-white">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ================== Users Component ==================
function UsersComponent() {
  const [users, setUsers] = useState([
    { id: 1, name: "Ali", email: "ali@test.com", mobile_number: "12345", plan: "Basic", role: "user", created_at: "2026-01-01", total_videos: 5, suspend: false }
  ]);
  const [plans, setPlans] = useState([{ id: 1, name: "Basic" }, { id: 2, name: "Pro" }]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      (u.email?.toLowerCase().includes(search) ||
       u.name?.toLowerCase().includes(search) ||
       u.mobile_number?.toLowerCase().includes(search)) &&
      (filterPlan ? u.plan === filterPlan : true)
    );
  });

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const changePlan = (userId, plan) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan } : u));
  };

  const toggleSuspend = (userId) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, suspend: !u.suspend } : u));
  };

  const resetPassword = (userId) => alert(`Reset password for user ${userId}`);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="flex gap-4 flex-col md:flex-row"
      >
        <input
          type="text"
          placeholder="Search by name, email or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">All Plans</option>
          {plans.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.1 }}
        className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-white/5 to-white/0 border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Select</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Mobile</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Plan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Videos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
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
                      className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-white/70">{u.email}</td>
                  <td className="px-6 py-4 text-white/70">{u.mobile_number}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.plan}
                      onChange={(e) => changePlan(u.id, e.target.value)}
                      className="px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {plans.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">{u.role}</span>
                  </td>
                  <td className="px-6 py-4 text-white">{u.total_videos}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.suspend ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                      {u.suspend ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSuspend(u.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${u.suspend ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}
                    >
                      {u.suspend ? "Activate" : "Suspend"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => resetPassword(u.id)}
                      className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-medium transition-all"
                    >
                      Reset
                    </motion.button>
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

// ================== Plans Component ==================
function Plans() {
  const [plans, setPlans] = useState([
    { id: 1, name: "Basic", tool1_videos: 10, tool2_videos: 5, tool3_videos: 2, price: 10 }
  ]);
  const [newPlan, setNewPlan] = useState({ name: "", tool1_videos: 0, tool2_videos: 0, tool3_videos: 0, price: 0 });
  const [editPlanId, setEditPlanId] = useState(null);
  const [editValues, setEditValues] = useState(newPlan);

  const addPlan = () => {
    if (!newPlan.name) return;
    setPlans([...plans, { ...newPlan, id: Date.now() }]);
    setNewPlan({ name: "", tool1_videos: 0, tool2_videos: 0, tool3_videos: 0, price: 0 });
  };

  const startEdit = (plan) => {
    setEditPlanId(plan.id);
    setEditValues(plan);
  };

  const saveEdit = () => {
    setPlans(plans.map((p) => p.id === editPlanId ? editValues : p));
    setEditPlanId(null);
  };

  const deletePlan = (planId) => setPlans(plans.filter((p) => p.id !== planId));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Add New Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Plan Name"
            value={newPlan.name}
            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
            className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Tool1 Videos"
            value={newPlan.tool1_videos}
            onChange={(e) => setNewPlan({ ...newPlan, tool1_videos: +e.target.value })}
            className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Tool2 Videos"
            value={newPlan.tool2_videos}
            onChange={(e) => setNewPlan({ ...newPlan, tool2_videos: +e.target.value })}
            className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Tool3 Videos"
            value={newPlan.tool3_videos}
            onChange={(e) => setNewPlan({ ...newPlan, tool3_videos: +e.target.value })}
            className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Price ($)"
            value={newPlan.price}
            onChange={(e) => setNewPlan({ ...newPlan, price: +e.target.value })}
            className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addPlan}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            Add Plan
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.1 }}
        className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-white/5 to-white/0 border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Plan Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Tool1</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Tool2</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Tool3</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    {editPlanId === p.id ? (
                      <input
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-full focus:outline-none"
                      />
                    ) : (
                      <span className="text-white font-medium">{p.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editPlanId === p.id ? (
                      <input
                        type="number"
                        value={editValues.tool1_videos}
                        onChange={(e) => setEditValues({ ...editValues, tool1_videos: +e.target.value })}
                        className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-20 focus:outline-none"
                      />
                    ) : (
                      <span className="text-white/70">{p.tool1_videos}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editPlanId === p.id ? (
                      <input
                        type="number"
                        value={editValues.tool2_videos}
                        onChange={(e) => setEditValues({ ...editValues, tool2_videos: +e.target.value })}
                        className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-20 focus:outline-none"
                      />
                    ) : (
                      <span className="text-white/70">{p.tool2_videos}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editPlanId === p.id ? (
                      <input
                        type="number"
                        value={editValues.tool3_videos}
                        onChange={(e) => setEditValues({ ...editValues, tool3_videos: +e.target.value })}
                        className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-20 focus:outline-none"
                      />
                    ) : (
                      <span className="text-white/70">{p.tool3_videos}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editPlanId === p.id ? (
                      <input
                        type="number"
                        value={editValues.price}
                        onChange={(e) => setEditValues({ ...editValues, price: +e.target.value })}
                        className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-24 focus:outline-none"
                      />
                    ) : (
                      <span className="text-white font-medium">${p.price}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {editPlanId === p.id ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={saveEdit}
                          className="px-3 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs font-medium transition-all"
                        >
                          Save
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditPlanId(null)}
                          className="px-3 py-1 rounded bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 text-xs font-medium transition-all"
                        >
                          Cancel
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startEdit(p)}
                          className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-medium transition-all"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deletePlan(p.id)}
                          className="px-3 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium transition-all"
                        >
                          Delete
                        </motion.button>
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
  const [usage, setUsage] = useState([
    { id: 1, email: "ali@test.com", total_videos: 5, tool1: 2, tool2: 2, tool3: 1 }
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-white/5 to-white/0 border-b border-white/10">
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Total Videos</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Voices</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Static Videos</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Animated Videos</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((u) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 text-white font-medium">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">{u.total_videos}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-semibold">{u.tool1}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-semibold">{u.tool2}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-semibold">{u.tool3}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

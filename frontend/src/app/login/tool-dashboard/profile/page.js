// src/app/login/tool-dashboard/profile/page.js

"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editData, setEditData] = useState({ name: "", mobile: "" });

  useEffect(() => {
    API.getProfile()
      .then((res) => {
        setProfile(res.data);
        setEditData({ name: res.data.name || "", mobile: res.data.mobile || "" });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await API.updateProfile(editData);
      setProfile((prev) => ({ ...prev, ...editData }));
      setSaveMsg("Profile updated successfully!");
      setEditing(false);
    } catch {
      setSaveMsg("Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#031b1b] to-[#04181a]">
      <p className="text-white text-xl">Loading...</p>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#031b1b] to-[#04181a]">
      <p className="text-red-400 text-xl">Could not load profile</p>
    </div>
  );

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : "?";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-gradient-to-b from-[#031b1b] to-[#04181a]">
      <div className="w-full max-w-2xl p-1 rounded-3xl bg-gradient-to-r from-[#0ea5a4]/20 via-transparent to-[#1fb6c3]/15 shadow-[0_20px_60px_rgba(7,23,24,0.7)]">
        <div className="rounded-3xl bg-[#042526]/70 backdrop-blur-2xl border border-[#1ba8b1]/30 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-gradient-to-tr from-[#0ff] to-[#6bf3ff] opacity-5 blur-3xl pointer-events-none" />

          {/* Back link */}
          <a
            href="/login/tool-dashboard"
            className="inline-flex items-center gap-2 text-sm text-[#1ba8b1] hover:text-[#6bf3ff] mb-6 transition-colors"
          >
            ← Back to Dashboard
          </a>

          {/* Header */}
          <header className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1ba8b1] to-[#8ff8ff] p-0.5 shadow-[0_8px_30px_rgba(27,168,177,0.18)]">
                <div className="w-full h-full rounded-full bg-[#022a2b] flex items-center justify-center text-white text-lg font-semibold">
                  {initials}
                </div>
              </div>
              <span className="absolute -bottom-0.5 left-0 translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-[#1ba8b1] to-[#9ef6ff] text-black font-medium">
                <span className="w-2 h-2 rounded-full bg-black/40 animate-pulse" />
                Online
              </span>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
              <p className="text-sm text-[#9fe3e6]">
                {profile.role} • Plan: <span className="font-semibold text-white">{profile.plan}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[#14c1be] to-[#0ea5a4] text-black font-semibold hover:scale-105 transition-transform disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setSaveMsg(""); }}
                    className="px-4 py-2 rounded-full bg-[#052f2f] border border-[#1ba8b1]/30 text-[#9fe3e6] hover:brightness-110 font-semibold transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setEditing(true); setSaveMsg(""); }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#14c1be] to-[#0ea5a4] text-black font-semibold hover:scale-105 transition-transform"
                >
                  Edit
                </button>
              )}
            </div>
          </header>

          {/* Save message */}
          {saveMsg && (
            <p className={`mb-4 text-sm font-medium text-center ${saveMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>
              {saveMsg}
            </p>
          )}

          {/* Profile Fields */}
          <div className="grid grid-cols-1 gap-4 text-sm sm:text-base">
            {/* Editable: Name */}
            <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#1ba8b1] to-[#9ef6ff]" />
                <span className="text-[#8fd4d9] font-medium">Name</span>
              </div>
              {editing ? (
                <input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="bg-transparent border-b border-[#1ba8b1] text-white text-right focus:outline-none px-1 w-48"
                />
              ) : (
                <span className="text-white/90">{profile.name || "-"}</span>
              )}
            </div>

            {/* Read only: Email */}
            <ProfileRow label="Email" value={profile.email} />

            {/* Editable: Mobile */}
            <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#1ba8b1] to-[#9ef6ff]" />
                <span className="text-[#8fd4d9] font-medium">Mobile</span>
              </div>
              {editing ? (
                <input
                  value={editData.mobile}
                  onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                  className="bg-transparent border-b border-[#1ba8b1] text-white text-right focus:outline-none px-1 w-48"
                />
              ) : (
                <span className="text-white/90">{profile.mobile || "-"}</span>
              )}
            </div>

            <ProfileRow label="Plan" value={profile.plan} />
            <ProfileRow label="Role" value={profile.role} />
            <ProfileRow label="Joined" value={profile.created_at} />
            <ProfileRow
              label="Status"
              value={profile.suspend ? "Suspended" : "Active"}
              highlight={!profile.suspend}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-3">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#1ba8b1] to-[#9ef6ff]" />
        <span className="text-[#8fd4d9] font-medium">{label}</span>
      </div>
      <span
        className={`text-right ${highlight ? "font-semibold" : "text-white/90"}`}
        style={
          highlight
            ? { background: "linear-gradient(90deg,#7ff7f9,#1ba8b1)", WebkitBackgroundClip: "text", color: "transparent" }
            : {}
        }
      >
        {value || "-"}
      </span>
    </div>
  );
}
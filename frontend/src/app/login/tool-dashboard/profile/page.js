// src/app/login/tool-dashboard/profile/page.js

"use client";

import { useState } from "react";

export default function Profile() {
  const [profile] = useState({
    name: "Muhammad Fahad",
    email: "fahad@example.com",
    mobile: "+92 300 0000000",
    plan: "Pro",
    role: "User",
    created_at: "Jan 12, 2025",
    suspend: false
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-gradient-to-b from-[#031b1b] to-[#04181a]">
      <div className="w-full max-w-2xl p-1 rounded-3xl bg-gradient-to-r from-[#0ea5a4]/20 via-transparent to-[#1fb6c3]/15 shadow-[0_20px_60px_rgba(7,23,24,0.7)]">
        <div className="rounded-3xl bg-[#042526]/70 backdrop-blur-2xl border border-[#1ba8b1]/30 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-gradient-to-tr from-[#0ff] to-[#6bf3ff] opacity-6 blur-3xl pointer-events-none" />

          <header className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1ba8b1] to-[#8ff8ff] p-0.5 shadow-[0_8px_30px_rgba(27,168,177,0.18)]">
                <div className="w-full h-full rounded-full bg-[#022a2b] flex items-center justify-center text-white text-lg font-semibold">
                  {profile.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                </div>
              </div>
              <span className={`absolute -bottom-0.5 left-0 translate-y-1/2 inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-[#1ba8b1] to-[#9ef6ff] text-black font-medium`}> 
                <span className="w-2 h-2 rounded-full bg-black/40 shadow-[0_0_12px_rgba(255,255,255,0.08)] animate-pulse"/>
                Online
              </span>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
              <p className="text-sm text-[#9fe3e6]">{profile.role} • Plan: <span className="font-semibold text-white">{profile.plan}</span></p>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-full bg-gradient-to-r from-[#14c1be] to-[#0ea5a4] text-black font-semibold hover:scale-105 transition-transform">Edit</button>
              <button className="p-2 rounded-full bg-[#052f2f] border border-[#1ba8b1]/20 text-[#9fe3e6] hover:brightness-110">⚙️</button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 text-sm sm:text-base">
            <ProfileRow label="Email" value={profile.email} />
            <ProfileRow label="Mobile" value={profile.mobile} />
            <ProfileRow label="Plan" value={profile.plan} />
            <ProfileRow label="Role" value={profile.role} />
            <ProfileRow label="Joined" value={profile.created_at} />
            <ProfileRow label="Status" value={profile.suspend ? "Suspended" : "Active"} highlight={!profile.suspend} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-white/6 pb-3">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#1ba8b1] to-[#9ef6ff] shadow-[0_6px_20px_rgba(27,168,177,0.12)]" />
        <span className="text-[#8fd4d9] font-medium">{label}</span>
      </div>

      <span className={`text-right ${highlight ? "text-gradient font-semibold" : "text-white/90"}`} style={highlight ? {background: 'linear-gradient(90deg,#7ff7f9,#1ba8b1)', WebkitBackgroundClip:'text', color:'transparent'} : {}}>
        {value || "-"}
      </span>
    </div>
  );
}

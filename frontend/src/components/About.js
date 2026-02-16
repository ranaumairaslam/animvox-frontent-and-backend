"use client";

import { Award, Briefcase, Zap, Users, Star } from "lucide-react";

function Stat({ icon, value, label, delay = 0 }) {
  return (
    <div
      className="flex items-center gap-3 group animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-[#22B2C1] w-6 h-6 group-hover:scale-125 transition-transform duration-300 drop-shadow-md">
        {icon}
      </div>
      <div>
        <p className="text-lg md:text-xl font-unbounded font-bold text-[#22B2C1] group-hover:text-white transition-colors duration-300 tracking-tight">
          {value}
        </p>
        <p className="text-[10px] md:text-xs text-white/60 font-unbounded font-regular uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function About() {
  const stats = [
    { icon: <Briefcase />, value: "500+", label: "Projects Generated" },
    { icon: <Award />, value: "15", label: "Awards & Recognitions" },
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0b0b0b] to-[#111111]">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* LEFT CARD */}
        <div className="p-6 md:p-10 rounded-3xl shadow-2xl border border-white/10 bg-[#111111]/70 hover:bg-[#111111]/90 transition-all duration-500 animate-fade-in-left">
          <div className="p-6 relative overflow-hidden rounded-2xl border border-white/10">
            {/* Tagline */}
            <p className="text-[10px] md:text-xs font-unbounded font-bold tracking-[0.25em] text-[#22B2C1] relative z-10">
              WHY ANIMVOX
            </p>

            {/* Heading */}
            <h3 className="mt-4 text-xl md:text-3xl font-unbounded font-extrabold text-white relative z-10 leading-snug tracking-tight">
              Precision, speed, and a clean creative loop
            </h3>

            {/* Body */}
            <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed font-unbounded font-light relative z-10">
              Generate voice and visuals with an output-first workflow. Minimal UI, maximum control — without the clutter.
            </p>

            {/* Feature Tags */}
            <div className="mt-8 grid grid-cols-3 gap-3 relative z-10">
              {["Stable style", "Fast iterate", "Brand-ready"].map((t) => (
                <div
                  key={t}
                  className="rounded-xl border border-[#22B2C1]/30 px-2 py-4 text-center hover:border-[#22B2C1] hover:bg-[#22B2C1]/10 transition-all duration-300 group cursor-pointer"
                >
                  <Zap className="w-5 h-5 text-[#22B2C1] mx-auto mb-2 group-hover:animate-pulse" />
                  <p className="text-[9px] md:text-xs text-white/80 font-unbounded font-regular uppercase tracking-tighter">{t}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap justify-between gap-6">
            <Stat icon={<Award />} value="6+ Yrs" label="AI Experience" delay={0.2} />
            <Stat icon={<Briefcase />} value="500+" label="Projects Generated" delay={0.4} />
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="space-y-8 animate-fade-in-right">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Star className="text-[#22B2C1] w-6 h-6 animate-spin-slow drop-shadow-md" />
              <span className="font-unbounded font-medium text-[#22B2C1] text-sm tracking-widest uppercase">Innovation</span>
            </div>

            {/* Main Title */}
            <h2 className="text-3xl md:text-5xl font-unbounded font-extrabold text-white leading-[1.1] tracking-tight">
              Transform ideas into <span className="text-[#22B2C1] drop-shadow-md">AI voices</span> & visuals
            </h2>
          </div>

          {/* Body */}
          <p className="text-white/70 text-sm md:text-base leading-relaxed font-unbounded font-light max-w-lg">
            AnimVox turns text into cinematic visuals and lifelike voices with a clean, futuristic interface that stays out of your way.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            {stats.map((s, i) => (
              <Stat key={i} {...s} delay={0.6 + i * 0.2} />
            ))}
          </div>

          {/* Callout */}
          <div className="mt-8 p-5 rounded-2xl border border-[#22B2C1]/30 hover:bg-[#22B2C1]/10 transition-all duration-300 cursor-pointer">
            <p className="text-xs md:text-sm text-white/90 font-unbounded font-medium flex items-center gap-3">
              <Users className="w-5 h-5 text-[#22B2C1]" />
              Join thousands of creators revolutionizing workflows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

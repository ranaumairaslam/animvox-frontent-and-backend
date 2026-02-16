// src/app/login/tool-dashboard/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic2, Video, Film, User, LogOut, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const ease = [0.77, 0, 0.18, 1];

export default function Dashboard() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("role");
    } catch {}
    router.push("/login");
  };

  const cards = [
    {
      title: "Voices",
      subtitle: "AnimVox Voices",
      description: "Create realistic AI voiceovers for your animations",
      icon: <Mic2 size={48} />,
      href: "/login/tool-dashboard/voices",
      gradient: "from-blue-600 via-blue-500 to-cyan-400",
      gradientLight: "from-blue-500/40 via-blue-400/20 to-cyan-300/20",
      accentColor: "#0EA5E9",
      borderGradient: "from-blue-400/60 to-cyan-300/30",
    },
    {
      title: "Static Videos",
      subtitle: "Image to Video",
      description: "Transform static images into dynamic video content",
      icon: <Video size={48} />,
      href: "/login/tool-dashboard/static-videos",
      gradient: "from-purple-600 via-purple-500 to-pink-400",
      gradientLight: "from-purple-500/40 via-purple-400/20 to-pink-300/20",
      accentColor: "#A855F7",
      borderGradient: "from-purple-400/60 to-pink-300/30",
    },
    {
      title: "Animated Videos",
      subtitle: "AI Animation",
      description: "Create fully animated video content with advanced AI",
      icon: <Film size={48} />,
      href: "/login/tool-dashboard/animated-videos",
      gradient: "from-emerald-600 via-emerald-500 to-teal-400",
      gradientLight: "from-emerald-500/40 via-emerald-400/20 to-teal-300/20",
      accentColor: "#10B981",
      borderGradient: "from-emerald-400/60 to-teal-300/30",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 text-white font-sans">
      {/* Animated background blobs */}
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/30 blur-[120px] rounded-full opacity-60"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, -10, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/30 blur-[120px] rounded-full opacity-60"
      />
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 right-1/4 w-72 h-72 bg-cyan-500/20 blur-[100px] rounded-full opacity-40"
      />

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease }}
          className="flex items-center gap-2"
        >
          <Sparkles size={24} className="text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            ANIMVOX
          </h1>
        </motion.div>

        <div className="flex gap-3 items-center">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/login/tool-dashboard/profile")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <User size={18} />
            <span className="text-sm font-medium">Profile</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, borderColor: "#0EA5E9", backgroundColor: "rgba(14, 165, 233, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </motion.button>
          
        </div>
      </nav>

      {/* HERO */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease }}
        className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 pt-12 pb-8"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease }}
          className="mb-8"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              Welcome Back
            </span>
          </h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease, delay: 0.15 }}
            className="text-lg text-blue-100/70 max-w-2xl leading-relaxed font-light"
          >
            Choose a creation module and unleash your creativity with AI-powered tools designed for content creators
          </motion.p>
        </motion.div>
      </motion.section>

      {/* MODULES */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 0.15 + i * 0.15 }}
              onHoverStart={() => setHoveredCard(i)}
              onHoverEnd={() => setHoveredCard(null)}
              className="group relative h-full"
            >
              {/* Glow effect - stronger and more colorful */}
              <motion.div
                animate={{
                  opacity: hoveredCard === i ? 1 : 0.3,
                  scale: hoveredCard === i ? 1.05 : 1,
                }}
                transition={{ duration: 0.5, ease }}
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.gradientLight} blur-3xl -z-10`}
              />

              {/* Card with gradient border */}
              <Link href={card.href} className="block h-full">
                <motion.div
                  whileHover={{
                    y: -20,
                    boxShadow: "0 30px 60px rgba(0, 0, 0, 0.5)",
                  }}
                  transition={{ duration: 0.4, ease }}
                  className="relative h-full rounded-3xl overflow-hidden"
                >
                  {/* Animated gradient border */}
                  <div
                    className={`absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-br ${card.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950" />
                  </div>

                  {/* Card Content */}
                  <div className="relative h-full rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-blue-900/30 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-between p-10 transition-all duration-500 group-hover:border-white/20 group-hover:bg-slate-900/60">
                    {/* Top accent glow */}
                    <motion.div
                      animate={{
                        opacity: hoveredCard === i ? 1 : 0,
                        y: hoveredCard === i ? 0 : -20,
                      }}
                      transition={{ duration: 0.4, ease }}
                      className="absolute -top-20 right-0 w-40 h-40 rounded-full blur-3xl opacity-40"
                      style={{ background: `radial-gradient(circle, ${card.accentColor}33, transparent)` }}
                    />

                    {/* Icon Container with gradient */}
                    <motion.div
                      animate={{
                        scale: hoveredCard === i ? 1.25 : 1,
                        rotateZ: hoveredCard === i ? 12 : 0,
                      }}
                      transition={{ duration: 0.5, ease }}
                      className="relative mb-4"
                    >
                      <div
                        className="absolute inset-0 rounded-2xl blur-2xl opacity-60"
                        style={{ background: `linear-gradient(135deg, ${card.accentColor}, ${card.accentColor}33)` }}
                      />
                      <div
                        className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-2xl border border-white/30`}
                      >
                        {card.icon}
                      </div>
                    </motion.div>

                    {/* Text Content */}
                    <div className="relative z-10 text-center flex flex-col gap-2 mb-4">
                      <motion.div
                        animate={{
                          y: hoveredCard === i ? 0 : 0,
                        }}
                        className="inline-block"
                      >
                        <span
                          className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                          style={{
                            background: `${card.accentColor}15`,
                            color: card.accentColor,
                            border: `1px solid ${card.accentColor}40`,
                          }}
                        >
                          {card.subtitle}
                        </span>
                      </motion.div>
                      <h3 className="text-3xl font-bold tracking-tight text-white">
                        {card.title}
                      </h3>
                      <p className="text-blue-100/60 text-sm leading-relaxed min-h-10">
                        {card.description}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <motion.button
                      animate={{
                        opacity: hoveredCard === i ? 1 : 0.6,
                        y: hoveredCard === i ? 0 : 10,
                      }}
                      transition={{ duration: 0.4, ease }}
                      className="relative z-10 flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${card.accentColor}, ${card.accentColor}dd)`,
                        boxShadow: hoveredCard === i ? `0 0 20px ${card.accentColor}60` : "none",
                      }}
                    >
                      <span>Get Started</span>
                      <motion.div
                        animate={{ x: hoveredCard === i ? 6 : 0 }}
                        transition={{ duration: 0.4, ease }}
                      >
                        <ArrowRight size={18} />
                      </motion.div>
                    </motion.button>

                    {/* Scan line effect */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                      <motion.div
                        animate={{
                          top: hoveredCard === i ? "100%" : "-100%",
                        }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute w-full h-[3px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

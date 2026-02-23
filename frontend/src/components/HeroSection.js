"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ================================
   PARTICLE BACKGROUND
================================ */

const ParticleBackground = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const dots = Array.from({ length: 160 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: 6 + Math.random() * 6,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    }));

    setParticles(dots);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.8,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

/* ================================
   HERO SECTION
================================ */

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">

      {/* Particle Background */}
      <ParticleBackground />

      {/* CONTENT */}
      <div className="relative z-10 text-center px-6">

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[3rem] md:text-[3.5rem] font-bold text-white font-unbounded"
        >
       The most realistic <span className="text-[#22B2C1]"><br></br> voice AI</span> platform        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-xl mx-auto text-white/60 font-unbounded "
        >
          AI voice models and products powering millions of developers, creators, and enterprises. From low-latency conversational agents to the leading AI voice generator for voiceovers and audiobooks.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10"
        >
          <Link
            href="/login"
            className="px-10 py-4 rounded-full bg-[#22B2C1] text-black font-bold text-sm 
                       hover:shadow-[0_0_40px_rgba(34,178,193,0.7)] transition font-unbounded"
          >
            SIGN UP NOW →
          </Link>
        </motion.div>

      </div>
    </section>
  );
}

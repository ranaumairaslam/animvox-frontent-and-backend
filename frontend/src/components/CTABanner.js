"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { useEffect, useState } from "react";

// Seeded random number generator for consistent values
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate consistent stars based on ID
const generateStar = (id) => {
  const baseSeed = id * 12.9898;
  
  const colors = [
    'rgba(34, 178, 193, 0.8)',    // Cyan
    'rgba(139, 92, 246, 0.8)',    // Purple
    'rgba(236, 72, 153, 0.8)',    // Pink
    'rgba(59, 130, 246, 0.8)',    // Blue
    'rgba(16, 185, 129, 0.8)',    // Green
    'rgba(251, 191, 36, 0.8)',    // Yellow
    'rgba(248, 113, 113, 0.8)',   // Red
    'rgba(96, 165, 250, 0.8)',    // Light Blue
  ];
  
  const size = seededRandom(baseSeed + 2) * 3 + 1;
  const color = colors[Math.floor(seededRandom(baseSeed + 4) * colors.length)];

  return {
    id,
    x: seededRandom(baseSeed) * 100,
    y: seededRandom(baseSeed + 1) * 100,
    size: size,
    color: color,
    delay: seededRandom(baseSeed + 5) * 3,
    duration: 2 + seededRandom(baseSeed + 6) * 2,
  };
};

export default function CTABanner() {
  const [stars, setStars] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Generate stars after hydration to avoid mismatch
  useEffect(() => {
    const generatedStars = Array.from({ length: 150 }, (_, i) => generateStar(i));
    setStars(generatedStars);
    setIsHydrated(true);
  }, []);

  return (
    <section className="relative overflow-hidden py-32 font-unbounded bg-black">
      
      {/* === Colorful Twinkling Stars Background === */}
      <div className="absolute inset-0 z-0 bg-black">
        {isHydrated && stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size * 3}px ${star.color}`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* === Content === */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT SIDE: Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              {/* Badge */}
              <motion.span 
                className="inline-block mb-6 px-5 py-2 text-[10px] font-bold tracking-[0.35em] rounded-full bg-[#22B2C1]/10 text-[#22B2C1] border border-[#22B2C1]/20 uppercase"
              >
                Next-Gen AI Generation
              </motion.span>

              {/* Main Heading */}
              <h2 className="text-2xl md:text-6xl font-light text-white leading-[1.1] mb-6 tracking-tight">
                Veo 3 Fast: <br />
                <span className="text-[#22B2C1] font-bold">Build & Iterate</span> <br />
                Quicker
              </h2>

              {/* Description */}
              <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-xl font-light">
                Optimized for speed and quality, AnimVox allows for rapid development and high-quality 
                video output. Generate immersive visuals from just a prompt or an image.
              </p>
            </div>

            <div className="flex flex-wrap gap-5">
              {/* Primary Button */}
              <Link
                href="/login"
                className="group px-8 py-4 rounded-full bg-[#22B2C1] text-black font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:shadow-[0_0_40px_rgba(34,178,193,0.5)] transition-all active:scale-95"
              >
                Get Started Free
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* RIGHT SIDE: Video Display */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 blur-[60px] rounded-[3rem] opacity-30" />
            
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a]">
              <div className="aspect-video lg:aspect-[4/3] w-full overflow-hidden">
                <video
                  className="w-full h-full lg:[3/4] object-cover opacity-80"
                  src="/videos/demo.webm" 
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

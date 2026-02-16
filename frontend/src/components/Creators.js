"use client";

import { motion } from "framer-motion";
import { PenTool, Megaphone, Film } from "lucide-react";

const CREATORS = [
  {
    name: "Marketing Creators",
    icon: <Megaphone className="h-5 w-5" />,
    desc: "Ads, promos, and short-form content with consistent style.",
  },
  {
    name: "Content Teams",
    icon: <PenTool className="h-5 w-5" />,
    desc: "Scale production while keeping brand voice and visuals aligned.",
  },
  {
    name: "AI Filmmakers",
    icon: <Film className="h-5 w-5" />,
    desc: "Prototype scenes fast and iterate without friction.",
  },
];

export default function Creators() {
  return (
    <section className="relative py-24">
      <div className="max-w-6xl mx-auto px-6 space-y-12">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4"
        >
          {/* Main Title: Using font-unbounded + font-bold */}
          <h2 className="text-3xl md:text-4xl font-unbounded font-bold text-(--accent-primary) tracking-[0.06em]">
            Built for Modern Creators
          </h2>
          {/* Subtitle: Using font-unbounded + font-light for readability */}
          <p className="text-white/70 max-w-2xl mx-auto font-unbounded font-light text-sm md:text-base">
            From solo creators to enterprise teams — AnimVox adapts to every workflow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {CREATORS.map((creator, i) => (
            <motion.div
              key={creator.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="soft-card p-6 border-white/10 bg-black/30 rounded-2xl border">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-(--accent-primary)">
                    {creator.icon}
                  </div>
                  {/* Card Name: Using font-unbounded + font-semibold */}
                  <p className="text-white font-unbounded font-semibold text-lg">
                    {creator.name}
                  </p>
                </div>
                {/* Card Description: Using font-unbounded + font-light */}
                <p className="mt-3 text-sm text-white/70 leading-relaxed font-unbounded font-light">
                  {creator.desc}
                </p>
                <div className="mt-5 h-px bg-white/10" />
                {/* CTA Link: Using font-unbounded + font-medium */}
                <p className="mt-4 text-xs text-(--accent-primary) font-unbounded font-medium cursor-pointer hover:underline">
                  View workflows →
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
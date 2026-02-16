"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaVolumeUp, FaPlayCircle, FaStar } from "react-icons/fa";

export default function ExamplesGallery() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 0,
      title: "PROMPT TO VOICE",
      desc: "Transform any text into professional, emotional, and lifelike human speech. Perfect for audiobooks and narrations.",
      previewTitle: "The Adventures of Sherlock Holmes",
      previewAuthor: "AI Narrator - David",
      previewCategory: "Narrative • 128kbps HD",
      img: "/mnt/data/c46866ff-230a-4fc4-84e9-17e6db25bdb2.png",
      type: "audio"
    },
    {
      id: 1,
      title: "IMAGE TO VIDEO",
      desc: "Bring your static images to life with cinematic motion and AI-driven animation. High-fidelity video generation in seconds.",
      previewTitle: "Cinematic Forest Motion",
      previewAuthor: "Motion Model V2.5",
      previewCategory: "4K Resolution • 24fps",
      img: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1000",
      videoSrc: "/videos/example-1.mp4",
      type: "video"
    },
  ];

  return (
    <section className="relative py-24 bg-[#0b0b0b] font-unbounded">
      <div className="page-container max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Example output of <span className="text-[#22B2C1]">Animvox</span>
          </motion.h2>
          <p className="text-white/50 max-w-2xl mx-auto text-sm md:text-base">
            Experience the power of our multi-modal AI models. From voice synthesis to cinematic video motion.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          {/* Left: Feature Selector */}
          <div className="md:w-1/2 space-y-8 self-center">
            {features.map((item, index) => (
              <div 
                key={item.id}
                onClick={() => setActiveTab(index)}
                className={`cursor-pointer border-l-4 pl-8 py-4 transition-all duration-500 rounded-r-xl ${
                  activeTab === index ? "border-[#22B2C1] bg-white/5" : "border-white/10 opacity-50 hover:opacity-100"
                }`}
              >
                <h3 className={`text-sm font-bold tracking-wider mb-1 ${activeTab === index ? "text-[#22B2C1]" : "text-white"}`}>
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Right: Dynamic Preview */}
          <div className="md:w-1/2 flex justify-center w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                className="relative w-full max-w-md bg-gradient-to-b from-[#111111] to-[#080808] rounded-3xl overflow-hidden border border-white/10 shadow-lg flex flex-col"
              >
                {/* Top Badge */}
                <div className="absolute top-6 left-6 flex justify-between w-[calc(100%-3rem)] z-20">
                  <div className="px-3 py-1 rounded-full text-[10px] text-white bg-black/30 backdrop-blur-sm border border-white/10 uppercase tracking-widest">
                    {features[activeTab].type === "audio" ? "Synthesizing..." : "Generating Video..."}
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-[#22B2C1]">
                    {features[activeTab].type === "audio" ? <FaVolumeUp size={10}/> : <FaPlayCircle size={12}/>}
                  </div>
                </div>

                {/* Media Display */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-4">
                  <div className="relative group w-full aspect-[4/5] mb-6 overflow-hidden rounded-2xl border border-white/5 shadow-xl bg-white/5">
                    {features[activeTab].type === "video" ? (
                      <video
                        key={features[activeTab].videoSrc}
                        src={features[activeTab].videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={features[activeTab].img}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}

                    {/* Audio Waveform Overlay */}
                    {features[activeTab].type === "audio" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                        <div className="flex gap-1.5 h-12 items-center">
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [12, 35, 18, 45, 12] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                              className="w-1.5 bg-[#22B2C1] rounded-full shadow-[0_0_15px_#22B2C1]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <h2 className="text-sm font-light text-white mb-1">{features[activeTab].previewTitle}</h2>
                  <p className="text-[#22B2C1] text-xs uppercase tracking-wider mb-3">{features[activeTab].previewAuthor}</p>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => <FaStar key={i} className="text-white" size={10} />)}
                    <span className="text-white/40 text-[10px] ml-1 uppercase tracking-widest">Premium Quality</span>
                  </div>
                  <p className="text-white/30 text-[9px] uppercase tracking-[0.3em]">{features[activeTab].previewCategory}</p>
                </div>

                {/* Footer CTA */}
                <div className="p-6 bg-white/5 border-t border-white/10 flex items-center justify-center">
                  <button className="w-full py-3 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#22B2C1] text-black hover:bg-white hover:text-black transition-all duration-300 active:scale-95">
                    Try {features[activeTab].title}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}

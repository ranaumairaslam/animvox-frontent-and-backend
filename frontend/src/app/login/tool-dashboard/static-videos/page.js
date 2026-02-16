// src/app/login/tool-dashboard/static-videos/page.js

"use client";

import { useState } from "react";
import { ArrowRight, Video, Plus, Trash2, Upload, Film, Settings, Zap } from "lucide-react";

export default function StaticVideoTool() {
  const [scenes, setScenes] = useState([{ dialogue: "", images: [] }]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const addScene = () =>
    setScenes([...scenes, { dialogue: "", images: [] }]);

  const removeScene = (idx) =>
    setScenes(scenes.filter((_, index) => index !== idx));

  const handleGenerate = () => {
    setIsGenerating(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 30;
      if (currentProgress >= 100) {
        setProgress(100);
        clearInterval(interval);
        setIsGenerating(false);
      } else {
        setProgress(currentProgress);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-12 font-sans overflow-hidden relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Back Button */}
        <a
          href="./"
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-400/50 text-blue-100 transition duration-300 backdrop-blur-sm group"
        >
          <span className="group-hover:-translate-x-1 transition duration-300">←</span> Back to Dashboard
        </a>

        {/* Page Title Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/30 to-pink-600/30 border border-violet-400/30 backdrop-blur-xl hover:from-violet-500/50 hover:to-pink-600/50 transition duration-300">
              <div className="animate-bounce">
                <Film size={32} className="text-violet-300" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-violet-300 via-pink-300 to-rose-400 bg-clip-text text-transparent animate-pulse">
                Static Video Studio
              </h1>
              <p className="text-violet-200/70 text-sm md:text-base mt-2 font-light tracking-wider">Create dynamic videos with images and voiceover</p>
            </div>
          </div>
        </div>

        {/* Global Settings Card */}
        <div className="mb-12">
          <div className="group bg-gradient-to-br from-violet-500/10 to-pink-600/10 border border-violet-400/20 hover:border-violet-400/50 rounded-3xl p-8 backdrop-blur-2xl transition duration-500 hover:shadow-2xl hover:shadow-violet-500/20">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-violet-300 uppercase tracking-wide">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Settings size={20} />
              </div>
              Global Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Language */}
              <div>
                <label className="text-xs font-bold mb-3 text-violet-200/80 block uppercase tracking-widest">
                  Language
                </label>
                <select className="w-full rounded-xl bg-white/5 border-2 border-violet-400/20 hover:border-violet-400/40 p-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition duration-300 backdrop-blur-xl cursor-pointer hover:bg-white/10">
                  <option value="en">🇺🇸 English</option>
                  <option value="ur">🇵🇰 Urdu</option>
                </select>
              </div>

              {/* Voice */}
              <div>
                <label className="text-xs font-bold mb-3 text-violet-200/80 block uppercase tracking-widest">
                  Voice Type
                </label>
                <select className="w-full rounded-xl bg-white/5 border-2 border-violet-400/20 hover:border-violet-400/40 p-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition duration-300 backdrop-blur-xl cursor-pointer hover:bg-white/10">
                  <option value="male">♂ Male</option>
                  <option value="female">♀ Female</option>
                  <option value="narrator">📢 Narrator</option>
                </select>
              </div>

              {/* TTS Rate */}
              <div>
                <label className="text-xs font-bold mb-3 text-violet-200/80 block uppercase tracking-widest">
                  TTS Rate
                </label>
                <input
                  type="number"
                  defaultValue={120}
                  className="w-full rounded-xl bg-white/5 border-2 border-violet-400/20 hover:border-violet-400/40 p-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition duration-300 backdrop-blur-xl hover:bg-white/10"
                />
              </div>

              {/* Pitch */}
              <div>
                <label className="text-xs font-bold mb-3 text-violet-200/80 block uppercase tracking-widest">
                  Pitch
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={1.0}
                  className="w-full rounded-xl bg-white/5 border-2 border-violet-400/20 hover:border-violet-400/40 p-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition duration-300 backdrop-blur-xl hover:bg-white/10"
                />
              </div>

              {/* Speed */}
              <div>
                <label className="text-xs font-bold mb-3 text-violet-200/80 block uppercase tracking-widest">
                  Speed
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={1.0}
                  className="w-full rounded-xl bg-white/5 border-2 border-violet-400/20 hover:border-violet-400/40 p-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition duration-300 backdrop-blur-xl hover:bg-white/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scenes Section */}
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 text-white">
          <Film size={28} className="text-violet-400" />
          Video Scenes
        </h2>

        {/* Scenes Container */}
        <div className="space-y-4 mb-8">
          {scenes.map((scene, idx) => (
            <div
              key={idx}
              className="group bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 hover:border-violet-400/30 rounded-3xl p-8 backdrop-blur-xl transition duration-500 hover:shadow-2xl hover:shadow-violet-500/10"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-violet-400/30 flex items-center justify-center font-bold text-violet-300">
                    {idx + 1}
                  </div>
                  <h4 className="text-lg font-semibold text-white">Scene {idx + 1}</h4>
                </div>
                {scenes.length > 1 && (
                  <button
                    onClick={() => removeScene(idx)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 hover:border-red-400/60 transition duration-300 text-red-300 hover:text-red-200"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Dialogue */}
              <div className="mb-6">
                <label className="text-xs font-bold mb-3 text-violet-200/80 block uppercase tracking-widest">
                  Dialogue / Narration
                </label>
                <textarea
                  defaultValue={scene.dialogue}
                  placeholder="Enter the dialogue or narration for this scene..."
                  className="w-full min-h-[100px] p-4 rounded-xl bg-white/5 border-2 border-violet-400/20 hover:border-violet-400/40 text-white text-sm font-medium placeholder:text-violet-100/30 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition duration-300 backdrop-blur-xl resize-none hover:bg-white/10"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-xs font-bold mb-3 text-violet-200/80 block uppercase tracking-widest flex items-center gap-2">
                  <Upload size={16} /> Upload Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full text-white text-sm p-4 bg-white/5 border-2 border-dashed border-violet-400/30 hover:border-violet-400/60 rounded-xl transition duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-500/20 file:text-violet-200 hover:file:bg-violet-500/30"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Scene Button */}
        <button
          onClick={addScene}
          className="mb-10 px-8 py-4 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border-2 border-violet-400/40 hover:border-violet-400/80 hover:from-violet-500/30 hover:to-pink-500/30 rounded-xl font-bold flex items-center gap-3 transition duration-300 backdrop-blur-xl text-violet-300 hover:text-violet-200 uppercase tracking-wider"
        >
          <Plus size={20} />
          Add New Scene
        </button>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full mb-8 px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-600 hover:from-violet-400 hover:to-pink-500 disabled:from-violet-600 disabled:to-pink-700 rounded-xl font-bold flex items-center justify-center gap-3 transition duration-300 transform hover:scale-105 disabled:scale-100 shadow-2xl hover:shadow-violet-500/50 disabled:opacity-75 text-white uppercase tracking-wider relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition duration-300" />
          <div className="relative flex items-center gap-3">
            {isGenerating ? (
              <>
                <div className="animate-spin">
                  <Video size={22} />
                </div>
                Generating Video...
              </>
            ) : (
              <>
                <Video size={22} />
                Generate Video
              </>
            )}
          </div>
        </button>

        {/* Progress Section */}
        {progress > 0 && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-violet-300">Video Generation Progress</p>
              <span className="text-xs font-bold text-violet-300 font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2 border border-violet-400/20 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-pink-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-violet-500/50"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Video Preview Section */}
        {progress === 100 && (
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-violet-300 uppercase tracking-wide">
              <Film size={20} />
              Generated Video
            </h3>

            <div className="w-full mb-6 bg-black rounded-2xl overflow-hidden border border-white/10">
              <video
                controls
                className="w-full aspect-video bg-black"
              />
            </div>

            <button className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl font-bold flex items-center justify-center gap-3 transition duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/50 text-white uppercase tracking-wider">
              <Zap size={20} />
              Download Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

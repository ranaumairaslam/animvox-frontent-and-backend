// src/app/login/tool-dashboard/animated-videos/page.js

"use client";

import { useState } from "react";
import API from "@/lib/api";
import { Video, Plus, Trash2, Upload, Sparkles, Settings, Zap } from "lucide-react";

export default function AnimatedVideoTool() {
  const [story, setStory] = useState({
    scenes: [{ dialogue: "", background: null, characters: [] }],
  });
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voice, setVoice] = useState("female");
  const [language, setLanguage] = useState("ur");
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [error, setError] = useState("");

  const addScene = () =>
    setStory({
      scenes: [...story.scenes, { dialogue: "", background: null, characters: [] }],
    });

  const removeScene = (idx) =>
    setStory({ scenes: story.scenes.filter((_, i) => i !== idx) });

  const updateScene = (idx, field, value) => {
    const updated = [...story.scenes];
    updated[idx] = { ...updated[idx], [field]: value };
    setStory({ scenes: updated });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError("");
    setVideoUrl(null);
    const userId = localStorage.getItem("user_id");
    const formData = new FormData();
    formData.append("user_id", userId);

    story.scenes.forEach((scene, idx) => {
      formData.append(`scenes[${idx}][dialogue]`, scene.dialogue || "");
      if (scene.background) {
        formData.append(`scenes[${idx}][background]`, scene.background);
      }
      if (scene.characters) {
        Array.from(scene.characters).forEach((file) => {
          formData.append(`scenes[${idx}][characters]`, file);
        });
      }
    });

    try {
      const res = await API.generateAnimatedVideo(formData, voice, language);
      const newVideoId = res.data.video_id;
      setVideoId(newVideoId);

      const interval = setInterval(async () => {
        try {
          const prog = await API.getAnimatedVideoProgress(newVideoId);
          const p = prog.data.progress || 0;

          if (p === -1) {
            clearInterval(interval);
            setIsGenerating(false);
            setError("Video generation failed. Please try again.");
            return;
          }

          setProgress(p);

          if (p >= 100 || prog.data.status === "done") {
            clearInterval(interval);
            setIsGenerating(false);
            try {
              const blob = await API.downloadAnimatedVideo(newVideoId, userId);
              const url = URL.createObjectURL(blob.data);
              setVideoUrl(url);
            } catch {
              setError("Video ready but download failed. Please refresh.");
            }
          }
        } catch {
          clearInterval(interval);
          setIsGenerating(false);
          setError("Connection error during generation. Please try again.");
        }
      }, 3000);
    } catch {
      setIsGenerating(false);
      setError("Animation failed. Try again.");
    }
  };

  // Shared styles — solid bg-slate-800 ensures dropdown option text is always visible
  const selectClass =
    "w-full rounded-xl bg-slate-800 border-2 border-emerald-400/20 hover:border-emerald-400/40 p-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition duration-300 cursor-pointer hover:bg-slate-700 appearance-none";

  const chevronDown = (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-emerald-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-12 font-sans overflow-hidden relative">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10">
        {/* Back Button */}
        <a
          href="./"
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/50 text-blue-100 transition duration-300 backdrop-blur-sm group"
        >
          <span className="group-hover:-translate-x-1 transition duration-300">←</span> Back to Dashboard
        </a>

        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 border border-emerald-400/30 backdrop-blur-xl hover:from-emerald-500/50 hover:to-teal-600/50 transition duration-300">
              <div className="animate-bounce">
                <Sparkles size={32} className="text-emerald-300" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                AnimVox Studio
              </h1>
              <p className="text-emerald-200/70 text-sm md:text-base mt-2 font-light tracking-wider">
                Create stunning animated videos with AI characters and voiceover
              </p>
            </div>
          </div>
        </div>

        {/* Audio Settings Card */}
        <div className="mb-12">
          <div className="group bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-400/20 hover:border-emerald-400/50 rounded-3xl p-8 backdrop-blur-2xl transition duration-500 hover:shadow-2xl hover:shadow-emerald-500/20">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-emerald-300 uppercase tracking-wide">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Settings size={20} />
              </div>
              Audio Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice Type */}
              <div>
                <label className="text-xs font-bold mb-3 text-emerald-200/80 block uppercase tracking-widest">
                  Voice Type
                </label>
                <div className="relative">
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className={selectClass}
                  >
                    <option value="female" className="bg-slate-800 text-white">♀ Female</option>
                    <option value="male" className="bg-slate-800 text-white">♂ Male</option>
                    <option value="child" className="bg-slate-800 text-white">🧒 Child</option>
                    <option value="narrator" className="bg-slate-800 text-white">📢 Narrator</option>
                  </select>
                  {chevronDown}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs font-bold mb-3 text-emerald-200/80 block uppercase tracking-widest">
                  Language
                </label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={selectClass}
                  >
                    <option value="ur" className="bg-slate-800 text-white">🇵🇰 Urdu</option>
                    <option value="en" className="bg-slate-800 text-white">🇺🇸 English</option>
                  </select>
                  {chevronDown}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scenes Header */}
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 text-white">
          <Video size={28} className="text-emerald-400" />
          Animation Scenes
        </h2>

        {/* Scenes List */}
        <div className="space-y-4 mb-8">
          {story.scenes.map((scene, idx) => (
            <div
              key={idx}
              className="group bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 hover:border-emerald-400/30 rounded-3xl p-8 backdrop-blur-xl transition duration-500 hover:shadow-2xl hover:shadow-emerald-500/10"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-400/30 flex items-center justify-center font-bold text-emerald-300">
                    {idx + 1}
                  </div>
                  <h4 className="text-lg font-semibold text-white">Scene {idx + 1}</h4>
                </div>
                {story.scenes.length > 1 && (
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
                <label className="text-xs font-bold mb-3 text-emerald-200/80 block uppercase tracking-widest">
                  Dialogue / Narration
                </label>
                <textarea
                  value={scene.dialogue}
                  onChange={(e) => updateScene(idx, "dialogue", e.target.value)}
                  placeholder="Enter the dialogue or narration for this scene..."
                  className="w-full min-h-[100px] p-4 rounded-xl bg-slate-800 border-2 border-emerald-400/20 hover:border-emerald-400/40 text-white text-sm font-medium placeholder:text-emerald-100/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition duration-300 resize-none hover:bg-slate-700"
                />
              </div>

              {/* Background Image */}
              <div className="mb-6">
                <label className="text-xs font-bold mb-3 text-emerald-200/80 flex items-center gap-2 uppercase tracking-widest">
                  <Upload size={16} /> Background Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateScene(idx, "background", e.target.files[0])}
                  className="w-full text-white text-sm p-4 bg-slate-800 border-2 border-dashed border-emerald-400/30 hover:border-emerald-400/60 rounded-xl transition duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-200 hover:file:bg-emerald-500/30 cursor-pointer"
                />
                {scene.background && (
                  <p className="text-xs text-emerald-300/60 mt-2">
                    Selected: {scene.background.name}
                  </p>
                )}
              </div>

              {/* Character Images */}
              <div>
                <label className="text-xs font-bold mb-3 text-emerald-200/80 flex items-center gap-2 uppercase tracking-widest">
                  <Upload size={16} /> Character Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => updateScene(idx, "characters", e.target.files)}
                  className="w-full text-white text-sm p-4 bg-slate-800 border-2 border-dashed border-emerald-400/30 hover:border-emerald-400/60 rounded-xl transition duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-200 hover:file:bg-emerald-500/30 cursor-pointer"
                />
                {scene.characters && scene.characters.length > 0 && (
                  <p className="text-xs text-emerald-300/60 mt-2">
                    {scene.characters.length} file{scene.characters.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Scene */}
        <button
          onClick={addScene}
          className="mb-10 px-8 py-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/40 hover:border-emerald-400/80 hover:from-emerald-500/30 hover:to-teal-500/30 rounded-xl font-bold flex items-center gap-3 transition duration-300 backdrop-blur-xl text-emerald-300 hover:text-emerald-200 uppercase tracking-wider"
        >
          <Plus size={20} />
          Add New Scene
        </button>

        {/* Error */}
        {error && (
          <p className="text-red-400 mb-4 text-center font-medium bg-red-500/10 border border-red-500/30 rounded-xl py-3 px-4">
            ❌ {error}
          </p>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full mb-8 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-emerald-600 disabled:to-teal-700 rounded-xl font-bold flex items-center justify-center gap-3 transition duration-300 transform hover:scale-105 disabled:scale-100 shadow-2xl hover:shadow-emerald-500/50 disabled:opacity-75 text-white uppercase tracking-wider relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition duration-300" />
          <div className="relative flex items-center gap-3">
            {isGenerating ? (
              <>
                <div className="animate-spin"><Video size={22} /></div>
                Generating Animation...
              </>
            ) : (
              <>
                <Video size={22} />
                Generate Animated Video
              </>
            )}
          </div>
        </button>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-emerald-300">Video Generation Progress</p>
              <span className="text-xs font-bold text-emerald-300 font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2 border border-emerald-400/20 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/50"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Video Output */}
        {progress === 100 && videoUrl && (
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-emerald-300 uppercase tracking-wide">
              <Sparkles size={20} />
              Generated Animation
            </h3>
            <div className="w-full mb-6 bg-black rounded-2xl overflow-hidden border border-white/10">
              <video controls src={videoUrl} className="w-full aspect-video bg-black" />
            </div>
            <a
              href={videoUrl}
              download="animated_video.mp4"
              className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl font-bold flex items-center justify-center gap-3 transition duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/50 text-white uppercase tracking-wider"
            >
              <Zap size={20} />
              Download Animation
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-white/10 rounded-2xl p-6 backdrop-blur-xl text-center">
          <p className="text-emerald-100/60 text-sm font-light">
            ✨ Powered by Softcenteric
          </p>
        </div>
      </div>
    </div>
  );
}
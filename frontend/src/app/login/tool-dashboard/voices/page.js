"use client";

import { useState, useRef, useEffect } from "react";
import API from "@/lib/api";
import { useRouter } from "next/navigation";
import { Mic2, Volume2, Music, Settings, Play, Download } from "lucide-react";

export default function Voiceover() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("ur");
  const [voice, setVoice] = useState("");
  const [urduProfiles, setUrduProfiles] = useState([]);
  const [edgeVoices, setEdgeVoices] = useState([]);

  useEffect(() => {
    API.getVoices().then((res) => {
      const urdu = res.data.urdu_profiles || [];
      const edge = res.data.edge_voices || [];
      setUrduProfiles(urdu);
      setEdgeVoices(edge);
      if (urdu.length > 0) setVoice(urdu[0].name);
    }).catch(() => console.error("Voices load failed"));
  }, []);

  const [rate, setRate] = useState(120);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioId, setAudioId] = useState(null);
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (newLang === "ur") {
      if (urduProfiles.length > 0) setVoice(urduProfiles[0].name);
    } else {
      if (edgeVoices.length > 0) setVoice(edgeVoices[0].name);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setError("");
    setAudioUrl(null);

    const userId = localStorage.getItem("user_id");

    try {
      const res = await API.generateVoiceover({
        text,
        language,
        voice,
        rate: Number(rate),
        speed: Number(speed),
        volume: Number(volume),
        pitch: Number(pitch),
        user_id: userId,
      });

      const newAudioId = res.data.audio_id;
      setAudioId(newAudioId);

      const interval = setInterval(async () => {
        try {
          const prog = await API.getAudioProgress(newAudioId);
          const progress = prog.data.progress;

          if (progress === -1) {
            clearInterval(interval);
            setIsGenerating(false);
            setError("Audio generation failed. Please try again.");
            return;
          }

          if (progress >= 100) {
            clearInterval(interval);
            setIsGenerating(false);
            try {
              const blob = await API.downloadPublicVoiceover(newAudioId, userId);
              const url = URL.createObjectURL(blob.data);
              setAudioUrl(url);
            } catch (downloadErr) {
              setError("Audio ready but download failed. Please refresh.");
            }
          }
        } catch (pollErr) {
          clearInterval(interval);
          setIsGenerating(false);
          setError("Connection error. Please try again.");
        }
      }, 2000);

    } catch (genErr) {
      setIsGenerating(false);
      if (genErr?.response?.status === 403) {
        setError(genErr.response.data?.error || "Plan limit reached.");
      } else {
        setError("Generation failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-12 font-sans overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10">
        <a
          href="./"
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-blue-100 transition duration-300 backdrop-blur-sm group"
        >
          <span className="group-hover:-translate-x-1 transition duration-300">←</span> Back to Dashboard
        </a>

        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/30 backdrop-blur-xl group hover:from-cyan-500/50 hover:to-blue-600/50 transition duration-300">
              <div className="animate-bounce">
                <Mic2 size={32} className="text-cyan-300" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Voiceover Studio
              </h1>
              <p className="text-cyan-200/70 text-sm md:text-base mt-2 font-light tracking-wider">
                Next-Generation AI Voice Generation
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <label className="text-xs font-bold mb-3 text-cyan-300/90 flex items-center gap-2 uppercase tracking-widest">
            <Music size={16} className="animate-pulse" /> Script Input
          </label>
          <textarea
            placeholder="Enter your script here and watch the magic happen..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[160px] md:min-h-[200px] p-6 rounded-2xl bg-white/5 backdrop-blur-xl border-2 border-cyan-400/20 hover:border-cyan-400/40 text-white text-base md:text-lg placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400/80 transition duration-300 resize-none shadow-2xl hover:shadow-cyan-500/20"
          />
          <div className="flex justify-between items-center mt-3 px-2">
            <p className="text-xs text-cyan-100/40 font-light">
              Customize your voice settings and generate professional audio
            </p>
            <span className="text-xs text-cyan-300/60 font-mono">{text.length} characters</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="group bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-400/20 hover:border-cyan-400/50 rounded-3xl p-8 backdrop-blur-2xl transition duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-cyan-300 uppercase tracking-wide">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Settings size={20} />
              </div>
              Voice Settings
            </h3>

            <div className="mb-6">
              <label className="text-xs font-bold mb-3 text-cyan-200/80 block uppercase tracking-widest">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full rounded-xl bg-white/5 border-2 border-cyan-400/20 hover:border-cyan-400/40 p-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition duration-300 backdrop-blur-xl cursor-pointer hover:bg-white/10"
              >
                <option value="en">🇺🇸 English</option>
                <option value="ur">🇵🇰 Urdu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold mb-3 text-cyan-200/80 block uppercase tracking-widest">
                Voice Profile
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full rounded-xl bg-white/5 border-2 border-cyan-400/20 hover:border-cyan-400/40 p-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition duration-300 backdrop-blur-xl cursor-pointer hover:bg-white/10"
              >
                {language === "ur"
                  ? urduProfiles.map((v) => (
                      <option key={v.name} value={v.name}>♪ {v.name}</option>
                    ))
                  : edgeVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.gender === "Female" ? "♀" : "♂"} {v.shortName}
                      </option>
                    ))
                }
              </select>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-purple-500/10 to-blue-600/10 border border-purple-400/20 hover:border-purple-400/50 rounded-3xl p-8 backdrop-blur-2xl transition duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-purple-300 uppercase tracking-wide">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Volume2 size={20} />
              </div>
              Audio Controls
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold mb-2.5 text-purple-200/70 block uppercase tracking-widest">
                  Rate
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border-2 border-purple-400/20 hover:border-purple-400/40 p-3.5 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-300 backdrop-blur-xl hover:bg-white/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold mb-2.5 text-purple-200/70 block uppercase tracking-widest">
                  Speed
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border-2 border-purple-400/20 hover:border-purple-400/40 p-3.5 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-300 backdrop-blur-xl hover:bg-white/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold mb-2.5 text-purple-200/70 block uppercase tracking-widest">
                  Volume
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border-2 border-purple-400/20 hover:border-purple-400/40 p-3.5 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-300 backdrop-blur-xl hover:bg-white/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold mb-2.5 text-purple-200/70 block uppercase tracking-widest">
                  Pitch
                </label>
                <input
                  type="number"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border-2 border-purple-400/20 hover:border-purple-400/40 p-3.5 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-300 backdrop-blur-xl hover:bg-white/10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-cyan-600 disabled:to-blue-700 rounded-xl font-bold flex items-center justify-center gap-3 transition duration-300 transform hover:scale-105 disabled:scale-100 shadow-2xl hover:shadow-cyan-500/50 disabled:opacity-75 text-white uppercase tracking-wider relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition duration-300" />
            <div className="relative flex items-center gap-3">
              {isGenerating ? (
                <>
                  <div className="animate-spin"><Mic2 size={22} /></div>
                  Generating...
                </>
              ) : (
                <>
                  <Mic2 size={22} />
                  Generate Audio
                </>
              )}
            </div>
          </button>

          <button
            onClick={() => audioRef.current?.play()}
            disabled={!audioUrl}
            className="flex-1 sm:flex-none px-8 py-4 bg-white/5 border-2 border-purple-400/30 hover:border-purple-400/60 hover:bg-purple-500/10 rounded-xl font-bold flex items-center justify-center gap-3 transition duration-300 backdrop-blur-xl shadow-lg hover:shadow-purple-500/30 text-white uppercase tracking-wider group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={20} className="group-hover:scale-110 transition duration-300" />
            Preview
          </button>

          {audioUrl && (
            <a
              href={audioUrl}
              download="voiceover.mp3"
              className="flex-1 sm:flex-none px-8 py-4 bg-white/5 border-2 border-emerald-400/30 hover:border-emerald-400/60 hover:bg-emerald-500/10 rounded-xl font-bold flex items-center justify-center gap-3 transition duration-300 backdrop-blur-xl shadow-lg hover:shadow-emerald-500/30 text-white uppercase tracking-wider group"
            >
              <Download size={20} className="group-hover:scale-110 transition duration-300" />
              Download
            </a>
          )}
        </div>

        {error && (
          <p className="text-red-400 mt-3 mb-3 text-center font-medium bg-red-500/10 border border-red-500/30 rounded-xl py-3 px-4">
            ❌ {error}
          </p>
        )}

        {audioUrl && (
          <div className="mt-6 mb-6 p-6 rounded-2xl bg-white/5 border border-cyan-400/20">
            <p className="text-cyan-300 mb-3 font-bold">✅ Audio Ready!</p>
            <audio ref={audioRef} controls src={audioUrl} className="w-full" />
          </div>
        )}

        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6 backdrop-blur-xl text-center">
          <p className="text-cyan-100/60 text-sm font-light">
            ✨ Powered by Advanced AI Voice Generation Technology
          </p>
        </div>
      </div>
    </div>
  );
}
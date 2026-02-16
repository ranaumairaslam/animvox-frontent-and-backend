import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ================= BASE API CONFIG =================
const API_BASE = "http://localhost:9001";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ================= API FUNCTIONS =================
const getCinematicVoices = () => apiClient.get("/api/voices");

const previewVoice = (voice) => 
  apiClient.post("/api/preview_voice", { voice });

const uploadSceneImages = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append("images", file));
  const res = await apiClient.post("/upload_images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

const uploadBackgroundMusic = async (file) => {
  const formData = new FormData();
  formData.append("music", file);
  const res = await apiClient.post("/upload_music", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ✅ endpoint - /generate/static 
const generateStaticVideo = (data) => 
  apiClient.post("/generate/static", data);

// ✅ endpoint - /progress/static/{videoId}
const getStaticVideoProgress = (videoId) => 
  apiClient.get(`/progress/static/${videoId}`);

export default function Static() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [scriptText, setScriptText] = useState("");
  const [voice, setVoice] = useState("en-US-DavisNeural");
  const [rate, setRate] = useState("-5%");
  const [addMusic, setAddMusic] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.15);
  const [sceneImages, setSceneImages] = useState([]);
  const [musicFile, setMusicFile] = useState(null);
  const [voices, setVoices] = useState({});
  const [previewAudio, setPreviewAudio] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // ✅  URLs pointing to port 9001 (main.py)
  const videoUrl = videoId
    ? `http://localhost:9001/public/static/${userId}/${videoId}.mp4`
    : null;

  const downloadUrl = videoId
    ? `http://localhost:9001/download/static/${videoId}/${userId}`
    : null;

  useEffect(() => {
    getCinematicVoices()
      .then(res => setVoices(res.data))
      .catch(err => {
        console.error("Failed to load voices:", err);
        setError("Failed to load voices. Please refresh the page.");
      });
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePreviewVoice = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const result = await previewVoice(voice);
      // ✅ preview URL from main.py
      const audioUrl = `http://localhost:9001${result.data.preview_url}`;
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setPreviewAudio(audioUrl);
    } catch (err) {
      console.error("Preview failed:", err);
      setError("Failed to preview voice");
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const result = await uploadSceneImages(files);
      setSceneImages(result.files);
      alert(`✅ Uploaded ${result.files.length} images`);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload images");
    }
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await uploadBackgroundMusic(file);
      setMusicFile(result.file);
      alert("✅ Music uploaded successfully");
    } catch (err) {
      console.error("Music upload error:", err);
      setError("Failed to upload music");
    }
  };

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    setVideoId(null);
    setProgress(0);

    if (!userId) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    if (!scriptText.trim()) {
      setError("Please enter a script");
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        script_text: scriptText,
        voice,
        rate,
        add_music: addMusic,
        music_file: musicFile, // Will be the filename from upload
        music_volume: musicVolume,
      };

      console.log("📤 Sending request:", requestData);
      const res = await generateStaticVideo(requestData);
      console.log("📥 Response:", res.data);
      
      const newVideoId = res.data.video_id;
      setVideoId(newVideoId);
      setProgress(0);

      if (intervalRef.current) clearInterval(intervalRef.current);

      // Poll for progress every 2 seconds
      intervalRef.current = setInterval(async () => {
        try {
          const progRes = await getStaticVideoProgress(newVideoId);
          const p = progRes.data.progress || 0;
          setProgress(p);
          
          console.log("📊 Progress:", p);
          
          if (p >= 100) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setLoading(false);
            console.log("✅ Video generation complete!");
          } else if (p < 0) {
            // Error occurred
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setLoading(false);
            setError("Video generation failed");
          }
        } catch (err) {
          console.error("Progress check failed:", err);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setLoading(false);
        }
      }, 2000);
    } catch (err) {
      console.error("❌ Video generation error:", err);
      setError(err.response?.data?.error || err.message || "Video generation failed");
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <button className="back-button" onClick={() => navigate("/")}>
        ← Back to Dashboard
      </button>

      <h1 className="page-title">🎬 Cinematic Static Video Generator</h1>

      {error && <div className="error-box">❌ {error}</div>}

      <div className="form-group">
        <label className="form-label">📝 Video Script *</label>
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          className="textarea"
          rows={10}
          placeholder="Scene 1&#10;Your narration text here...&#10;&#10;Scene 2&#10;More narration..."
        />
        <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px'}}>
          💡 Separate scenes with "Scene 1", "Scene 2", etc.
        </small>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">🎤 Voice</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="input"
          >
            {Object.entries(voices).map(([category, voiceList]) => (
              <optgroup key={category} label={category}>
                {Object.entries(voiceList).map(([name, code]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button onClick={handlePreviewVoice} className="preview-button">
            🎧 Preview Voice
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">⚡ Speech Rate</label>
          <select
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="input"
          >
            <option value="-20%">Very Slow</option>
            <option value="-10%">Slow</option>
            <option value="-5%">Slightly Slow (Recommended)</option>
            <option value="+0%">Normal</option>
            <option value="+10%">Fast</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">📸 Scene Images (numbered: 1.jpg, 2.jpg, etc.)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="input"
        />
        {sceneImages.length > 0 && (
          <small style={{color: '#4caf50', display: 'block', marginTop: '5px'}}>
            ✓ {sceneImages.length} images uploaded
          </small>
        )}
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={addMusic}
            onChange={(e) => setAddMusic(e.target.checked)}
          />
          {' '}🎵 Add Background Music
        </label>
        
        {addMusic && (
          <div style={{marginTop: '10px', paddingLeft: '20px'}}>
            <input
              type="file"
              accept="audio/*"
              onChange={handleMusicUpload}
              className="input"
            />
            
            {musicFile && (
              <small style={{color: '#4caf50', display: 'block', marginTop: '5px'}}>
                ✓ Music uploaded: {musicFile}
              </small>
            )}
            
            <div style={{marginTop: '10px'}}>
              <label className="form-label">🔊 Music Volume: {musicVolume.toFixed(2)}</label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                style={{width: '100%'}}
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        className="generate-button"
        disabled={loading}
      >
        {loading ? "⏳ Generating..." : "🎬 Generate Cinematic Video"}
      </button>

      {videoId && (
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.floor(progress)}%` }}
          />
          <span className="progress-text">{Math.floor(progress)}%</span>
        </div>
      )}

      {videoId && progress >= 100 && (
        <div className="result-box">
          <h3>✅ Video Generated Successfully!</h3>

          <video
            src={videoUrl}
            controls
            className="video-player"
          />

          <a
            href={downloadUrl}
            className="download-button"
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            📥 Download Video
          </a>
        </div>
      )}

      <style>{`
        .page-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        .back-button {
          margin-bottom: 20px;
          padding: 10px 20px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .back-button:hover {
          background-color: #1976D2;
        }
        .page-title {
          font-size: 28px;
          margin-bottom: 30px;
          color: #333;
          font-weight: 700;
        }
        .error-box {
          color: #f44336;
          padding: 15px;
          background-color: #ffebee;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 4px solid #f44336;
          font-weight: 500;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #555;
          font-size: 14px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: #555;
          cursor: pointer;
          font-size: 14px;
        }
        .checkbox-label input {
          margin-right: 8px;
          cursor: pointer;
          width: 18px;
          height: 18px;
        }
        .input, .textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .input:focus, .textarea:focus {
          outline: none;
          border-color: #2196F3;
        }
        .textarea {
          font-family: 'Courier New', monospace;
          resize: vertical;
          line-height: 1.5;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .preview-button {
          margin-top: 10px;
          padding: 8px 16px;
          background-color: #9C27B0;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .preview-button:hover {
          background-color: #7B1FA2;
        }
        .generate-button {
          width: 100%;
          padding: 15px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          transition: background-color 0.2s;
        }
        .generate-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .generate-button:hover:not(:disabled) {
          background-color: #45a049;
        }
        .progress-bar-container {
          margin-top: 20px;
          width: 100%;
          background-color: #e0e0e0;
          border-radius: 8px;
          position: relative;
          height: 30px;
          overflow: hidden;
        }
        .progress-bar-fill {
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          height: 100%;
          border-radius: 8px;
          transition: width 0.3s ease;
        }
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: bold;
          color: #000;
          text-shadow: 0 0 3px white;
          font-size: 14px;
        }
        .result-box {
          margin-top: 30px;
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 8px;
          text-align: center;
          border: 2px solid #4CAF50;
        }
        .result-box h3 {
          color: #4CAF50;
          margin-bottom: 15px;
          font-size: 20px;
        }
        .video-player {
          width: 100%;
          max-width: 720px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin: 15px 0;
        }
        .download-button {
          display: inline-block;
          margin-top: 15px;
          padding: 12px 24px;
          background-color: #2196F3;
          color: white;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .download-button:hover {
          background-color: #1976D2;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .page-container {
            padding: 15px;
          }
          .page-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

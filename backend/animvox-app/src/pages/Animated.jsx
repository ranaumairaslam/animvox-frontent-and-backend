import { useState } from "react";
import {
  generateAnimatedVideo,
  getAnimatedVideoProgress,
} from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Animated() {
  const navigate = useNavigate();

  const [story, setStory] = useState({
    scenes: [{ dialogue: "", background: null, characters: [] }]
  });
  const [videoId, setVideoId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [voice, setVoice] = useState("female");
  const [language, setLanguage] = useState("ur");
  const [generating, setGenerating] = useState(false);

  const handleSceneChange = (index, field, value) => {
    const updated = [...story.scenes];
    updated[index][field] = value;
    setStory({ scenes: updated });
  };

  const handleFileChange = (index, field, files) => {
    const updated = [...story.scenes];
    if (field === "background") {
      updated[index][field] = files[0] || null;
    } else if (field === "characters") {
      updated[index][field] = Array.from(files);
    }
    setStory({ scenes: updated });
  };

  const addScene = () =>
    setStory({
      scenes: [...story.scenes, { dialogue: "", background: null, characters: [] }]
    });

  const removeScene = (index) =>
    setStory({ scenes: story.scenes.filter((_, i) => i !== index) });

  const handleGenerate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to generate videos!");
      navigate("/login");
      return;
    }

    setError("");
    setProgress(0);
    setVideoId(null);
    setGenerating(true);

    try {
      const storyWithVoice = {
        scenes: story.scenes.map((scene) => ({
          ...scene,
          voice: voice,
          tts_lang: language,
        }))
      };

      const formData = new FormData();
      formData.append("story", JSON.stringify(storyWithVoice));

      storyWithVoice.scenes.forEach((scene, idx) => {
        if (scene.background) {
          formData.append(`scenes[${idx}][background]`, scene.background);
        }
        scene.characters.forEach((file) => {
          formData.append(`scenes[${idx}][characters][]`, file);
        });
      });

      const res = await generateAnimatedVideo(formData);

      // Handle axios response format
      const data = res.data || res;
      
      if (data.error) {
        setError("Error: " + data.error);
        setGenerating(false);
        return;
      }

      const vid = data.video_id;
      if (!vid) {
        setError("Server did not return a video_id. Please try again.");
        setGenerating(false);
        return;
      }

      setVideoId(vid);

      // Poll progress every 2 seconds
      const interval = setInterval(async () => {
        try {
          const pRes = await getAnimatedVideoProgress(vid);
          const progressData = pRes.data || pRes;
          const p = typeof progressData.progress === "number" ? progressData.progress : 0;
          
          setProgress(p);
          
          // Stop polling when complete or failed
          if (p >= 100) {
            clearInterval(interval);
            setGenerating(false);
          } else if (p < 0) {
            clearInterval(interval);
            setGenerating(false);
            setError("Video generation failed. Please try again.");
          }
        } catch (err) {
          clearInterval(interval);
          setGenerating(false);
          setError("Failed to fetch progress: " + err.message);
        }
      }, 2000);

    } catch (err) {
      setError(err.message || "Video generation failed. Please try again.");
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("token");
    
    if (!userId) {
      setError("User ID not found. Please logout and login again.");
      return;
    }

    // Direct download using link with token in URL
    const downloadUrl = `http://localhost:9001/download/animated/${videoId}/${userId}?token=${token}`;
    
    // Create invisible link and click it
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `animated_${videoId}.mp4`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <button
        className="back-button"
        onClick={() => navigate("/")}
        style={{ marginBottom: "20px", padding: "8px 16px", borderRadius: "6px" }}
      >
        &larr; Back to Dashboard
      </button>

      <h1 className="page-title" style={{ textAlign: "center", marginBottom: "20px" }}>
        AnimVox Animated Videos
      </h1>

      {error && (
        <div style={{ 
          color: "red", 
          marginBottom: "10px", 
          padding: "10px", 
          backgroundColor: "#ffe6e6", 
          borderRadius: "6px",
          border: "1px solid red"
        }}>
          {error}
        </div>
      )}

      <div
        className="voice-language-box"
        style={{ display: "flex", gap: "20px", marginBottom: "20px", alignItems: "center" }}
      >
        <div>
          <label>Voice:</label>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} style={{ marginLeft: "8px" }}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>

        <div>
          <label>Language:</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ marginLeft: "8px" }}>
            <option value="ur">Urdu</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {story.scenes.map((scene, idx) => (
        <div
          key={idx}
          className="scene-box"
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "15px",
            backgroundColor: "#140404ff"
          }}
        >
          <h3>Scene {idx + 1}</h3>

          <label>Dialogue:</label>
          <textarea
            value={scene.dialogue}
            onChange={(e) => handleSceneChange(idx, "dialogue", e.target.value)}
            style={{ width: "100%", minHeight: "60px", marginBottom: "10px", padding: "8px" }}
          />

          <label>Background Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(idx, "background", e.target.files)}
            style={{ display: "block", marginBottom: "10px" }}
          />

          <label>Character Images:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileChange(idx, "characters", e.target.files)}
            style={{ display: "block", marginBottom: "10px" }}
          />

          <button
            onClick={() => removeScene(idx)}
            style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "#ff4d4f", color: "#fff" }}
          >
            Remove Scene
          </button>
        </div>
      ))}

      <button
        onClick={addScene}
        style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#1890ff", color: "#fff", marginBottom: "20px" }}
      >
        + Add Scene
      </button>

      <br />

      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          padding: "10px 20px",
          borderRadius: "6px",
          backgroundColor: generating ? "#888" : "#52c41a",
          color: "#fff",
          fontWeight: "bold",
          cursor: generating ? "not-allowed" : "pointer"
        }}
      >
        {generating ? "Generating..." : "Generate Video"}
      </button>

      {videoId && (
        <div
          className="progress-box"
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#f0f5ff13"
          }}
        >
          <p style={{ marginBottom: "8px" }}>
            {progress >= 100 ? "Video Ready!" : `Generating Video: ${progress}%`}
          </p>

          <div style={{
            width: "100%",
            backgroundColor: "#333",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "12px",
            height: "22px"
          }}>
            <div style={{
              width: `${progress}%`,
              backgroundColor: progress >= 100 ? "#52c41a" : "#1890ff",
              height: "100%",
              transition: "width 0.5s ease",
              borderRadius: "8px"
            }} />
          </div>

          {progress >= 100 && (
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                backgroundColor: "#52c41a",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Download Video
            </button>
          )}
        </div>
      )}
    </div>
  );
}

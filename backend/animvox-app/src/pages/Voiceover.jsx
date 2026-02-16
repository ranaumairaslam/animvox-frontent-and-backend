import { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

// Urdu voice profiles (matching backend)
const URDU_PROFILES = [
  "Narrator",
  "Child (Boy)",
  "Child (Girl)",
  "Elder",
  "Hero",
  "Villain",
  "Mother",
  "Emotion",
  "Neutral",
  "Happy",
  "Sad",
  "Angry",
];

export default function Voiceover() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [voice, setVoice] = useState("male");
  const [rate, setRate] = useState(118);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [audioList, setAudioList] = useState([]);
  const [voiceOptions, setVoiceOptions] = useState([]);

  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const userId = localStorage.getItem("user_id");

  // Fetch user's audio list on mount
  useEffect(() => {
    if (userId) fetchUserAudio();
  }, [userId]);

  // Fetch available Edge-TTS voices from backend
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await API.getVoices(); // backend /voices endpoint
        setVoiceOptions(res.data);
      } catch (err) {
        console.error("Failed to fetch voices:", err);
        setError("Failed to load voice options. Using defaults.");
      }
    };
    fetchVoices();
  }, []);

  // Update voice when language changes
  useEffect(() => {
    if (language === "ur") {
      // Set default Urdu profile
      setVoice("Narrator");
    } else {
      // Set default Edge-TTS voice for selected language
      if (voiceOptions.length > 0) {
        const filtered = voiceOptions.filter((v) => 
          v.locale && v.locale.startsWith(language)
        );
        if (filtered.length > 0) {
          setVoice(filtered[0].shortName);
        } else {
          // Fallback to first available voice
          setVoice(voiceOptions[0].shortName);
        }
      } else {
        // Fallback for old voice system
        setVoice("male");
      }
    }
  }, [language, voiceOptions]);

  const fetchUserAudio = async () => {
    try {
      const res = await API.fetchUserVoiceovers(userId);
      setAudioList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch user audio error:", err);
      setError("Failed to load audio data.");
    }
  };

  const waitForAudioReady = async (audio_id) => {
    let progress = 0;
    let attempts = 0;
    const maxAttempts = 120; // 60 seconds timeout

    while (progress < 100 && attempts < maxAttempts) {
      try {
        const res = await API.getAudioProgress(audio_id); // hits /progress/:id
        progress = res.data.progress;

        if (progress === -1) {
          throw new Error("Audio generation failed on server");
        }
      } catch (err) {
        console.error("Error checking audio progress:", err);
        throw err;
      }

      if (progress < 100) {
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error("Audio generation timeout");
    }
  };

  const handleGenerate = async () => {
    if (!userId) {
      alert("You need to login/signup to generate audio!");
      navigate("/login");
      return;
    }
    if (!text.trim()) {
      setError("Please enter some text to generate audio.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Call the async generation endpoint with user_id
      const res = await API.generateVoiceover({
        text,
        language,
        voice,
        rate,
        speed,
        volume,
        pitch,
        user_id: userId,
      });

      const audio_id = res.data.audio_id;

      // Wait for backend to finish generating
      await waitForAudioReady(audio_id);

      // Correct URL format: /public/voiceover/{user_id}/{audio_id}.mp3
      const url = `http://127.0.0.1:9001/public/voiceover/${userId}/${audio_id}.mp3`;

      setAudioUrl(url);

      // Refresh user's audio list
      fetchUserAudio();

      // Auto-play the generated audio
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err.message || "Audio generation failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Get voice options based on selected language
  const getVoiceOptionsForLanguage = () => {
    if (language === "ur") {
      // Return Urdu profiles
      return URDU_PROFILES.map((profile) => ({
        value: profile,
        label: profile,
      }));
    } else {
      // Return Edge-TTS voices filtered by language
      const filtered = voiceOptions.filter((v) => {
        // Handle both full locale (e.g., "en-US") and language code (e.g., "en")
        return v.locale && v.locale.startsWith(language);
      });

      if (filtered.length > 0) {
        return filtered.map((v) => ({
          value: v.shortName,
          label: v.name,
        }));
      }

      // Fallback to legacy voice options if no Edge-TTS voices available
      return [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ];
    }
  };

  const currentVoiceOptions = getVoiceOptionsForLanguage();

  return (
    <div className="page-container">
      <button className="back-button" onClick={() => navigate("/")}>
        Back to Dashboard
      </button>

      <h1 className="page-title">Voiceover Tool</h1>

      {error && <div className="error-text">{error}</div>}

      <textarea
        placeholder="Enter text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="textarea"
      />

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input"
          >
            <option value="en">English</option>
            <option value="ur">Urdu</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Voice</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="input"
          >
            {currentVoiceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Rate</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="input"
            min="50"
            max="200"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Speed</label>
          <input
            type="number"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="input"
            min="0.5"
            max="2.0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Volume</label>
          <input
            type="number"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="input"
            min="0.0"
            max="2.0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Pitch</label>
          <input
            type="number"
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="input"
            min="-12"
            max="12"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="generate-button"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Audio"}
      </button>

      <div className="content-grid">
        {audioList.map((audio) => {
          // Correct audio URL format
          const audioSrc = `http://127.0.0.1:9001/public/voiceover/${userId}/${audio.audio_id}.mp3`;
          return (
            <div key={audio.audio_id} className="content-card">
              <p className="video-title">
                Tool: Voiceover | Created:{" "}
                {audio.created_at
                  ? new Date(audio.created_at + "Z").toLocaleString()
                  : "Unknown"}
              </p>
              <audio controls src={audioSrc}></audio>
              <a
                href={audioSrc}
                download={`voiceover_${audio.audio_id}.mp3`}
                className="download-button"
              >
                Download Audio
              </a>
            </div>
          );
        })}
      </div>

      {audioUrl && (
        <div className="progress-box">
          <p>Playing latest generated audio</p>
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
}

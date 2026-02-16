import axios from "axios";

// ================= BASE AXIOS INSTANCES =================
// Main backend (all routes now on port 9001)
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:9001",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ================= AUTH =================
export const login = async (data) => {
  try {
    const res = await apiClient.post("/login", data);
    if (res.data.token) localStorage.setItem("token", res.data.token);
    if (res.data.user_id) localStorage.setItem("user_id", res.data.user_id);
    return res;
  } catch (err) {
    throw err;
  }
};

export const signup = async (data) => {
  try {
    const res = await apiClient.post("/signup", data);
    if (res.data.token) localStorage.setItem("token", res.data.token);
    if (res.data.user_id) localStorage.setItem("user_id", res.data.user_id);
    return res;
  } catch (err) {
    throw err;
  }
};

export const getProfile = () => apiClient.get("/user/profile");
export const updateProfile = (data) =>
  apiClient.put("/user/profile", data);


// ================= DASHBOARD =================
export const fetchUserVideos = () => apiClient.get("/user/videos");
export const deleteVideo = (videoId) => apiClient.delete(`/user/videos/${videoId}`);

// ================= VOICEOVER =================
// Get available voices (Edge-TTS voices list)
export const getVoices = () =>
  apiClient.get("/voices");

// Generate voiceover (async with user_id tracking)
export const generateVoiceover = (data) =>
  apiClient.post("/internal/voiceover", data);

// Fetch user's voiceover list
export const fetchUserVoiceovers = (userId) =>
  apiClient.get(`/public/voiceover/${userId}`);

// Download specific voiceover file
export const downloadPublicVoiceover = (audioId, userId) =>
  apiClient.get(`/public/voiceover/${userId}/${audioId}.mp3`, { responseType: "blob" });

// Get audio generation progress
export const getAudioProgress = (audioId) =>
  apiClient.get(`/progress/${audioId}`);

// ================= STATIC VIDEO =================
export const generateStaticVideo = (formData) =>
  apiClient.post("/generate/static", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const getStaticVideoProgress = (videoId) =>
  apiClient.get(`/progress/static/${videoId}`);

export const downloadStaticVideo = (videoId, userId) =>
  apiClient.get(`/download/static/${videoId}/${userId}`, { responseType: "blob" });

// ================= ANIMATED VIDEO =================
export const generateAnimatedVideo = (formData, voice = "female", language = "ur") => {
  formData.append("tts_voice", voice);
  formData.append("tts_lang", language);

  return apiClient.post("/generate/animated", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getAnimatedVideoProgress = (videoId) =>
  apiClient.get(`/progress/animated/${videoId}`);

export const downloadAnimatedVideo = (videoId, userId) =>
  apiClient.get(`/download/animated/${videoId}/${userId}`, { responseType: "blob" });

// ================= DEFAULT EXPORT =================
const API = {
  login,
  signup,
  getProfile,
  fetchUserVideos,
  deleteVideo,
  updateProfile,
  generateVoiceover,
  fetchUserVoiceovers,
  downloadPublicVoiceover,
  getAudioProgress,
  getVoices,
  generateStaticVideo,
  getStaticVideoProgress,
  downloadStaticVideo,
  generateAnimatedVideo,
  getAnimatedVideoProgress,
  downloadAnimatedVideo,
};

export default API;
import axios from "axios";

// ================= BASE AXIOS INSTANCES =================
// Main backend (all routes on port 9001)
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:9001",
  headers: { "Content-Type": "application/json" },
});

// Automatically attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ================= AUTH =================

/**
 * Login - send email and password
 * Backend: POST /login
 * Response contains token, user_id, and role
 */
export const login = async (data) => {
  try {
    const res = await apiClient.post("/login", data);
    if (res.data.token) localStorage.setItem("token", res.data.token);
    if (res.data.user_id) localStorage.setItem("user_id", res.data.user_id);
    if (res.data.role) localStorage.setItem("role", res.data.role);
    return res;
  } catch (err) {
    throw err;
  }
};

/**
 * Signup - send username, email, password
 * Backend: POST /signup
 */
export const signup = async (data) => {
  try {
    const res = await apiClient.post("/signup", data);
    if (res.data.token) localStorage.setItem("token", res.data.token);
    if (res.data.user_id) localStorage.setItem("user_id", res.data.user_id);
    if (res.data.role) localStorage.setItem("role", res.data.role);
    return res;
  } catch (err) {
    throw err;
  }
};

// ================= USER PROFILE =================

/**
 * Get own profile - user is identified via token
 * Backend: GET /user/profile
 */
export const getProfile = () => apiClient.get("/user/profile");

/**
 * Update profile - send name, mobile
 * Backend: PUT /user/profile
 */
export const updateProfile = (data) => apiClient.put("/user/profile", data);

// ================= USER VIDEOS (Dashboard) =================

/**
 * Get list of videos created by the user
 * Backend: GET /user/videos
 */
export const fetchUserVideos = () => apiClient.get("/user/videos");

/**
 * Delete a specific video
 * Backend: DELETE /user/videos/:videoId
 */
export const deleteVideo = (videoId) => apiClient.delete(`/user/videos/${videoId}`);

// ================= VOICEOVER =================

/**
 * Get available voices list (Urdu profiles + Edge-TTS voices)
 * Backend: GET /voices
 * Response: { urdu_profiles: [...], edge_voices: [...] }
 */
export const getVoices = () => apiClient.get("/voices");

/**
 * Generate voiceover (async - takes time)
 * Backend: POST /internal/voiceover
 * Data: { text, language, voice, rate, speed, volume, pitch, user_id }
 */
export const generateVoiceover = (data) =>
  apiClient.post("/internal/voiceover", data);

/**
 * Get all voiceovers for a user
 * Backend: GET /public/voiceover/:userId
 */
export const fetchUserVoiceovers = (userId) =>
  apiClient.get(`/public/voiceover/${userId}`);

/**
 * Download voiceover MP3 (as blob)
 * Backend: GET /public/voiceover/:userId/:audioId.mp3
 */
export const downloadPublicVoiceover = (audioId, userId) =>
  apiClient.get(`/public/voiceover/${userId}/${audioId}.mp3`, {
    responseType: "blob",
  });

/**
 * Check voiceover generation progress
 * Backend: GET /progress/:audioId
 * Response: { status, progress } - status "done" when progress reaches 100
 */
export const getAudioProgress = (audioId) =>
  apiClient.get(`/progress/${audioId}`);

// ================= STATIC VIDEO =================

/**
 * Generate static video (images + voiceover)
 * Backend: POST /generate/static
 * FormData: user_id, language, voice, tts_rate, pitch, speed, scenes[0][dialogue], scenes[0][images]
 */
export const generateStaticVideo = (formData) =>
  apiClient.post("/generate/static", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/**
 * Check static video generation progress
 * Backend: GET /progress/static/:videoId
 */
export const getStaticVideoProgress = (videoId) =>
  apiClient.get(`/progress/static/${videoId}`);

/**
 * Download static video (as blob)
 * Backend: GET /download/static/:videoId/:userId
 */
export const downloadStaticVideo = (videoId, userId) =>
  apiClient.get(`/download/static/${videoId}/${userId}`, {
    responseType: "blob",
  });

// ================= ANIMATED VIDEO =================

/**
 * Generate animated video (characters + background + voiceover)
 * Backend: POST /generate/animated
 * FormData: user_id, tts_voice, tts_lang, scenes[0][dialogue], scenes[0][background], scenes[0][characters]
 */
export const generateAnimatedVideo = (formData, voice = "female", language = "ur") => {
  formData.append("tts_voice", voice);
  formData.append("tts_lang", language);
  return apiClient.post("/generate/animated", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Check animated video generation progress
 * Backend: GET /progress/animated/:videoId
 */
export const getAnimatedVideoProgress = (videoId) =>
  apiClient.get(`/progress/animated/${videoId}`);

/**
 * Download animated video (as blob)
 * Backend: GET /download/animated/:videoId/:userId
 */
export const downloadAnimatedVideo = (videoId, userId) =>
  apiClient.get(`/download/animated/${videoId}/${userId}`, {
    responseType: "blob",
  });

// ================= ADMIN APIS =================
// All routes below are admin-only - backend verifies admin token

/**
 * Admin login - separate route from regular login
 * Backend: POST /admin/login
 * Data: { email, password }
 */
export const adminLogin = async (data) => {
  try {
    const res = await apiClient.post("/admin/login", data);
    if (res.data.token) localStorage.setItem("token", res.data.token);
    return res;
  } catch (err) {
    throw err;
  }
};

/**
 * Admin: Get list of all users
 * Backend: GET /admin/users
 * Response: [ { id, email, name, mobile, plan, role, created_at, suspend, total_videos } ]
 */
export const adminFetchUsers = () => apiClient.get("/admin/users");

/**
 * Admin: Update a user's plan or suspend status
 * Backend: PATCH /admin/users/:userId
 * Data: { plan?, suspend? }
 */
export const adminUpdateUser = (userId, data) =>
  apiClient.patch(`/admin/users/${userId}`, data);

/**
 * Admin: Reset a user's password (generates a random temporary password)
 * Backend: POST /admin/users/:userId/reset_password
 * Response: { status, temp_password }
 */
export const adminResetPassword = (userId) =>
  apiClient.post(`/admin/users/${userId}/reset_password`);

/**
 * Admin: Update multiple users' plans at once
 * Backend: POST /admin/users/bulk_update_plan
 * Data: { user_ids: [id1, id2], plan: "Pro" }
 */
export const adminBulkUpdatePlan = (data) =>
  apiClient.post("/admin/users/bulk_update_plan", data);

/**
 * Admin: Get list of all plans
 * Backend: GET /admin/plans
 * Response: [ { id, name, tool1_videos, tool2_videos, tool3_videos, price } ]
 */
export const adminFetchPlans = () => apiClient.get("/admin/plans");

/**
 * Admin: Create a new plan
 * Backend: POST /admin/plans
 * Data: { name, tool1_videos, tool2_videos, tool3_videos, price }
 */
export const adminCreatePlan = (data) => apiClient.post("/admin/plans", data);

/**
 * Admin: Update an existing plan
 * Backend: PATCH /admin/plans/:planId
 */
export const adminUpdatePlan = (planId, data) =>
  apiClient.patch(`/admin/plans/${planId}`, data);

/**
 * Admin: Delete a plan
 * Backend: DELETE /admin/plans/:planId
 */
export const adminDeletePlan = (planId) =>
  apiClient.delete(`/admin/plans/${planId}`);

/**
 * Admin: View usage stats (who created how many videos)
 * Backend: GET /admin/usage
 */
export const adminFetchUsage = () => apiClient.get("/admin/usage");

/**
 * Admin: Get all videos
 * Backend: GET /admin/videos
 */
export const adminFetchVideos = () => apiClient.get("/admin/videos");

/**
 * Admin: Delete a specific video
 * Backend: DELETE /admin/videos/:videoId
 */
export const adminDeleteVideo = (videoId) =>
  apiClient.delete(`/admin/videos/${videoId}`);

/**
 * Admin: View system health (CPU, RAM, Disk, Queue)
 * Backend: GET /admin/system_health
 */
export const adminSystemHealth = () => apiClient.get("/admin/system_health");

/**
 * Admin: Export users as CSV
 * Backend: GET /admin/users/export_csv
 */
export const adminExportUsersCsv = () =>
  apiClient.get("/admin/users/export_csv", { responseType: "blob" });

/**
 * Admin: View audit logs
 * Backend: GET /admin/logs
 */
export const adminFetchLogs = () => apiClient.get("/admin/logs");

// ================= DEFAULT EXPORT =================
const API = {
  // Auth
  login,
  signup,
  // User
  getProfile,
  updateProfile,
  fetchUserVideos,
  deleteVideo,
  // Voiceover
  getVoices,
  generateVoiceover,
  fetchUserVoiceovers,
  downloadPublicVoiceover,
  getAudioProgress,
  // Static Video
  generateStaticVideo,
  getStaticVideoProgress,
  downloadStaticVideo,
  // Animated Video
  generateAnimatedVideo,
  getAnimatedVideoProgress,
  downloadAnimatedVideo,
  // Admin
  adminLogin,
  adminFetchUsers,
  adminUpdateUser,
  adminResetPassword,
  adminBulkUpdatePlan,
  adminFetchPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  adminFetchUsage,
  adminFetchVideos,
  adminDeleteVideo,
  adminSystemHealth,
  adminExportUsersCsv,
  adminFetchLogs,
};

export default API;
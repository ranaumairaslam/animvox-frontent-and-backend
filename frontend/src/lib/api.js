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
 * Login karo - email aur password bhejo
 * Backend: POST /login
 * Response mein token, user_id, aur role milta hai
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
 * Signup karo - username, email, password bhejo
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
 * Apna profile dekho - token se user pehchana jaata hai
 * Backend: GET /user/profile
 */
export const getProfile = () => apiClient.get("/user/profile");

/**
 * Profile update karo - name, mobile bhejo
 * Backend: PUT /user/profile
 */
export const updateProfile = (data) => apiClient.put("/user/profile", data);

// ================= USER VIDEOS (Dashboard) =================

/**
 * Apni banai videos ki list lo
 * Backend: GET /user/videos
 */
export const fetchUserVideos = () => apiClient.get("/user/videos");

/**
 * Koi video delete karo
 * Backend: DELETE /user/videos/:videoId
 */
export const deleteVideo = (videoId) => apiClient.delete(`/user/videos/${videoId}`);

// ================= VOICEOVER =================

/**
 * Available voices list lo (Edge-TTS)
 * Backend: GET /voices
 */
export const getVoices = () => apiClient.get("/voices");

/**
 * Voiceover generate karo (async - time lagta hai)
 * Backend: POST /internal/voiceover
 * Data: { text, language, voice, rate, speed, volume, pitch, user_id }
 */
export const generateVoiceover = (data) =>
  apiClient.post("/internal/voiceover", data);

/**
 * User ki saari voiceovers dekho
 * Backend: GET /public/voiceover/:userId
 */
export const fetchUserVoiceovers = (userId) =>
  apiClient.get(`/public/voiceover/${userId}`);

/**
 * Voiceover MP3 download karo (blob as file)
 * Backend: GET /public/voiceover/:userId/:audioId.mp3
 */
export const downloadPublicVoiceover = (audioId, userId) =>
  apiClient.get(`/public/voiceover/${userId}/${audioId}.mp3`, {
    responseType: "blob",
  });

/**
 * Voiceover generation progress check karo
 * Backend: GET /progress/:audioId
 * Response: { status, progress } - status "done" ya progress 100 hone par ready
 */
export const getAudioProgress = (audioId) =>
  apiClient.get(`/progress/${audioId}`);

// ================= STATIC VIDEO =================

/**
 * Static video generate karo (images + voiceover)
 * Backend: POST /generate/static
 * FormData: user_id, language, voice, tts_rate, pitch, speed, scenes[0][dialogue], scenes[0][images]
 */
export const generateStaticVideo = (formData) =>
  apiClient.post("/generate/static", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/**
 * Static video generation progress check karo
 * Backend: GET /progress/static/:videoId
 */
export const getStaticVideoProgress = (videoId) =>
  apiClient.get(`/progress/static/${videoId}`);

/**
 * Static video download karo (blob as file)
 * Backend: GET /download/static/:videoId/:userId
 */
export const downloadStaticVideo = (videoId, userId) =>
  apiClient.get(`/download/static/${videoId}/${userId}`, {
    responseType: "blob",
  });

// ================= ANIMATED VIDEO =================

/**
 * Animated video generate karo (characters + background + voiceover)
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
 * Animated video generation progress check karo
 * Backend: GET /progress/animated/:videoId
 */
export const getAnimatedVideoProgress = (videoId) =>
  apiClient.get(`/progress/animated/${videoId}`);

/**
 * Animated video download karo (blob as file)
 * Backend: GET /download/animated/:videoId/:userId
 */
export const downloadAnimatedVideo = (videoId, userId) =>
  apiClient.get(`/download/animated/${videoId}/${userId}`, {
    responseType: "blob",
  });

// ================= ADMIN APIS =================
// Yeh sab routes admin-only hain - backend admin token check karta hai

/**
 * Admin login - alag route hai regular login se
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
 * Admin: Saare users ki list lo
 * Backend: GET /admin/users
 * Response: [ { id, email, name, mobile, plan, role, created_at, suspend, total_videos } ]
 */
export const adminFetchUsers = () => apiClient.get("/admin/users");

/**
 * Admin: Kisi user ka plan ya suspend status update karo
 * Backend: PATCH /admin/users/:userId
 * Data: { plan?, suspend? }
 */
export const adminUpdateUser = (userId, data) =>
  apiClient.patch(`/admin/users/${userId}`, data);

/**
 * Admin: Kisi user ka password reset karo (random temporary password banta hai)
 * Backend: POST /admin/users/:userId/reset_password
 * Response: { status, temp_password }
 */
export const adminResetPassword = (userId) =>
  apiClient.post(`/admin/users/${userId}/reset_password`);

/**
 * Admin: Multiple users ka plan ek saath badlo
 * Backend: POST /admin/users/bulk_update_plan
 * Data: { user_ids: [id1, id2], plan: "Pro" }
 */
export const adminBulkUpdatePlan = (data) =>
  apiClient.post("/admin/users/bulk_update_plan", data);

/**
 * Admin: Saare plans ki list lo
 * Backend: GET /admin/plans
 * Response: [ { id, name, tool1_videos, tool2_videos, tool3_videos, price } ]
 */
export const adminFetchPlans = () => apiClient.get("/admin/plans");

/**
 * Admin: Naya plan banao
 * Backend: POST /admin/plans
 * Data: { name, tool1_videos, tool2_videos, tool3_videos, price }
 */
export const adminCreatePlan = (data) => apiClient.post("/admin/plans", data);

/**
 * Admin: Koi plan update karo
 * Backend: PATCH /admin/plans/:planId
 */
export const adminUpdatePlan = (planId, data) =>
  apiClient.patch(`/admin/plans/${planId}`, data);

/**
 * Admin: Koi plan delete karo
 * Backend: DELETE /admin/plans/:planId
 */
export const adminDeletePlan = (planId) =>
  apiClient.delete(`/admin/plans/${planId}`);

/**
 * Admin: Usage stats dekho (kaun ne kitni videos banai)
 * Backend: GET /admin/usage
 */
export const adminFetchUsage = () => apiClient.get("/admin/usage");

/**
 * Admin: Saari videos dekho
 * Backend: GET /admin/videos
 */
export const adminFetchVideos = () => apiClient.get("/admin/videos");

/**
 * Admin: Koi video delete karo
 * Backend: DELETE /admin/videos/:videoId
 */
export const adminDeleteVideo = (videoId) =>
  apiClient.delete(`/admin/videos/${videoId}`);

/**
 * Admin: System health dekho (CPU, RAM, Disk, Queue)
 * Backend: GET /admin/system_health
 */
export const adminSystemHealth = () => apiClient.get("/admin/system_health");

/**
 * Admin: Users CSV export karo
 * Backend: GET /admin/users/export_csv
 */
export const adminExportUsersCsv = () =>
  apiClient.get("/admin/users/export_csv", { responseType: "blob" });

/**
 * Admin: Audit logs dekho
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
const BASE_URL = "http://localhost:9001"; // Flask backend URL

// ============ STATIC VIDEO FUNCTIONS ============

// Get cinematic voices
export const getCinematicVoices = async () => {
  const res = await fetch(`${BASE_URL}/api/voices`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error("Failed to fetch voices");
  return res.json();
};

// Preview voice
export const previewVoice = async (voice) => {
  const res = await fetch(`${BASE_URL}/api/preview_voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ voice }),
  });
  if (!res.ok) throw new Error("Failed to preview voice");
  return res.json();
};

// Upload scene images
export const uploadSceneImages = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append("images", file));
  
  const res = await fetch(`${BASE_URL}/upload_images`, {
    method: "POST",
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload images");
  return res.json();
};

// Upload background music
export const uploadBackgroundMusic = async (file) => {
  const formData = new FormData();
  formData.append("music", file);
  
  const res = await fetch(`${BASE_URL}/upload_music`, {
    method: "POST",
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload music");
  return res.json();
};

// Generate static video
export const generateStaticVideo = async (scriptData) => {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`${BASE_URL}/generate/static`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: 'include',
    body: JSON.stringify(scriptData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Video generation failed");
  }

  return res.json();
};

// Get static video progress
export const getStaticVideoProgress = async (videoId) => {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`${BASE_URL}/progress/static/${videoId}`, {
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
};

// ============ TOKEN MANAGEMENT ============
const getAdminToken = () => localStorage.getItem("adminToken");
const getUserToken = () => localStorage.getItem("token");

// ============ GENERIC FETCH WITH AUTH ============
const fetchWithAuth = async (url, options = {}) => {
  const token = getAdminToken();
  options.headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  const res = await fetch(`${BASE_URL}${url}`, options);

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
};

// ============ ADMIN LOGIN ============
export const adminLogin = async (email, password) => {
  const res = await fetch(`${BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Login failed");

  localStorage.setItem("adminToken", data.token);
  return data;
};

// ============ USER AUTH ============
export const userLogin = async (email, password) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Login failed");

  localStorage.setItem("token", data.token);
  localStorage.setItem("user_id", data.user_id);
  return data;
};

export const userSignup = async (email, password) => {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Signup failed");

  localStorage.setItem("token", data.token);
  localStorage.setItem("user_id", data.user_id);
  return data;
};

// ============ USERS ============
export const fetchUsers = () => fetchWithAuth("/admin/users");
export const updateUser = (userId, data) =>
  fetchWithAuth(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const resetUserPassword = (userId) =>
  fetchWithAuth(`/admin/users/${userId}/reset_password`, {
    method: "POST",
  });
export const bulkUpdateUserPlan = (userIds, plan) =>
  fetchWithAuth("/admin/users/bulk_update_plan", {
    method: "POST",
    body: JSON.stringify({ user_ids: userIds, plan }),
  });
export const exportUsersCSV = () =>
  `${BASE_URL}/admin/users/export_csv?token=${getAdminToken()}`;

// ============ PLANS ============
export const fetchPlans = () => fetchWithAuth("/admin/plans");

export const addPlan = (plan) =>
  fetchWithAuth("/admin/plans", {
    method: "POST",
    body: JSON.stringify({
      name: plan.name,
      price: plan.price,
      tool1_videos: plan.tool1_videos || 0,
      tool2_videos: plan.tool2_videos || 0,
      tool3_videos: plan.tool3_videos || 0,
    }),
  });

export const updatePlan = (planId, data) =>
  fetchWithAuth(`/admin/plans/${planId}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: data.name,
      price: data.price,
      tool1_videos: data.tool1_videos,
      tool2_videos: data.tool2_videos,
      tool3_videos: data.tool3_videos,
    }),
  });

export const deletePlan = (planId) =>
  fetchWithAuth(`/admin/plans/${planId}`, { method: "DELETE" });

// ============ VIDEOS ============
export const fetchVideos = () => fetchWithAuth("/admin/videos");
export const deleteVideo = (videoId) =>
  fetchWithAuth(`/admin/videos/${videoId}`, { method: "DELETE" });

// ============ USAGE STATS ============
export const fetchUsage = () => fetchWithAuth("/admin/usage");

// ============ AUDIT LOGS ============
export const fetchAuditLogs = () => fetchWithAuth("/admin/logs");

// ============ SYSTEM HEALTH ============
export const fetchSystemHealth = () => fetchWithAuth("/admin/system_health");

// ============ USER PROFILE ============
export const getUserProfile = async () => {
  const token = getUserToken();
  const res = await fetch(`${BASE_URL}/user/profile`, {
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

export const getUserVideos = async () => {
  const token = getUserToken();
  const res = await fetch(`${BASE_URL}/user/videos`, {
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
};

export const deleteUserVideo = async (videoId) => {
  const token = getUserToken();
  const res = await fetch(`${BASE_URL}/user/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error("Failed to delete video");
  return res.json();
};

// ============ ANIMATED VIDEO FUNCTIONS ============

export const generateAnimatedVideo = async (formData) => {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`${BASE_URL}/generate/animated`, {
    method: "POST",
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Video generation failed");
  }

  return res.json();
};

export const getAnimatedVideoProgress = async (videoId) => {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`${BASE_URL}/progress/animated/${videoId}`, {
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch progress");
  }

  return res.json();
};

export const downloadAnimatedVideo = async (videoId, userId) => {
  const token = localStorage.getItem("token");
  
  // Use native fetch API to get blob response
  const res = await fetch(`${BASE_URL}/download/animated/${videoId}/${userId}`, {
    method: "GET",
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to download video");
  }

  // Return blob directly from fetch
  return await res.blob();
};
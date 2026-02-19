// src/app/login/page.js
"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [showText, setShowText] = useState(false);
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const toggleForm = () => {
    setShowText(false);
    setError("");
    setIsSignup((prev) => !prev);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 900);
    return () => clearTimeout(timer);
  }, [isSignup]);

  const handleSignup = async () => {
    if (!signupData.email || !signupData.password || !signupData.username) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await API.signup(signupData);
      router.push("/login/tool-dashboard");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Signup failed. Check your backend is running on port 9001.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await API.login({
        email: loginEmail,
        password: loginPassword,
      });
      const role = res.data.role || "user";
      if (role === "admin") {
        router.push("/login/admin-dashboard");
      } else {
        router.push("/login/tool-dashboard");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Login failed. Check your backend is running on port 9001.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${isSignup ? "signup-mode" : ""}`}>

        {/* LEFT SIDE - FORMS */}
        <div className="forms-wrapper">

          {/* LOGIN FORM */}
          <div className="form-container login-form">
            <h1 className="form-title">Login</h1>

            {error && !isSignup && (
              <div className="error-box">{error}</div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <button className="auth-button" onClick={handleLogin} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="form-footer">
              Don&apos;t have an account?{" "}
              <button className="link-btn" onClick={toggleForm}>
                Sign Up
              </button>
            </p>
          </div>

          {/* SIGNUP FORM */}
          <div className="form-container signup-form">
            <h1 className="form-title">Register</h1>

            {error && isSignup && (
              <div className="error-box">{error}</div>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                placeholder="Choose a username"
                value={signupData.username}
                onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Create a password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              />
            </div>

            <button className="auth-button" onClick={handleSignup} disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>

            <p className="form-footer">
              Already have an account?{" "}
              <button className="link-btn" onClick={toggleForm}>
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="toggle-container">
          <div className="toggle-content">
            {showText && (
              <>
                <h2 className="toggle-title">{isSignup ? "Welcome!" : "Welcome Back!"}</h2>
                <p className="toggle-text">
                  {isSignup
                    ? "Create your account and start your journey with AnimVox."
                    : "Login to access your personal dashboard."}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; }
        :global(body) { font-family: var(--font-sans); color: var(--foreground); -webkit-font-smoothing: antialiased; }

        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }

        .auth-card { width: 900px; height: 540px; display: flex; border-radius: 24px; overflow: hidden; background: linear-gradient(135deg,#061e1f,#041414); box-shadow: 0 0 40px rgba(27,168,177,0.25); border: 1px solid rgba(255,255,255,0.1); transition: transform 0.9s cubic-bezier(0.77,0,0.18,1); will-change: transform; }

        .forms-wrapper { width: 50%; position: relative; overflow: hidden; transition: transform 0.9s cubic-bezier(0.77,0,0.18,1); will-change: transform; }

        .form-container { position: absolute; inset: 0; padding: 50px 50px; display: flex; flex-direction: column; justify-content: center; transition: transform 0.9s cubic-bezier(0.77,0,0.18,1), opacity 0.6s ease; }

        .login-form  { transform: translateX(0);    opacity: 1; pointer-events: auto; }
        .signup-form { transform: translateX(100%); opacity: 0; pointer-events: none; }

        .auth-card.signup-mode .forms-wrapper  { transform: translateX(100%); }
        .auth-card.signup-mode .login-form     { transform: translateX(-100%); opacity: 0; pointer-events: none; }
        .auth-card.signup-mode .signup-form    { transform: translateX(0);     opacity: 1; pointer-events: auto; }

        .form-title { font-size: 28px; margin-bottom: 16px; letter-spacing: 0.06em; font-family: var(--font-display); color: white; }

        .error-box { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; font-size: 13px; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; }

        .form-group { margin-bottom: 18px; }
        .form-label { font-size: 12px; color: rgba(238,251,251,0.65); margin-bottom: 6px; display: block; }
        .form-input { width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.28); padding: 10px 0; color: white; transition: border-color 0.3s ease; font-size: 14px; }
        .form-input:focus { outline: none; border-bottom-color: #1ba8b1; }

        .auth-button { width: 100%; margin-top: 16px; padding: 13px; border-radius: 999px; background: linear-gradient(90deg,#16727f,#1ba8b1); border: none; color: #041414; font-weight: 700; font-size: 15px; cursor: pointer; transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .auth-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(27,168,177,0.35); }
        .auth-button:disabled { opacity: 0.6; cursor: not-allowed; }

        .form-footer { margin-top: 14px; font-size: 13px; text-align: center; color: rgba(238,251,251,0.6); }
        .link-btn { background: none; border: none; color: #1ba8b1; cursor: pointer; font-size: 13px; }

        .toggle-container { width: 50%; background: linear-gradient(135deg,#1ba8b1,#6ff7ff); display: flex; align-items: center; justify-content: center; transition: transform 0.9s cubic-bezier(0.77,0,0.18,1); will-change: transform; }
        .auth-card.signup-mode .toggle-container { transform: translateX(-100%); }
        .toggle-content { text-align: center; color: #041414; padding: 40px; }
        .toggle-title { font-size: 32px; margin-bottom: 16px; letter-spacing: 0.06em; font-family: var(--font-display); }
        .toggle-text  { font-size: 15px; line-height: 1.6; opacity: 0.8; }

        @media (max-width: 768px) {
          .auth-card { flex-direction: column; height: auto; width: 100%; }
          .forms-wrapper, .toggle-container { width: 100%; transform: none !important; }
          .form-container { position: relative; transform: none !important; opacity: 1 !important; }
          .signup-form { display: none; }
          .auth-card.signup-mode .signup-form { display: flex; }
          .auth-card.signup-mode .login-form  { display: none; }
        }
      `}</style>
    </div>
  );
}
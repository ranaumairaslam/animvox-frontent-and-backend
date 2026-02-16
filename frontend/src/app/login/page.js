// src/app/login/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [showText, setShowText] = useState(false);
  const router = useRouter();

  const DEFAULT_USERS = [
    { username: "user@gmail.com", password: "123", dashboard: "/login/tool-dashboard" },
    { username: "admin@gmail.com", password: "123", dashboard: "/login/admin-dashboard" },
  ];

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const toggleForm = () => {
    setShowText(false);
    setIsSignup((prev) => !prev);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 900);
    return () => clearTimeout(timer);
  }, [isSignup]);

  const handleLogin = () => {
    if (!loginUsername || !loginPassword) return;

    const user = DEFAULT_USERS.find(
      (u) => u.username === loginUsername && u.password === loginPassword
    );

    if (user) {
      try {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", loginUsername.includes("admin") ? "admin" : "user");
      } catch {}
      router.push(user.dashboard);
    } else {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${isSignup ? "signup-mode" : ""}`}>

        {/* LEFT SIDE */}
        <div className="forms-wrapper">
          {/* LOGIN */}
          <div className="form-container login-form">
            <h1 className="form-title">Login</h1>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
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
              />
            </div>

            <button className="auth-button" onClick={handleLogin}>
              Login
            </button>

            <p className="form-footer">
              Don&apos;t have an account?{" "}
              <button className="link-btn" onClick={toggleForm}>
                Sign Up
              </button>
            </p>
          </div>

          {/* SIGNUP */}
          <div className="form-container signup-form">
            <h1 className="form-title">Register</h1>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" placeholder="Choose a username" />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="Enter your email" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Create a password" />
            </div>

            <button className="auth-button">Register</button>

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

      {/* STYLING */}
      <style jsx>{`
        * { box-sizing: border-box; }
        :global(body) { font-family: var(--font-sans); color: var(--foreground); -webkit-font-smoothing: antialiased; }
        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .auth-card { width: 900px; height: 520px; display: flex; border-radius: 24px; overflow: hidden; background: linear-gradient(135deg,#061e1f,#041414); box-shadow: 0 0 40px rgba(27,168,177,0.25); border: 1px solid rgba(255,255,255,0.1); transition: transform 0.9s cubic-bezier(0.77,0,0.18,1); will-change: transform; }
        .forms-wrapper { width: 50%; position: relative; overflow: hidden; transition: transform 0.9s cubic-bezier(0.77,0,0.18,1); will-change: transform; }
        .form-container { position: absolute; inset: 0; padding: 60px 50px; display: flex; flex-direction: column; justify-content: center; transition: transform 0.9s cubic-bezier(0.77,0,0.18,1), opacity 0.6s ease; }
        .login-form { transform: translateX(0); opacity: 1; pointer-events: auto; }
        .signup-form { transform: translateX(100%); opacity: 0; pointer-events: none; }
        .auth-card.signup-mode .forms-wrapper { transform: translateX(100%); }
        .auth-card.signup-mode .login-form { transform: translateX(-100%); opacity: 0; pointer-events: none; }
        .auth-card.signup-mode .signup-form { transform: translateX(0); opacity: 1; pointer-events: auto; }
        .form-title { font-size: 32px; margin-bottom: 40px; letter-spacing: 0.06em; font-family: var(--font-display); }
        .form-group { margin-bottom: 24px; }
        .form-label { font-size: 12px; color: rgba(238,251,251,0.65); margin-bottom: 6px; display: block; }
        .form-input { width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.28); padding: 10px 0; color: white; transition: border-color 0.3s ease; }
        .form-input:focus { outline: none; border-bottom-color: #1ba8b1; }
        .auth-button { margin-top: 20px; padding: 14px; border-radius: 999px; background: linear-gradient(90deg,#16727f,#1ba8b1); border: none; color: #041414; font-weight: 700; cursor: pointer; transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .auth-button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(27,168,177,0.35); }
        .form-footer { margin-top: 16px; font-size: 13px; text-align: center; }
        .link-btn { background: none; border: none; color: #1ba8b1; cursor: pointer; }
        .toggle-container { width: 50%; background: linear-gradient(135deg,#1ba8b1,#6ff7ff); display: flex; align-items: center; justify-content: center; transition: transform 0.9s cubic-bezier(0.77,0,0.18,1); will-change: transform; }
        .auth-card.signup-mode .toggle-container { transform: translateX(-100%); }
        .toggle-content { text-align: center; color: #041414; padding: 40px; }
        .toggle-title { font-size: 36px; margin-bottom: 16px; letter-spacing: 0.06em; font-family: var(--font-display); }
        @media (max-width: 768px) {
          .auth-card { flex-direction: column; height: auto; }
          .forms-wrapper, .toggle-container { width: 100%; transform: none !important; }
          .form-container { position: relative; transform: none !important; opacity: 1 !important; }
          .signup-form { display: none; }
          .auth-card.signup-mode .signup-form { display: flex; }
          .auth-card.signup-mode .login-form { display: none; }
        }
      `}</style>
    </div>
  );
}

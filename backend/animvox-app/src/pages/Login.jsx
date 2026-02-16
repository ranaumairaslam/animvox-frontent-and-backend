import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api"; // default import, works with updated api.js

export default function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Call login via default API object
      const res = await API.login({ email, password });

      // Axios response payload is in res.data
      const { token, user_id } = res.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user_id", user_id);

      if (setIsLoggedIn) setIsLoggedIn(true);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      // Show backend error if exists, otherwise generic message
      setError(
        err.response?.data?.error ||
        err.message ||
        "Login failed. Check your network or credentials."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">Login to AnimVox</h1>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        <p className="signup-text">
          Don't have an account?{" "}
          <Link to="/signup" className="signup-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

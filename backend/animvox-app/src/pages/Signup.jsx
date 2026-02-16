import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api"; // default import

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");       // optional
  const [plan, setPlan] = useState("free");       // optional
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.signup({
        name,
        email,
        mobile_number: mobile || undefined,  // only send if provided
        plan: plan || "free",
        password,
      });

      if (res.data?.token) {
        const { token, user_id } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user_id", user_id);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err.response?.data?.error ||
        err.message ||
        "Signup failed. Check your network or input."
      );
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-box">
        <h1 className="signup-title">Create an AnimVox Account</h1>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

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
            <label className="form-label">Mobile Number (optional)</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subscription Plan (optional)</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="form-input"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
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

          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
          <Link to="/login" className="login-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

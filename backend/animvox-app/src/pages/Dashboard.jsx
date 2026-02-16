import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const userLoggedIn = Boolean(token);

  const goToTool = (tool) => {
    if (!userLoggedIn) {
      navigate("/login");
      return;
    }
    navigate(`/${tool}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    window.location.reload();
  };

  return (
    <div className="page-container">
      {/* TOP BAR */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        {!userLoggedIn ? (
          <>
            <button className="tool-blue" onClick={() => navigate("/signup")}>
              Signup
            </button>
            <button className="tool-green" onClick={() => navigate("/login")}>
              Login
            </button>
          </>
        ) : (
          <>
            <button className="tool-purple" onClick={() => navigate("/profile")}>
              Profile
            </button>
            <button className="remove-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>

      <h1 className="page-title">Welcome to AnimVox</h1>

      {/* TOOLS */}
      <div className="tools-grid modern-tools">
        <button
          onClick={() => goToTool("voiceover")}
          className="tool-button tool-purple"
        >
          AnimVox Voices
        </button>
        <button
          onClick={() => goToTool("static")}
          className="tool-button tool-blue"
        >
          AnimVox Static Videos
        </button>
        <button
          onClick={() => goToTool("animated")}
          className="tool-button tool-green"
        >
          AnimVox Animated Videos
        </button>
      </div>

      {/* USER MESSAGE */}
      {userLoggedIn && (
        <p style={{ marginTop: "20px", opacity: 0.7 }}>
          
        </p>
      )}

      {!userLoggedIn && (
        <p style={{ marginTop: "20px", opacity: 0.7 }}>
          Login to access tools and generate content.
        </p>
      )}
    </div>
  );
}

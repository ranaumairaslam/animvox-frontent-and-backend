import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalVideos: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/usage");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      <div className="stats-box">
        <p>Total Users: {stats.totalUsers}</p>
        <p>Total Videos Generated: {stats.totalVideos}</p>
      </div>
      <button onClick={() => navigate("/admin/users")} className="add-button">
        Manage Users
      </button>
      <button onClick={() => navigate("/admin/plans")} className="add-button">
        Manage Plans
      </button>
      <button onClick={() => navigate("/admin/usage")} className="add-button">
        Usage Stats
      </button>
    </div>
  );
}

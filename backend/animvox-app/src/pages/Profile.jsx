import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getProfile()

      .then(res => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch(() => {
        navigate("/login");
      });
  }, []);

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="page-container">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-card">
        <p><strong>Name:</strong> {profile.name || "-"}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Mobile:</strong> {profile.mobile || "-"}</p>
        <p><strong>Plan:</strong> {profile.plan}</p>
        <p><strong>Role:</strong> {profile.role}</p>
        <p><strong>Joined:</strong> {profile.created_at}</p>
        <p><strong>Status:</strong> {profile.suspend ? "Suspended" : "Active"}</p>
      </div>
    </div>
  );
}

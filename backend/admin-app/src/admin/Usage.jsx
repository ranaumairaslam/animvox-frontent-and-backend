import { useEffect, useState } from "react";
import * as API from "../api/api";

export default function Usage() {
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const data = await API.fetchUsage();
      setUsage(data || []);
    } catch (err) {
      console.error("Failed to load usage data:", err);
      setUsage([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  return (
    <div className="page-container">
      <h1>Platform Usage</h1>

      {loading ? (
        <p>Loading usage data...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Total Videos</th>
              <th>Tool1</th>
              <th>Tool2</th>
              <th>Tool3</th>
            </tr>
          </thead>
          <tbody>
            {usage.length ? (
              usage.map((u) => (
                <tr key={u.id || u.email}>
                  <td>{u.email}</td>
                  <td>{u.total_videos ?? 0}</td>
                  <td>{u.tool1 ?? 0}</td>
                  <td>{u.tool2 ?? 0}</td>
                  <td>{u.tool3 ?? 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No usage data found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import API from "../api/api";

export default function Usage() {
  const [usage, setUsage] = useState([]);

  useEffect(() => {
    const fetchUsage = async () => {
      const res = await API.get("/admin/usage");
      setUsage(res.data.users);
    };
    fetchUsage();
  }, []);

  return (
    <div className="page-container">
      <h1>Platform Usage</h1>
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
          {usage.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.total_videos}</td>
              <td>{u.tool1}</td>
              <td>{u.tool2}</td>
              <td>{u.tool3}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

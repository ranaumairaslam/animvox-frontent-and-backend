import { useEffect, useState } from "react";
import API from "../api/api";

export default function Users() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const changePlan = async (userId, plan) => {
    try {
      await API.patch(`/admin/users/${userId}`, { plan });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const suspendUser = async (userId, suspend) => {
    try {
      await API.patch(`/admin/users/${userId}`, { suspend });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="page-container">
      <h1>Users Management</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Plan</th>
            <th>Videos</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.plan}</td>
              <td>{u.total_videos}</td>
              <td>
                <button onClick={() => changePlan(u.id, "free")}>Free</button>
                <button onClick={() => changePlan(u.id, "pro")}>Pro</button>
                <button onClick={() => suspendUser(u.id, !u.suspended)}>
                  {u.suspended ? "Activate" : "Suspend"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

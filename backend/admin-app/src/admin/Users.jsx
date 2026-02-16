import { useEffect, useState } from "react";
import * as API from "../api/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await API.fetchUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load all plans
  const loadPlans = async () => {
    try {
      const data = await API.fetchPlans();
      setPlans(data || []);
    } catch (err) {
      console.error("Failed to load plans:", err);
      setPlans([]);
    }
  };

  // Update user info
  const updateUser = async (userId, updates) => {
    try {
      await API.updateUser(userId, updates);
      loadUsers();
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const changePlan = (userId, plan) => updateUser(userId, { plan });
  const toggleSuspend = (userId, suspended) => updateUser(userId, { suspend: suspended });
  const resetPassword = (userId) => {
    alert(`Reset password for user ${userId} (to be implemented)`);
  };

  const handleBulkAction = async (suspend = true) => {
    await Promise.all(selectedUsers.map((id) => toggleSuspend(id, suspend)));
    setSelectedUsers([]);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Filtered and searched users
  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    const plan = u.plan || "";
    return (
      (u.email?.toLowerCase().includes(search) ||
       u.name?.toLowerCase().includes(search) ||
       u.mobile_number?.toLowerCase().includes(search)) &&
      (filterPlan ? plan === filterPlan : true)
    );
  });

  useEffect(() => {
    loadUsers();
    loadPlans();
  }, []);

  return (
    <div className="page-container">
      <h1>Users Management</h1>

      {/* Search & Filter */}
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search by name, email or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
          <option value="">All Plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>

        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <button onClick={() => handleBulkAction(true)}>Suspend</button>
            <button onClick={() => handleBulkAction(false)}>Activate</button>
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                  onChange={(e) =>
                    setSelectedUsers(
                      e.target.checked ? filteredUsers.map((u) => u.id) : []
                    )
                  }
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Plan</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Total Videos</th>
              <th>Suspend</th>
              <th>Password</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length ? (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => handleSelectUser(u.id)}
                    />
                  </td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.mobile_number || "-"}</td>
                  <td>
                    <select value={u.plan} onChange={(e) => changePlan(u.id, e.target.value)}>
                      {plans.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>{u.role}</td>
                  <td>{u.created_at}</td>
                  <td>{u.total_videos || 0}</td>
                  <td>
                    <button onClick={() => toggleSuspend(u.id, !u.suspend)}>
                      {u.suspend ? "Activate" : "Suspend"}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => resetPassword(u.id)}>Reset</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10}>No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

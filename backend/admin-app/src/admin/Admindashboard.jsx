import { useEffect, useState } from "react"; 
import * as API from "../api/api";
import "../style.css";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const [newPlan, setNewPlan] = useState({
    name: "",
    tool1_videos: 0,
    tool2_videos: 0,
    tool3_videos: 0,
    price: 0,
  });
  
  const [editPlanId, setEditPlanId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const resUsers = await API.fetchUsers();
      const resPlans = await API.fetchPlans();
      const resUsage = await API.fetchUsage();

      setUsers(resUsers || []);
      setPlans(resPlans || []);
      setUsage(resUsage || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setUsers([]);
      setPlans([]);
      setUsage([]);
    }
  };

  // ================= USER FUNCTIONS =================
  const updateUser = async (userId, updates) => {
    try {
      await API.updateUser(userId, updates);
      await loadAllData();
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkSuspend = async (suspend = true) => {
    await Promise.all(
      selectedUsers.map((userId) => updateUser(userId, { suspend }))
    );
    setSelectedUsers([]);
  };

  const handleInlinePlanUpdate = async (userId, newPlanName) => {
    await updateUser(userId, { plan: newPlanName });
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm("Reset password for this user?")) return;
    try {
      await API.resetUserPassword(userId);
      alert("Password reset successfully");
    } catch (err) {
      console.error("Failed to reset password:", err);
    }
  };

  const handleBulkPlanUpdate = async (planName) => {
    if (!selectedUsers.length) return;
    try {
      await API.bulkUpdateUserPlan(selectedUsers, planName);
      setSelectedUsers([]);
      await loadAllData();
    } catch (err) {
      console.error("Failed to update plans in bulk:", err);
    }
  };

  const handleExportCSV = () => {
    const url = API.exportUsersCSV();
    window.open(url, "_blank");
  };

  // ================= PLAN FUNCTIONS =================
  const handleCreatePlan = async () => {
    if (!newPlan.name) return;
    try {
      await API.addPlan(newPlan);
      setNewPlan({ name: "", videos: 0, price: 0 });
      loadAllData();
    } catch (err) {
      console.error("Failed to create plan:", err);
    }
  };

  const handleUpdatePlan = async (planId, updates) => {
    try {
      await API.updatePlan(planId, updates);
      setEditPlanId(null);
      loadAllData();
    } catch (err) {
      console.error("Failed to update plan:", err);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await API.deletePlan(planId);
      loadAllData();
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  // ================= SEARCH / FILTER =================
  const handleSearchChange = (e) => setSearchTerm(e.target.value || "");
  const handleFilterChange = (e) => setFilterPlan(e.target.value || "");

  const filteredUsers = users
    .filter((u) => {
      const email = (u?.email || "").toLowerCase();
      const search = (searchTerm || "").toLowerCase();
      const plan = u?.plan || "";
      return email.includes(search) && (filterPlan ? plan === filterPlan : true);
    })
    .slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  const totalPages = Math.ceil((users?.length || 0) / USERS_PER_PAGE);

  // ================= RENDER =================
  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="card">
          <div className="card-title">Total Users</div>
          <div className="card-value">{users?.length || 0}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Videos</div>
          <div className="card-value">
            {usage?.reduce((acc, u) => acc + (u.total_videos || 0), 0)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Plans</div>
          <div className="card-value">{plans?.length || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["overview", "users", "plans", "usage"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ================= USERS TAB ================= */}
      {activeTab === "users" && (
        <div className="tab-content">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select value={filterPlan} onChange={handleFilterChange}>
              <option value="">All Plans</option>
              {plans?.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            {selectedUsers.length > 0 && (
              <div className="bulk-actions">
                <button onClick={() => handleBulkSuspend(true)}>Suspend</button>
                <button onClick={() => handleBulkSuspend(false)}>Unsuspend</button>
                <button onClick={() => {
                  const planName = prompt("Enter new plan for selected users:");
                  if (planName) handleBulkPlanUpdate(planName);
                }}>Update Plan</button>
                <button onClick={handleExportCSV}>Export CSV</button>
              </div>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      selectedUsers.length === filteredUsers.length
                    }
                    onChange={(e) =>
                      setSelectedUsers(
                        e.target.checked
                          ? filteredUsers.map((u) => u.id)
                          : []
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
                <th>Reset Password</th>
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
                    <td>{u.name || "-"}</td>
                    <td>{u.email}</td>
                    <td>{u.mobile || "-"}</td>
                    <td>
                      <select
                        value={u.plan}
                        onChange={(e) =>
                          handleInlinePlanUpdate(u.id, e.target.value)
                        }
                      >
                        {plans?.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{u.role || "user"}</td>
                    <td>{u.created_at || "-"}</td>
                    <td>{u.total_videos || 0}</td>
                    <td>
                      <button
                        className="btn-suspend"
                        onClick={() =>
                          updateUser(u.id, { suspend: !u.suspend })
                        }
                      >
                        {u.suspend ? "Unsuspend" : "Suspend"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-reset"
                        onClick={() => handleResetPassword(u.id)}
                      >
                        Reset
                      </button>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === currentPage ? "active" : ""}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

{/* ================= PLANS TAB ================= */}
{activeTab === "plans" && (
  <div className="tab-content">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Tool 1 Videos</th>
          <th>Tool 2 Videos</th>
          <th>Tool 3 Videos</th>
          <th>Price</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {plans.length ? (
          plans.map((p) => (
            <tr key={p.id}>
              <td>
                {editPlanId === p.id ? (
                  <input
                    value={p.name}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((pl) =>
                          pl.id === p.id ? { ...pl, name: e.target.value } : pl
                        )
                      )
                    }
                  />
                ) : (
                  p.name
                )}
              </td>

              {["tool1_videos", "tool2_videos", "tool3_videos"].map((field) => (
                <td key={field}>
                  {editPlanId === p.id ? (
                    <input
                      type="number"
                      value={p[field]}
                      onChange={(e) =>
                        setPlans((prev) =>
                          prev.map((pl) =>
                            pl.id === p.id
                              ? { ...pl, [field]: +e.target.value }
                              : pl
                          )
                        )
                      }
                    />
                  ) : (
                    p[field]
                  )}
                </td>
              ))}

              <td>
                {editPlanId === p.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={p.price}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((pl) =>
                          pl.id === p.id
                            ? { ...pl, price: +e.target.value }
                            : pl
                        )
                      )
                    }
                  />
                ) : (
                  p.price
                )}
              </td>

              <td>
                {editPlanId === p.id ? (
                  <>
                    <button onClick={() => handleUpdatePlan(p.id, p)}>
                      Save
                    </button>
                    <button onClick={() => setEditPlanId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditPlanId(p.id)}>
                      Edit
                    </button>
                    <button onClick={() => handleDeletePlan(p.id)}>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6}>No plans found</td>
          </tr>
        )}
      </tbody>
    </table>

    {/* CREATE PLAN */}
    <div className="create-plan">
      <h3>Create New Plan</h3>

      <input
        placeholder="Plan Name"
        value={newPlan.name}
        onChange={(e) =>
          setNewPlan({ ...newPlan, name: e.target.value })
        }
      />

      <input
        type="number"
        placeholder="Tool 1 Videos"
        value={newPlan.tool1_videos}
        onChange={(e) =>
          setNewPlan({ ...newPlan, tool1_videos: +e.target.value })
        }
      />

      <input
        type="number"
        placeholder="Tool 2 Videos"
        value={newPlan.tool2_videos}
        onChange={(e) =>
          setNewPlan({ ...newPlan, tool2_videos: +e.target.value })
        }
      />

      <input
        type="number"
        placeholder="Tool 3 Videos"
        value={newPlan.tool3_videos}
        onChange={(e) =>
          setNewPlan({ ...newPlan, tool3_videos: +e.target.value })
        }
      />

      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={newPlan.price}
        onChange={(e) =>
          setNewPlan({ ...newPlan, price: +e.target.value })
        }
      />

      <button onClick={handleCreatePlan}>Create Plan</button>
    </div>
  </div>
)}


      {/* ================= USAGE TAB ================= */}
      {activeTab === "usage" && (
        <div className="tab-content">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Total Videos</th>
                <th>Tool1</th>
                <th>Tool2</th>
                <th>Tool3</th>
              </tr>
            </thead>
            <tbody>
              {usage.length ? (
                usage.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.total_videos}</td>
                    <td>{u.tool1 ?? 0}</td>
                    <td>{u.tool2 ?? 0}</td>
                    <td>{u.tool3 ?? 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No usage data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

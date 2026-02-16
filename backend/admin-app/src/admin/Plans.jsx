import { useState, useEffect } from "react";
import * as API from "../api/api"; // Ensure API has admin plan endpoints

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({
    name: "",
    tool1_videos: 0,
    tool2_videos: 0,
    tool3_videos: 0,
    price: 0,
  });
  const [editPlanId, setEditPlanId] = useState(null);
  const [editValues, setEditValues] = useState({
    name: "",
    tool1_videos: 0,
    tool2_videos: 0,
    tool3_videos: 0,
    price: 0,
  });

  // Load plans from API
  const loadPlans = async () => {
    try {
      const data = await API.fetchPlans();
      setPlans(data || []);
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  // Add new plan
  const addPlan = async () => {
    if (
      !newPlan.name ||
      newPlan.tool1_videos < 0 ||
      newPlan.tool2_videos < 0 ||
      newPlan.tool3_videos < 0 ||
      newPlan.price < 0
    ) {
      return alert("Please enter valid plan details");
    }
    try {
      await API.addPlan(newPlan);
      setNewPlan({ name: "", tool1_videos: 0, tool2_videos: 0, tool3_videos: 0, price: 0 });
      loadPlans();
    } catch (err) {
      console.error("Failed to add plan:", err);
    }
  };

  // Start editing a plan
  const startEdit = (plan) => {
    setEditPlanId(plan.id);
    setEditValues({
      name: plan.name,
      tool1_videos: plan.tool1_videos,
      tool2_videos: plan.tool2_videos,
      tool3_videos: plan.tool3_videos,
      price: plan.price,
    });
  };

  // Save edited plan
  const saveEdit = async (planId) => {
    if (
      !editValues.name ||
      editValues.tool1_videos < 0 ||
      editValues.tool2_videos < 0 ||
      editValues.tool3_videos < 0 ||
      editValues.price < 0
    ) {
      return alert("Please enter valid values");
    }
    try {
      await API.updatePlan(planId, editValues);
      setEditPlanId(null);
      loadPlans();
    } catch (err) {
      console.error("Failed to update plan:", err);
    }
  };

  // Delete plan
  const deletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await API.deletePlan(planId);
      loadPlans();
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <div className="page-container">
      <h1>Subscription Plans</h1>

      {/* Add Plan Form */}
      <div className="form-grid">
        <input
          className="input"
          placeholder="Plan Name"
          value={newPlan.name}
          onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Tool1 Videos"
          min={0}
          value={newPlan.tool1_videos}
          onChange={(e) =>
            setNewPlan({ ...newPlan, tool1_videos: Number(e.target.value) })
          }
        />
        <input
          className="input"
          type="number"
          placeholder="Tool2 Videos"
          min={0}
          value={newPlan.tool2_videos}
          onChange={(e) =>
            setNewPlan({ ...newPlan, tool2_videos: Number(e.target.value) })
          }
        />
        <input
          className="input"
          type="number"
          placeholder="Tool3 Videos"
          min={0}
          value={newPlan.tool3_videos}
          onChange={(e) =>
            setNewPlan({ ...newPlan, tool3_videos: Number(e.target.value) })
          }
        />
        <input
          className="input"
          type="number"
          placeholder="Price ($)"
          min={0}
          step="0.01"
          value={newPlan.price}
          onChange={(e) =>
            setNewPlan({ ...newPlan, price: Number(e.target.value) })
          }
        />
        <button className="add-button" onClick={addPlan}>
          Add Plan
        </button>
      </div>

      {/* Plans Table */}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Tool1</th>
            <th>Tool2</th>
            <th>Tool3</th>
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
                      type="text"
                      value={editValues.name}
                      onChange={(e) =>
                        setEditValues({ ...editValues, name: e.target.value })
                      }
                    />
                  ) : (
                    p.name
                  )}
                </td>
                {["tool1_videos", "tool2_videos", "tool3_videos"].map((tool) => (
                  <td key={tool}>
                    {editPlanId === p.id ? (
                      <input
                        type="number"
                        min={0}
                        value={editValues[tool]}
                        onChange={(e) =>
                          setEditValues({ ...editValues, [tool]: Number(e.target.value) })
                        }
                      />
                    ) : (
                      p[tool]
                    )}
                  </td>
                ))}
                <td>
                  {editPlanId === p.id ? (
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editValues.price}
                      onChange={(e) =>
                        setEditValues({ ...editValues, price: Number(e.target.value) })
                      }
                    />
                  ) : (
                    `$${Number(p.price).toFixed(2)}`
                  )}
                </td>
                <td>
                  {editPlanId === p.id ? (
                    <>
                      <button onClick={() => saveEdit(p.id)}>Save</button>
                      <button onClick={() => setEditPlanId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(p)}>Edit</button>
                      <button onClick={() => deletePlan(p.id)}>Delete</button>
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
    </div>
  );
}

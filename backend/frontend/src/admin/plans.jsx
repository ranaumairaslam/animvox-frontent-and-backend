import { useState, useEffect } from "react";
import API from "../api/api";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({ name: "", videos: 0, price: 0 });

  const fetchPlans = async () => {
    const res = await API.get("/admin/plans");
    setPlans(res.data);
  };

  const addPlan = async () => {
    await API.post("/admin/plans", newPlan);
    fetchPlans();
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="page-container">
      <h1>Subscription Plans</h1>
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
          placeholder="Videos per Tool"
          value={newPlan.videos}
          onChange={(e) => setNewPlan({ ...newPlan, videos: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Price ($)"
          value={newPlan.price}
          onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
        />
        <button className="add-button" onClick={addPlan}>Add Plan</button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Videos/Tool</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.videos}</td>
              <td>${p.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

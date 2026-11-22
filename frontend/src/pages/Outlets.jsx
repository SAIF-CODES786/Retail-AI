
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../App.css";

const initialForm = {
  outletIdentifier: "",
  establishmentYear: "",
  outletSize: "",
  locationType: "",
  outletType: "",
};

export default function Outlets() {
  const navigate = useNavigate();

  const [outlets, setOutlets] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOutlets = async () => {
    try {
      const response = await api.get("/outlets");
      setOutlets(response.data.outlets || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Outlets load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const establishmentYear = Number(form.establishmentYear);

    if (
      !Number.isInteger(establishmentYear) ||
      establishmentYear < 1900 ||
      establishmentYear > new Date().getFullYear()
    ) {
      setError("Please enter a valid establishment year.");
      return;
    }

    const payload = {
      outletIdentifier: form.outletIdentifier.trim().toUpperCase(),
      establishmentYear,
      outletSize: form.outletSize,
      locationType: form.locationType,
      outletType: form.outletType,
    };

    try {
      if (editingId) {
        await api.put(`/outlets/${editingId}`, payload);
        setMessage("Outlet updated successfully.");
      } else {
        await api.post("/outlets", payload);
        setMessage("Outlet added successfully.");
      }

      resetForm();
      await loadOutlets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Outlet save nahi ho paaya."
      );
    }
  };

  const handleEdit = (outlet) => {
    setEditingId(outlet._id);

    setForm({
      outletIdentifier: outlet.outletIdentifier || "",
      establishmentYear: String(outlet.establishmentYear || ""),
      outletSize: outlet.outletSize || "",
      locationType: outlet.locationType || "",
      outletType: outlet.outletType || "",
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya tum ye outlet delete karna chahte ho?")) {
      return;
    }

    try {
      await api.delete(`/outlets/${id}`);
      setMessage("Outlet deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadOutlets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Outlet delete nahi ho paaya."
      );
    }
  };

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Outlet Management</h1>
          <p>Manage retail outlets and their Big Mart attributes.</p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      {error && <p className="products-error">{error}</p>}
      {message && <p className="sales-success">{message}</p>}

      <section className="product-form-card">
        <h2>{editingId ? "Edit Outlet" : "Add New Outlet"}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Outlet Identifier *
            <input
              name="outletIdentifier"
              value={form.outletIdentifier}
              onChange={handleChange}
              required
              placeholder="e.g. OUT049"
              maxLength={20}
            />
          </label>

          <label>
            Establishment Year *
            <input
              type="number"
              name="establishmentYear"
              value={form.establishmentYear}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear()}
              step="1"
              required
              placeholder="e.g. 1999"
            />
          </label>

          <label>
            Outlet Size *
            <select
              name="outletSize"
              value={form.outletSize}
              onChange={handleChange}
              required
            >
              <option value="">Select Outlet Size</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <label>
            Location Type *
            <select
              name="locationType"
              value={form.locationType}
              onChange={handleChange}
              required
            >
              <option value="">Select Location Type</option>
              <option value="Tier 1">Tier 1</option>
              <option value="Tier 2">Tier 2</option>
              <option value="Tier 3">Tier 3</option>
            </select>
          </label>

          <label>
            Outlet Type *
            <select
              name="outletType"
              value={form.outletType}
              onChange={handleChange}
              required
            >
              <option value="">Select Outlet Type</option>
              <option value="Grocery Store">Grocery Store</option>
              <option value="Supermarket Type1">Supermarket Type1</option>
              <option value="Supermarket Type2">Supermarket Type2</option>
              <option value="Supermarket Type3">Supermarket Type3</option>
            </select>
          </label>

          <div className="product-form-actions">
            <button type="submit" className="primary-btn">
              {editingId ? "Update Outlet" : "Add Outlet"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="products-list-card">
        <h2>All Outlets ({outlets.length})</h2>

        {loading ? (
          <p>Loading outlets...</p>
        ) : outlets.length === 0 ? (
          <p>No outlets added yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Outlet ID</th>
                  <th>Establishment Year</th>
                  <th>Outlet Size</th>
                  <th>Location Type</th>
                  <th>Outlet Type</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {outlets.map((outlet) => (
                  <tr key={outlet._id}>
                    <td>{outlet.outletIdentifier}</td>
                    <td>{outlet.establishmentYear}</td>
                    <td>{outlet.outletSize}</td>
                    <td>{outlet.locationType}</td>
                    <td>{outlet.outletType}</td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(outlet)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(outlet._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

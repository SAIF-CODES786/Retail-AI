
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../App.css";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  leadTime: "0",
};

export default function Suppliers() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data.suppliers || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Suppliers load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
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

    const leadTime = Number(form.leadTime);

    if (!Number.isFinite(leadTime) || leadTime < 0) {
      setError("Lead time zero ya positive number hona chahiye.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      leadTime,
    };

    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, payload);
        setMessage("Supplier updated successfully.");
      } else {
        await api.post("/suppliers", payload);
        setMessage("Supplier added successfully.");
      }

      resetForm();
      await loadSuppliers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Supplier save nahi ho paaya."
      );
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier._id);
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      leadTime: String(supplier.leadTime ?? 0),
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya tum ye supplier delete karna chahte ho?")) {
      return;
    }

    try {
      await api.delete(`/suppliers/${id}`);
      setMessage("Supplier deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadSuppliers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Supplier delete nahi ho paaya."
      );
    }
  };

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Supplier Management</h1>
          <p>Manage supplier contact details and delivery lead time.</p>
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
        <h2>{editingId ? "Edit Supplier" : "Add New Supplier"}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Supplier Name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Supplier name"
            />
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone number"
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="supplier@example.com"
            />
          </label>

          <label>
            Lead Time (days)
            <input
              type="number"
              name="leadTime"
              min="0"
              step="1"
              value={form.leadTime}
              onChange={handleChange}
            />
          </label>

          <div className="product-form-actions">
            <button type="submit" className="primary-btn">
              {editingId ? "Update Supplier" : "Add Supplier"}
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
        <h2>All Suppliers ({suppliers.length})</h2>

        {loading ? (
          <p>Loading suppliers...</p>
        ) : suppliers.length === 0 ? (
          <p>No suppliers added yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Lead Time</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.phone || "—"}</td>
                    <td>{supplier.email || "—"}</td>
                    <td>{supplier.leadTime} days</td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(supplier)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(supplier._id)}
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

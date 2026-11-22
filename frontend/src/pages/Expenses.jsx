
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../App.css";

const initialForm = {
  date: new Date().toLocaleDateString("en-CA"),
  type: "",
  amount: "",
  description: "",
};

export default function Expenses() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadExpenses = async () => {
    try {
      const response = await api.get("/expenses");
      setExpenses(response.data.expenses || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Expenses load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
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

    const amount = Number(form.amount);

    if (!form.type.trim()) {
      setError("Expense type required hai.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Valid amount enter karo.");
      return;
    }

    const payload = {
      date: form.date,
      type: form.type.trim(),
      amount,
      description: form.description.trim(),
    };

    try {
      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
        setMessage("Expense updated successfully.");
      } else {
        await api.post("/expenses", payload);
        setMessage("Expense recorded successfully.");
      }

      resetForm();
      await loadExpenses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Expense save nahi ho paaya."
      );
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);

    const expenseDate = new Date(expense.date);
    const localDate = [
      expenseDate.getFullYear(),
      String(expenseDate.getMonth() + 1).padStart(2, "0"),
      String(expenseDate.getDate()).padStart(2, "0"),
    ].join("-");

    setForm({
      date: localDate,
      type: expense.type || "",
      amount: String(expense.amount ?? ""),
      description: expense.description || "",
    });

    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya tum ye expense delete karna chahte ho?")) {
      return;
    }

    try {
      await api.delete(`/expenses/${id}`);
      setMessage("Expense deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadExpenses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Expense delete nahi ho paaya."
      );
    }
  };

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Expenses Management</h1>
          <p>Track and manage your business expenses.</p>
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
        <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Expense Date *
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Expense Type *
            <input
              type="text"
              name="type"
              placeholder="e.g. Electricity, Rent, Salary"
              value={form.type}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Amount (₹) *
            <input
              type="number"
              name="amount"
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              placeholder="Enter expense details"
              value={form.description}
              onChange={handleChange}
              rows="3"
            />
          </label>

          <div className="product-form-actions">
            <button type="submit" className="primary-btn">
              {editingId ? "Update Expense" : "Save Expense"}
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
        <h2>Expense Records ({expenses.length})</h2>

        <div className="sales-revenue-preview">
          <span>Total Expenses</span>
          <strong>
            ₹{totalExpenses.toLocaleString("en-IN")}
          </strong>
        </div>

        {loading ? (
          <p>Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p>No expenses recorded yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>
                      {new Date(expense.date).toLocaleDateString("en-IN")}
                    </td>
                    <td>{expense.type}</td>
                    <td>₹{expense.amount}</td>
                    <td>{expense.description || "-"}</td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(expense)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(expense._id)}
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

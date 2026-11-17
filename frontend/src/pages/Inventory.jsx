
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../App.css";


const initialForm = {
  product: "",
  openingStock: "0",
};


export default function Inventory() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const closingStock =
  Number(form.openingStock || 0);

  const loadData = async () => {
    try {
      const [inventoryResponse, productsResponse] = await Promise.all([
        api.get("/inventory"),
        api.get("/products"),
      ]);

      setInventory(inventoryResponse.data.inventory || []);
      setProducts(
        Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data.products || []
      );
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Inventory ya products load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const opening = Number(form.openingStock);

  if (!form.product) {
    setError("Please select a product.");
    return;
  }

  if (!Number.isFinite(opening) || opening < 0) {
    setError("Opening stock zero ya positive hona chahiye.");
    return;
  }

  const payload = {
    product: form.product,
    openingStock: opening,
  };

  try {
    if (editingId) {
      await api.put(`/inventory/${editingId}`, {
        openingStock: opening,
      });
      setMessage("Inventory updated successfully.");
    } else {
      await api.post("/inventory", payload);
      setMessage("Inventory created successfully.");
    }

    resetForm();
    await loadData();
  } catch (err) {
    const errorMessage =
      err.response?.data?.error ||
      err.response?.data?.message ||
      "";

    if (
      err.response?.status === 500 &&
      errorMessage.includes("E11000")
    ) {
      setError(
        "Is product ka inventory record pehle se hai. Edit button use karo."
      );
    } else {
      setError(errorMessage || "Inventory save nahi ho paayi.");
    }
  }
};





  const handleEdit = (item) => {
  setEditingId(item._id);

  setForm({
    product: item.product?._id || item.product || "",
    openingStock: String(item.openingStock ?? 0),
  });

  setError("");
  setMessage("");

  window.scrollTo({ top: 0, behavior: "smooth" });
};

  const handleDelete = async (id) => {
    if (!window.confirm("Kya tum ye inventory record delete karna chahte ho?")) {
      return;
    }

    try {
      await api.delete(`/inventory/${id}`);
      setMessage("Inventory record deleted.");
      if (editingId === id) resetForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Inventory delete nahi ho paayi."
      );
    }
  };

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Inventory Management</h1>
          <p>Track stock levels for your products.</p>
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
        <h2>{editingId ? "Edit Inventory" : "Add Inventory Record"}</h2>

        {products.length === 0 && !loading && (
          <p>Add a product before creating an inventory record.</p>
        )}

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Product *
            <select
              name="product"
              value={form.product}
              onChange={handleChange}
              required
              disabled={Boolean(editingId)}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} ({product.productId})
                </option>
              ))}
            </select>
          </label>

          <label>
            Opening Stock *
            <input
              type="number"
              name="openingStock"
              min="0"
              step="1"
              value={form.openingStock}
              onChange={handleChange}
              required
            />
          </label>

        

   

          <div className="sales-revenue-preview">
            <span>Calculated Closing Stock</span>
            <strong>{closingStock}</strong>
          </div>

          <div className="product-form-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={products.length === 0 || closingStock < 0}
            >
              {editingId ? "Update Inventory" : "Save Inventory"}
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
        <h2>Inventory Records ({inventory.length})</h2>

        {loading ? (
          <p>Loading inventory...</p>
        ) : inventory.length === 0 ? (
          <p>No inventory records available yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Opening Stock</th>
                  <th>Received</th>
                  <th>Sold</th>
                  <th>Closing Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((item) => (
                  <tr key={item._id}>
                    <td>{item.product?.name || "Product unavailable"}</td>
                    <td>{item.openingStock}</td>
                    <td>{item.stockReceived}</td>
                    <td>{item.quantitySold}</td>
                    <td>{item.closingStock}</td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(item._id)}
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

import { useEffect, useState } from "react";
import api from "../services/api";
import "../App.css";

const initialForm = {
  date: new Date().toISOString().slice(0, 10),
  product: "",
  quantitySold: "1",
  sellingPrice: "",
  discount: "0",
  promotion: false,
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const [salesResponse, productsResponse] = await Promise.all([
        api.get("/sales"),
        api.get("/products"),
      ]);

      setSales(salesResponse.data.sales || []);
      setProducts(
        Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data.products || []
      );
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Sales ya products load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(name === "product" && !editingId
        ? {
            sellingPrice:
              products.find((p) => p._id === value)?.sellingPrice ?? "",
          }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const quantity = Number(form.quantitySold);
    const price = Number(form.sellingPrice);
    const discount = Number(form.discount);

    if (!form.product) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > price
    ) {
      setError("Quantity, price ya discount ki value check karo.");
      return;
    }

    const revenue = Math.max(0, quantity * (price - discount));

    const payload = {
      date: form.date,
      product: form.product,
      quantitySold: quantity,
      sellingPrice: price,
      discount,
      promotion: form.promotion,
      revenue,
    };

    try {
      if (editingId) {
        await api.put(`/sales/${editingId}`, payload);
        setMessage("Sale updated successfully.");
      } else {
        await api.post("/sales", payload);
        setMessage("Sale recorded successfully.");
      }

      setForm(initialForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Sale save nahi ho paayi."
      );
    }
  };

  const handleEdit = (sale) => {
    setEditingId(sale._id);
    setForm({
      date: sale.date ? new Date(sale.date).toISOString().slice(0, 10) : "",
      product: sale.product?._id || sale.product || "",
      quantitySold: String(sale.quantitySold ?? 1),
      sellingPrice: String(sale.sellingPrice ?? ""),
      discount: String(sale.discount ?? 0),
      promotion: Boolean(sale.promotion),
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya tum ye sale delete karna chahte ho?")) {
      return;
    }

    try {
      await api.delete(`/sales/${id}`);
      setMessage("Sale deleted successfully.");
      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Sale delete nahi ho paayi."
      );
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setMessage("");
  };

  const totalRevenue = sales.reduce(
    (total, sale) => total + Number(sale.revenue || 0),
    0
  );

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Sales Management</h1>
          <p>Record and manage your store sales.</p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={() => (window.location.href = "/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <section className="dashboard-cards">
        <div className="dashboard-card">
          <p>Total Sales Records</p>
          <h2>{sales.length}</h2>
        </div>
        <div className="dashboard-card">
          <p>Total Revenue</p>
          <h2>
            ₹{totalRevenue.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </h2>
        </div>
      </section>

      {error && <p className="products-error">{error}</p>}
      {message && <p className="sales-success">{message}</p>}

      <section className="product-form-card">
        <h2>{editingId ? "Edit Sale" : "Record New Sale"}</h2>

        {products.length === 0 && !loading && (
          <p>Add a product before recording a sale.</p>
        )}

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Sale Date *
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Product *
            <select
              name="product"
              value={form.product}
              onChange={handleChange}
              required
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
            Quantity Sold *
            <input
              type="number"
              name="quantitySold"
              min="1"
              step="1"
              value={form.quantitySold}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Selling Price per Unit (₹) *
            <input
              type="number"
              name="sellingPrice"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Discount per Unit (₹)
            <input
              type="number"
              name="discount"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={handleChange}
            />
          </label>

          <label className="sales-checkbox">
            <input
              type="checkbox"
              name="promotion"
              checked={form.promotion}
              onChange={handleChange}
            />
            Promotion applied
          </label>

          <div className="sales-revenue-preview">
            <span>Estimated Revenue</span>
            <strong>
              ₹
              {Math.max(
                0,
                Number(form.quantitySold || 0) *
                  (Number(form.sellingPrice || 0) -
                    Number(form.discount || 0))
              ).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>

          <div className="product-form-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={products.length === 0}
            >
              {editingId ? "Update Sale" : "Record Sale"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="products-list-card">
        <h2>Sales History</h2>

        {loading ? (
          <p>Loading sales...</p>
        ) : sales.length === 0 ? (
          <p>No sales records available yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Discount / Unit</th>
                  <th>Revenue</th>
                  <th>Promotion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>
                      {sale.date
                        ? new Date(sale.date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>{sale.product?.name || "Product unavailable"}</td>
                    <td>{sale.quantitySold}</td>
                    <td>₹{sale.sellingPrice}</td>
                    <td>₹{sale.discount || 0}</td>
                    <td>₹{sale.revenue}</td>
                    <td>{sale.promotion ? "Yes" : "No"}</td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(sale)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(sale._id)}
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

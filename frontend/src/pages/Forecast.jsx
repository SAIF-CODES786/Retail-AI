
import { useEffect, useState } from "react";
import api from "../services/api";
import "../App.css";

const initialForm = {
  productId: "",
  forecastDate: new Date().toISOString().slice(0, 10),
  horizon: "7",
};

export default function Forecast() {
  const [products, setProducts] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const [productResponse, forecastResponse] = await Promise.all([
        api.get("/products"),
        api.get("/forecasts"),
      ]);

      setProducts(
        Array.isArray(productResponse.data)
          ? productResponse.data
          : productResponse.data.products || []
      );

      setForecasts(forecastResponse.data.forecasts || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Forecast data load nahi ho paaya."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.productId || !form.forecastDate || Number(form.horizon) < 1) {
      setError("Please enter valid forecast details.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/forecasts/predict", {
        productId: form.productId,
        forecastDate: form.forecastDate,
        horizon: Number(form.horizon),
      });

      setMessage(
        `Prediction generated successfully! Estimated sales: ₹${Number(
          response.data.prediction
        ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
      );

      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "ML prediction failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this forecast?")) return;

    try {
      await api.delete(`/forecasts/${id}`);
      setMessage("Forecast deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Forecast delete nahi ho paaya."
      );
    }
  };

  const totalPredictedSales = forecasts.reduce(
    (total, item) => total + Number(item.predictedSales || 0),
    0
  );

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Sales Forecasting</h1>
          <p>Generate AI-powered retail sales predictions.</p>
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
          <p>Total Forecasts</p>
          <h2>{forecasts.length}</h2>
        </div>

        <div className="dashboard-card">
          <p>Total Predicted Sales</p>
          <h2>
            ₹{totalPredictedSales.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </h2>
        </div>
      </section>

      {error && <p className="products-error">{error}</p>}
      {message && <p className="sales-success">{message}</p>}

      <section className="product-form-card">
        <h2>Generate New Prediction</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Select Product *
            <select
              name="productId"
              value={form.productId}
              onChange={handleChange}
              required
            >
              <option value="">Choose Product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} ({product.productId})
                </option>
              ))}
            </select>
          </label>

          <label>
            Forecast Date *
            <input
              type="date"
              name="forecastDate"
              value={form.forecastDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Forecast Horizon (Days) *
            <input
              type="number"
              name="horizon"
              min="1"
              max="365"
              value={form.horizon}
              onChange={handleChange}
              required
            />
          </label>

          <div className="product-form-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={saving || products.length === 0}
            >
              {saving ? "Generating..." : "Generate Prediction"}
            </button>
          </div>
        </form>

        {products.length === 0 && !loading && (
          <p>Add a product before generating predictions.</p>
        )}
      </section>

      <section className="products-list-card">
        <h2>Forecast History</h2>

        {loading ? (
          <p>Loading forecasts...</p>
        ) : forecasts.length === 0 ? (
          <p>No forecasts available yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Forecast Date</th>
                  <th>Horizon</th>
                  <th>Predicted Sales</th>
                  <th>ML Model</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {forecasts.map((forecast) => (
                  <tr key={forecast._id}>
                    <td>
                      {forecast.product?.name || "Product unavailable"}
                    </td>
                    <td>
                      {forecast.forecastDate
                        ? new Date(forecast.forecastDate).toLocaleDateString(
                            "en-IN"
                          )
                        : "—"}
                    </td>
                    <td>{forecast.horizon} days</td>
                    <td>
                      ₹
                      {Number(forecast.predictedSales || 0).toLocaleString(
                        "en-IN",
                        { maximumFractionDigits: 2 }
                      )}
                    </td>
                    <td>{forecast.modelUsed}</td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(forecast._id)}
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

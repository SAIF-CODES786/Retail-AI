
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import api from "../services/api";
import "../App.css";

export default function Dashboard() {
  const [reorderRecommendations, setReorderRecommendations] = useState([]);
  const [xaiData, setXaiData] = useState([]);
  const [forecastComparisons, setForecastComparisons] = useState([]);
  const [data, setData] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [sales, setSales] = useState([]);
  const [inventoryRecommendations, setInventoryRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const [dashboardResponse, salesResponse, forecastResponse,inventoryResponse,xaiResponse,reorderResponse,forecastComparisonResponse] =
          await Promise.all([
            api.get("/dashboard"),
            api.get("/sales"),
            api.get("/forecasts"),
            api.get("/inventory/recommendations"),
            api.get("/xai"),
            api.get("/reorder"),
            api.get("/forecasts/comparison"),
          ]);

        setData(dashboardResponse.data);

        const salesData =
          salesResponse.data.sales || salesResponse.data;

        setSales(Array.isArray(salesData) ? salesData : []);

        setForecasts(
          forecastResponse.data.forecasts || []
        );

      setInventoryRecommendations(
  inventoryResponse.data.recommendations || []
);

setXaiData(
  xaiResponse.data.explanation?.feature_importance || []
);

setReorderRecommendations(
  reorderResponse.data.recommendations || []
);

setForecastComparisons(
  forecastComparisonResponse.data.comparisons || []
);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Dashboard data load nahi ho paaya."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) return <p>Loading dashboard...</p>;

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Dashboard Error</h2>
        <p>{error}</p>
        <button onClick={handleLogout}>Back to Login</button>
      </div>
    );
  }

  const summary = data?.summary ?? data ?? {};

  const totalPredictedSales = forecasts.reduce(
    (total, forecast) =>
      total + Number(forecast.predictedSales || 0),
    0
  );

  // Monthly sales analytics
  const monthlyMap = {};

  sales.forEach((sale) => {
    if (!sale.date) return;

    const date = new Date(sale.date);
    const month = date.toLocaleString("en-IN", {
      month: "short",
      year: "2-digit",
    });

    if (!monthlyMap[month]) {
      monthlyMap[month] = 0;
    }

    monthlyMap[month] += Number(sale.revenue || 0);
  });

  const monthlySales = Object.entries(monthlyMap).map(
    ([month, revenue]) => ({
      month,
      revenue: Number(revenue.toFixed(2)),
    })
  );

  
  // Product-wise Revenue Analysis
  const productMap = {};

  sales.forEach((sale) => {
    // Ignore sales whose product no longer exists
    if (!sale.product?._id || !sale.product?.name) return;

    const productId = sale.product._id;

    if (!productMap[productId]) {
      productMap[productId] = {
        product: sale.product.name,
        actualRevenue: 0,
        predictedSales: 0,
      };
    }

    productMap[productId].actualRevenue += Number(sale.revenue || 0);
  });

  forecasts.forEach((forecast) => {
    // Ignore forecasts with missing/deleted products
    if (!forecast.product?._id || !forecast.product?.name) return;

    const productId = forecast.product._id;

    if (!productMap[productId]) {
      productMap[productId] = {
        product: forecast.product.name,
        actualRevenue: 0,
        predictedSales: 0,
      };
    }

    productMap[productId].predictedSales += Number(
      forecast.predictedSales || 0
    );
  });

  const productAnalysis = Object.values(productMap).map((item) => ({
    ...item,
    actualRevenue: Number(item.actualRevenue.toFixed(2)),
    predictedSales: Number(item.predictedSales.toFixed(2)),
  }));

  // Product-wise Demand Analysis
  const demandMap = {};

  sales.forEach((sale) => {
    if (!sale.product?._id || !sale.product?.name) return;

    const productId = sale.product._id;

    if (!demandMap[productId]) {
      demandMap[productId] = {
        product: sale.product.name,
        totalQuantity: 0,
      };
    }

    demandMap[productId].totalQuantity += Number(
      sale.quantitySold || 0
    );
  });

  const demandAnalysis = Object.values(demandMap);


  

  const cards = [
    {
      title: "Total Products",
      value: summary.totalProducts ?? 0,
    },
    {
      title: "Total Sales Records",
      value: summary.totalSales ?? 0,
    },
    {
      title: "Total Revenue",
      value: `₹${Number(summary.totalRevenue ?? 0).toLocaleString("en-IN")}`,
    },
    {
      title: "Inventory Items",
      value: summary.totalInventoryItems ?? 0,
    },
    {
      title: "Total Expenses",
      value: `₹${Number(summary.totalExpenses ?? 0).toLocaleString("en-IN")}`,
    },
    {
      title: "Total Forecasts",
      value: forecasts.length,
    },
    {
      title: "Total Predicted Sales",
      value: `₹${totalPredictedSales.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`,
    },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Retail AI</h1>
          <p>Retail Decision Support Dashboard</p>
        </div>

        <div className="dashboard-header-actions">
          <button onClick={() => navigate("/products")}>
            Manage Products
          </button>

          <button onClick={() => navigate("/sales")}>
            Manage Sales
          </button>

          <button onClick={() => navigate("/inventory")}>
            Manage Inventory
          </button>

          <button onClick={() => navigate("/forecasts")}>
            Sales Forecasting
          </button>

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-welcome">
        <h2>Welcome to your Dashboard</h2>
        <p>Monitor your retail business performance in one place.</p>
      </section>

      <section className="dashboard-cards">
        {cards.map((card) => (
          <div className="dashboard-card" key={card.title}>
            <p>{card.title}</p>
            <h2>{card.value}</h2>
          </div>
        ))}
      </section>

      {/* Monthly Sales Analytics */}
      <section className="dashboard-table-section">
        <h2>Monthly Sales Analytics</h2>

        {monthlySales.length > 0 ? (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Actual Revenue (₹)"
                  stroke="#16745d"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No sales analytics available yet.</p>
        )}
      </section>

      {/* Product-wise Analysis */}
      <section className="dashboard-table-section">
        <h2>Product-wise Revenue Analysis</h2>

        {productAnalysis.length > 0 ? (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={productAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="actualRevenue"
                  name="Actual Revenue (₹)"
                  fill="#16745d"
                />
                <Bar
                  dataKey="predictedSales"
                  name="Predicted Sales (₹)"
                  fill="#e5a23b"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No product analysis available yet.</p>
        )}
      </section>
      

{/* Product-wise Demand Analysis */}
<section className="dashboard-table-section">
  <h2>Product-wise Demand Analysis</h2>

  {demandAnalysis.length > 0 ? (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={demandAnalysis}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="product" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="totalQuantity"
            name="Units Sold"
            fill="#4285f4"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <p>No product demand data available yet.</p>
  )}
</section>


{/* Inventory Optimization Recommendations */}
<section className="dashboard-table-section">
  <h2>Inventory Optimization Recommendations</h2>

  {inventoryRecommendations.length > 0 ? (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Current Stock</th>
            <th>Average Daily Sales</th>
            <th>Reorder Point</th>
            <th>Recommended Quantity</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {inventoryRecommendations.map((item, index) => (
            <tr key={item.productId || index}>
              <td>{item.product}</td>
              <td>{item.currentStock}</td>
              <td>{item.averageDailySales}</td>
              <td>{item.reorderPoint}</td>
              <td>{item.recommendedQuantity}</td>
              <td>
                <span
                  style={{
                    color:
                      item.status === "Reorder Required"
                        ? "#dc2626"
                        : item.status === "Overstock"
                        ? "#d97706"
                        : "#16a34a",
                    fontWeight: "bold",
                  }}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p>No inventory recommendations available yet.</p>
  )}
</section>



{/* Explainable AI Analysis */}
<section className="dashboard-table-section">
  <h2>Explainable AI - Feature Importance</h2>
  <p>
    Top factors influencing the Random Forest model's predictions.
  </p>

  {xaiData.length > 0 ? (
    <div style={{ width: "100%", height: 420 }}>
      <ResponsiveContainer>
        <BarChart
          data={xaiData.slice(0, 10)}
          layout="vertical"
          margin={{ left: 30, right: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, "auto"]}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={220}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Importance"]}
          />
          <Bar
            dataKey="importance_percent"
            name="Feature Importance"
            fill="#8b5cf6"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <p>XAI data not available yet.</p>
  )}
</section>



{/* Smart Reorder Recommendations */}
<section className="dashboard-table-section">
  <h2>Smart Reorder Recommendations</h2>

  {reorderRecommendations.length > 0 ? (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Current Stock</th>
            <th>Reorder Quantity</th>
            <th>Priority</th>
            <th>Supplier</th>
            <th>Estimated Cost</th>
          </tr>
        </thead>

        <tbody>
          {reorderRecommendations.map((item, index) => (
            <tr key={item.productId || index}>
              <td>{item.product}</td>
              <td>{item.currentStock}</td>
              <td>{item.recommendedQuantity}</td>

              <td>
                <span
                  style={{
                    color:
                      item.priority === "High"
                        ? "#dc2626"
                        : item.priority === "Medium"
                        ? "#d97706"
                        : "#16a34a",
                    fontWeight: "bold",
                  }}
                >
                  {item.priority}
                </span>
              </td>

              <td>
                {item.supplier?.name || "Not Assigned"}
              </td>

              <td>
                ₹{Number(item.estimatedCost || 0).toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p>No reorder recommendations available.</p>
  )}
</section>



{/* Forecast vs Actual Sales Comparison */}
<section className="dashboard-table-section">
  <h2>Forecast vs Actual Sales Comparison</h2>

  {forecastComparisons.filter((item) => item.product).length > 0 ? (
    <>
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <BarChart data={forecastComparisons
            .filter((item) => item.product)
            .map((item) => ({
              ...item,
              label: `${item.product.name} (${new Date(
                item.forecastDate
              ).toLocaleDateString("en-IN")})`,
            }))
          }>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(value) =>
                `₹${Number(value).toLocaleString("en-IN")}`
              }
            />
            <Legend />
            <Bar
              dataKey="predictedSales"
              name="Predicted Sales (₹)"
              fill="#e5a23b"
            />
            <Bar
              dataKey="actualSales"
              name="Actual Sales (₹)"
              fill="#16745d"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Predicted Sales</th>
              <th>Actual Sales</th>
              <th>Variance</th>
              <th>Accuracy</th>
            </tr>
          </thead>

          <tbody>
            {forecastComparisons.filter((item) => item.product).map((item) => (
              <tr key={item.forecastId}>
                <td>{item.product?.name || "Unavailable"}</td>
                <td>
                  ₹{Number(item.predictedSales || 0).toLocaleString("en-IN")}
                </td>
                <td>
                  {item.actualSales == null
                    ? "—"
                    : `₹${Number(item.actualSales).toLocaleString("en-IN")}`}
                </td>
                <td>
                  {item.variance == null
                    ? "—"
                    : `₹${Number(item.variance).toLocaleString("en-IN")}`}
                </td>
                <td>
                  {item.accuracy == null
                    ? "N/A"
                    : `${Number(item.accuracy).toFixed(2)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <p>No forecast comparison data available yet.</p>
  )}
</section>


      {/* Recent Sales */}
      <section className="dashboard-table-section">
        <h2>Recent Sales</h2>

        {data?.recentSales?.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Revenue</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {data.recentSales.map((sale) => (
                  <tr key={sale._id}>
                    <td>
                      {sale.product?.name || "Product unavailable"}
                    </td>
                    <td>{sale.quantitySold ?? 0}</td>
                    <td>
                      ₹{Number(sale.revenue ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td>
                      {sale.date
                        ? new Date(sale.date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No sales records available yet.</p>
        )}
      </section>

      {/* Latest ML Predictions */}
      <section className="dashboard-table-section">
        <h2>Latest ML Predictions</h2>

        {forecasts.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Forecast Date</th>
                  <th>Horizon</th>
                  <th>Predicted Sales</th>
                  <th>ML Model</th>
                </tr>
              </thead>

              <tbody>
                {forecasts.slice(0, 5).map((forecast) => (
                  <tr key={forecast._id}>
                    <td>
                      {forecast.product?.name || "Product unavailable"}
                    </td>
                    <td>
                      {forecast.forecastDate
                        ? new Date(forecast.forecastDate).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>{forecast.horizon} days</td>
                    <td>
                      ₹{Number(forecast.predictedSales || 0).toLocaleString(
                        "en-IN",
                        { maximumFractionDigits: 2 }
                      )}
                    </td>
                    <td>{forecast.modelUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No ML predictions available yet.</p>
        )}

        <button
          onClick={() => navigate("/forecasts")}
          style={{ marginTop: "16px" }}
        >
          View All Forecasts
        </button>
      </section>
    </div>
  );
}


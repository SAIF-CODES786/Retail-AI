const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const purchaseRoutes = require("./routes/purchases");
const supplierRoutes = require("./routes/suppliers");
const inventoryRoutes = require("./routes/inventory");
const expenseRoutes = require("./routes/expenses");
const forecastRoutes = require("./routes/forecast");
const dashboardRoutes = require("./routes/dashboard");
const outletRoutes = require("./routes/outletRoutes");
const xaiRoutes = require("./routes/xaiRoutes");
const reorderRoutes = require("./routes/reorderRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Retail AI Backend is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/forecasts", forecastRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/outlets", outletRoutes);
app.use("/api/xai", xaiRoutes);
app.use("/api/reorder", reorderRoutes);

// Connect to MongoDB, then start server ONCE
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB Connected");
    console.log("MongoDB State:", mongoose.connection.readyState);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup Error:", error.message);
    process.exit(1);
  }
};

startServer();

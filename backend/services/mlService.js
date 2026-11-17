
const axios = require("axios");

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

// Existing sales prediction
const predictRetailSales = async (inputData) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      inputData,
      { timeout: 15000 }
    );

    return response.data;
  } catch (error) {
    console.error(
      "ML Service Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.detail ||
        "Unable to connect to ML prediction service."
    );
  }
};

// New Explainable AI function
const explainRetailModel = async () => {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/explain`,
      { timeout: 15000 }
    );

    return response.data;
  } catch (error) {
    console.error(
      "XAI Service Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.detail ||
        "Unable to fetch model explanation."
    );
  }
};

module.exports = {
  predictRetailSales,
  explainRetailModel,
};

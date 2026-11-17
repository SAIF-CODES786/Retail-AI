
const { explainRetailModel } = require("../services/mlService");

const getModelExplanation = async (req, res) => {
  try {
    const explanation = await explainRetailModel();

    return res.status(200).json({
      message: "XAI explanation fetched successfully",
      explanation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch XAI explanation",
      error: error.message,
    });
  }
};

module.exports = { getModelExplanation };

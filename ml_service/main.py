import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="Retail AI Sales Prediction API",
    version="1.0.0"
)

# Load trained pipeline
model = joblib.load("retail_sales_model.joblib")


class PredictionInput(BaseModel):
    Item_Identifier: str
    Item_Weight: Optional[float] = None
    Item_Fat_Content: str
    Item_Visibility: float
    Item_Type: str
    Item_MRP: float
    Outlet_Identifier: str
    Outlet_Establishment_Year: int
    Outlet_Size: Optional[str] = None
    Outlet_Location_Type: str
    Outlet_Type: str


@app.get("/")
def home():
    return {"message": "Retail AI Prediction API is running"}


@app.post("/predict")
def predict_sales(data: PredictionInput):
    try:
        input_data = data.model_dump()

        # Normalize inconsistent category values
        input_data["Item_Fat_Content"] = {
            "low fat": "Low Fat",
            "LF": "Low Fat",
            "reg": "Regular"
        }.get(
            input_data["Item_Fat_Content"],
            input_data["Item_Fat_Content"]
        )

        df = pd.DataFrame([input_data])

        prediction = model.predict(df)[0]

        return {
            "predicted_sales": round(float(prediction), 2),
            "currency": "INR"
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )



# EXPLAINABLE AI - GLOBAL FEATURE IMPORTANCE

@app.get("/explain")
def explain_model():
    try:
        # Find Random Forest estimator inside pipeline
        steps = list(model.named_steps.values())

        estimator = next(
            (
                step for step in reversed(steps)
                if hasattr(step, "feature_importances_")
            ),
            None
        )

        if estimator is None:
            raise ValueError(
                "Random Forest feature importance not found."
            )

        # Get transformed feature names
        preprocessor = next(
            (
                step for step in steps
                if hasattr(step, "get_feature_names_out")
                and step is not estimator
            ),
            None
        )

        if preprocessor is not None:
            feature_names = preprocessor.get_feature_names_out()
        else:
            feature_names = [
                f"Feature {i + 1}"
                for i in range(len(estimator.feature_importances_))
            ]

        importances = estimator.feature_importances_

        if len(feature_names) != len(importances):
            raise ValueError("Feature names and importance mismatch.")

        results = [
            {
                "feature": str(name),
                "importance": round(float(score), 5),
                "importance_percent": round(float(score) * 100, 2)
            }
            for name, score in zip(feature_names, importances)
        ]

        results.sort(
            key=lambda x: x["importance"],
            reverse=True
        )

        return {
            "message": "Model explanation generated successfully",
            "explanation_type": "Global Feature Importance",
            "total_features": len(results),
            "feature_importance": results[:15]
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

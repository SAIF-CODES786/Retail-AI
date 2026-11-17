
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error


# 1. Load dataset
df = pd.read_csv("Train[1].csv")

# 2. Normalize inconsistent category values
df["Item_Fat_Content"] = df["Item_Fat_Content"].replace({
    "low fat": "Low Fat",
    "LF": "Low Fat",
    "reg": "Regular"
})

# 3. Separate features and target
X = df.drop(columns=["Item_Outlet_Sales"])
y = df["Item_Outlet_Sales"]

# 4. Identify column types
numeric_features = [
    "Item_Weight",
    "Item_Visibility",
    "Item_MRP",
    "Outlet_Establishment_Year"
]

categorical_features = [
    "Item_Identifier",
    "Item_Fat_Content",
    "Item_Type",
    "Outlet_Identifier",
    "Outlet_Size",
    "Outlet_Location_Type",
    "Outlet_Type"
]

# 5. Preprocessing
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median"))
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer(transformers=[
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# 6. Random Forest model
random_forest = RandomForestRegressor(
    n_estimators=100,
    max_depth=5,
    max_features=1.0,
    random_state=0
)

# 7. Complete pipeline
model = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("regressor", random_forest)
])

# 8. Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 9. Train
model.fit(X_train, y_train)

# 10. Evaluate
predictions = model.predict(X_test)

print("\nMODEL EVALUATION")
print("R2 Score:", round(r2_score(y_test, predictions), 4))
print("MAE:", round(mean_absolute_error(y_test, predictions), 2))
print("RMSE:", round(mean_squared_error(y_test, predictions) ** 0.5, 2))

# 11. Save complete pipeline
joblib.dump(model, "retail_sales_model.joblib")

print("\nModel saved successfully!")

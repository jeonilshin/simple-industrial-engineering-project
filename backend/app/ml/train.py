"""Train the workforce-demand Random Forest and persist it for the API.

Run after generate_data.py: python -m app.ml.train
"""
from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
CSV_PATH = DATA_DIR / "manufacturing.csv"
MODEL_PATH = DATA_DIR / "workforce_model.joblib"

FEATURES = [
    "Production_Target",
    "Orders",
    "Machines",
    "Available_Workers",
    "Average_Skill",
    "Overtime",
]
TARGET = "Actual_Workers"


def main() -> None:
    df = pd.read_csv(CSV_PATH)
    X, y = df[FEATURES], df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print(f"R²  : {r2_score(y_test, preds):.3f}")
    print(f"MAE : {mean_absolute_error(y_test, preds):.2f} workers")

    joblib.dump({"model": model, "features": FEATURES}, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()

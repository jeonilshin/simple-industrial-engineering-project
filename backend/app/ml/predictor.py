"""Lazy-loaded wrapper around the trained Random Forest."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np

MODEL_PATH = Path(__file__).resolve().parents[2] / "data" / "workforce_model.joblib"


@lru_cache(maxsize=1)
def _load() -> dict[str, Any]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Run: python -m app.ml.generate_data && python -m app.ml.train"
        )
    return joblib.load(MODEL_PATH)


def predict_workers(
    production_target: int,
    orders: int,
    machines: int,
    available_workers: int,
    average_skill: float,
    overtime: int,
) -> dict[str, float]:
    bundle = _load()
    model = bundle["model"]
    features = [[production_target, orders, machines, available_workers, average_skill, overtime]]

    point = float(model.predict(features)[0])
    tree_preds = np.array([t.predict(features)[0] for t in model.estimators_])
    std = float(tree_preds.std())
    confidence = max(0.5, min(0.99, 1.0 - std / max(point, 1.0)))

    return {
        "predicted_workers": int(round(point)),
        "raw_prediction": round(point, 2),
        "confidence": round(confidence, 3),
        "std": round(std, 3),
    }

"""
model.py — NAFLD / Metabolic Risk prediction using the trained LightGBM pipeline.

The pipeline was trained on the Int J Obesity dataset with these EXACT
feature names and units. DO NOT change them without retraining.

Input units expected from Laravel (mg/dL for lipids/glucose).
Conversions to mmol/L happen here before the DataFrame is built.

Conversion factors:
  Triglycerides  mg/dL → mmol/L : ÷ 88.57
  HDL            mg/dL → mmol/L : ÷ 38.67
  Total Chol     mg/dL → mmol/L : ÷ 38.67
  Fasting Glucose mg/dL → mmol/L : ÷ 18.0
"""

from __future__ import annotations

import logging
import math
import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from exceptions import FeatureMismatchError, ModelNotLoadedError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model path — in backend-app/public/model/ so it can be updated independently
# ---------------------------------------------------------------------------
MODEL_PATH       = Path(__file__).parent.parent / "backend-app" / "public" / "model" / "nafld_pipeline.pkl"
_LOCAL_PATH      = Path(__file__).parent / "models" / "nafld_pipeline.pkl"

# ---------------------------------------------------------------------------
# EXACT feature column names the pipeline was trained on.
# Order must match X.columns.tolist() from the notebook.
# ---------------------------------------------------------------------------
FEATURE_COLUMNS: list[str] = [
    "Sex, 1:Men, 2:Women",                    # 0=Male  1=Female
    "Baseline Age, yrs",
    "Baseline Fatty liver 0/1",               # 0=No  1=Yes
    "Baseline BMI, kg/m2",
    "Baseline Waist circumference(WC), cm",
    "Baseline ALT, IU/L",
    "Baseline AST, IU/L",
    "Baseline Body Weight, kg",
    "Baseline GGT, IU/L",
    "Baseline HDL-cholesterol, mmol/L",       # converted from mg/dL
    "Baseline Total Cholesterol, mmol/L",     # converted from mg/dL
    "Baseline Triglycerides, mmol/L",         # converted from mg/dL
    "Baseline HbA1c, %",
    "Baseline Fasting plasma glucose, mmol/L", # converted from mg/dL
    "Baseline Systolic blood pressure, mmHg",
    "Baseline Diastolic blood pressure, mmHg",
    "TyG",                                    # ln(TG_mmol × Glucose_mmol / 2)
    "TyG_BMI",                                # TyG × BMI
    "TyG_WC",                                 # TyG × Waist circumference
    "TG_HDL",                                 # TG_mmol / HDL_mmol
]

# Training-set mean values for manual imputation fallback.
# Used only when incoming values are None (pipeline has a StandardScaler but no imputer).
TRAINING_MEANS: dict[str, float] = {
    "Sex, 1:Men, 2:Women":                    0.50,
    "Baseline Age, yrs":                      42.0,
    "Baseline Fatty liver 0/1":               0.02,
    "Baseline BMI, kg/m2":                    23.5,
    "Baseline Waist circumference(WC), cm":   82.0,
    "Baseline ALT, IU/L":                     24.0,
    "Baseline AST, IU/L":                     22.0,
    "Baseline Body Weight, kg":               65.0,
    "Baseline GGT, IU/L":                     25.0,
    "Baseline HDL-cholesterol, mmol/L":       1.45,
    "Baseline Total Cholesterol, mmol/L":     5.10,
    "Baseline Triglycerides, mmol/L":         1.10,
    "Baseline HbA1c, %":                      5.5,
    "Baseline Fasting plasma glucose, mmol/L": 5.2,
    "Baseline Systolic blood pressure, mmHg": 120.0,
    "Baseline Diastolic blood pressure, mmHg": 75.0,
    "TyG":                                    8.40,
    "TyG_BMI":                               197.0,
    "TyG_WC":                                688.0,
    "TG_HDL":                                 0.76,
}

_pipeline: Any = None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_model() -> None:
    global _pipeline
    path = MODEL_PATH if MODEL_PATH.exists() else _LOCAL_PATH

    if not path.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH} or {_LOCAL_PATH}.\n"
            "Run:  cd backend-app/public/model && python export_model.py"
        )

    with open(path, "rb") as f:
        _pipeline = pickle.load(f)

    logger.info("Pipeline loaded from %s", path)
    _verify_feature_names()


def get_pipeline() -> Any:
    if _pipeline is None:
        raise ModelNotLoadedError("Model not loaded.")
    return _pipeline


def predict(raw: dict) -> dict:
    """
    raw keys (from Laravel / BloodTestInput):
      sex, age, has_fatty_liver, bmi, waist_circumference,
      alt, ast, body_weight, ggt,
      hdl_mgdl, total_cholesterol_mgdl, triglycerides_mgdl,
      hba1c, fasting_glucose_mgdl,
      blood_pressure_systolic, blood_pressure_diastolic
    """
    pipeline = get_pipeline()
    df = _build_frame(raw)

    proba      = pipeline.predict_proba(df)
    nafld_prob = float(proba[0][1])
    prediction = int(nafld_prob >= 0.5)

    return {
        "prediction":  prediction,
        "probability": round(nafld_prob, 6),
        "risk":        _to_risk(nafld_prob),
    }


def feature_names() -> list[str]:
    """For /health diagnostics."""
    try:
        return list(get_pipeline().feature_names_in_)
    except AttributeError:
        pass
    try:
        last = list(get_pipeline().named_steps.values())[-1]
        return list(last.feature_name_)
    except AttributeError:
        pass
    return FEATURE_COLUMNS


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

# Conversion factors  mg/dL → mmol/L
_TG_CONV  = 88.57
_LIP_CONV = 38.67   # HDL, Total Cholesterol
_GLU_CONV = 18.0


def _build_frame(raw: dict) -> pd.DataFrame:
    """
    1. Convert mg/dL → mmol/L where needed.
    2. Compute derived features (TyG, TyG_BMI, TyG_WC, TG_HDL).
    3. Build a single-row DataFrame with FEATURE_COLUMNS column order.
    4. Impute NaN with training means.
    """
    # --- unit conversions ---
    tg_mmol      = (raw["triglycerides_mgdl"] / _TG_CONV) if raw.get("triglycerides_mgdl") else None
    hdl_mmol     = (raw["hdl_mgdl"] / _LIP_CONV)          if raw.get("hdl_mgdl")           else None
    chol_mmol    = (raw["total_cholesterol_mgdl"] / _LIP_CONV) if raw.get("total_cholesterol_mgdl") else None
    glucose_mmol = (raw["fasting_glucose_mgdl"] / _GLU_CONV) if raw.get("fasting_glucose_mgdl") else None

    # --- derived features ---
    tyg: float | None = None
    if tg_mmol and glucose_mmol and tg_mmol > 0 and glucose_mmol > 0:
        try:
            tyg = math.log(tg_mmol * glucose_mmol / 2)
        except ValueError:
            tyg = None

    bmi   = raw.get("bmi")
    waist = raw.get("waist_circumference")

    tyg_bmi = (tyg * bmi)   if (tyg is not None and bmi)   else None
    tyg_wc  = (tyg * waist) if (tyg is not None and waist) else None
    tg_hdl  = (tg_mmol / hdl_mmol) if (tg_mmol and hdl_mmol and hdl_mmol > 0) else None

    row = {
        "Sex, 1:Men, 2:Women":                    raw.get("sex"),
        "Baseline Age, yrs":                      raw.get("age"),
        "Baseline Fatty liver 0/1":               raw.get("has_fatty_liver"),
        "Baseline BMI, kg/m2":                    bmi,
        "Baseline Waist circumference(WC), cm":   waist,
        "Baseline ALT, IU/L":                     raw.get("alt"),
        "Baseline AST, IU/L":                     raw.get("ast"),
        "Baseline Body Weight, kg":               raw.get("body_weight"),
        "Baseline GGT, IU/L":                     raw.get("ggt"),
        "Baseline HDL-cholesterol, mmol/L":       hdl_mmol,
        "Baseline Total Cholesterol, mmol/L":     chol_mmol,
        "Baseline Triglycerides, mmol/L":         tg_mmol,
        "Baseline HbA1c, %":                      raw.get("hba1c"),
        "Baseline Fasting plasma glucose, mmol/L": glucose_mmol,
        "Baseline Systolic blood pressure, mmHg":  raw.get("blood_pressure_systolic"),
        "Baseline Diastolic blood pressure, mmHg": raw.get("blood_pressure_diastolic"),
        "TyG":     tyg,
        "TyG_BMI": tyg_bmi,
        "TyG_WC":  tyg_wc,
        "TG_HDL":  tg_hdl,
    }

    df = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    # Replace inf and impute NaN with training means
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    for col, mean_val in TRAINING_MEANS.items():
        if col in df.columns:
            df[col] = df[col].fillna(mean_val)

    return df


def _to_risk(probability: float) -> str:
    if probability >= 0.70:
        return "HIGH"
    if probability >= 0.40:
        return "MEDIUM"
    return "LOW"


def _verify_feature_names() -> None:
    try:
        pipeline_cols = feature_names()
        mismatched = [c for c in pipeline_cols if c not in FEATURE_COLUMNS]
        if mismatched:
            logger.warning(
                "Pipeline expects columns not in FEATURE_COLUMNS: %s — update model.py",
                mismatched,
            )
        else:
            logger.info("Feature column verification passed (%d features).", len(pipeline_cols))
    except Exception as exc:
        logger.warning("Could not verify feature names: %s", exc)

"""
export_model.py — Retrain the NAFLD pipeline and save it as nafld_pipeline.pkl.

Run this ONCE from the model directory:
    cd backend-app/public/model
    python export_model.py

This produces nafld_pipeline.pkl in the same directory.
The FastAPI service loads it from here at startup.
"""

import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

HERE = Path(__file__).parent
CSV_PATH = HERE / "Data+set+Int+J+Obesity.csv"
PKL_PATH = HERE / "nafld_pipeline.pkl"

# ---------------------------------------------------------------------------
# 1. Load data
# ---------------------------------------------------------------------------
df = pd.read_csv(CSV_PATH)
print(f"Loaded dataset: {df.shape[0]:,} rows × {df.shape[1]} cols")

# ---------------------------------------------------------------------------
# 2. Drop unused columns (same as notebook)
# ---------------------------------------------------------------------------
columns_to_drop = [
    "Baseline WC?90 in Men, ?80 in Women 0/1",
    "Obesity phenotype 1-8",
    "Follow up duration, days",
    "Baseline Habit of exercise 0/1",
    "Baseline Alcohol consumption, non:1, light:2, moderate:3, heavy:4",
    "Baseline Smoking status, 1:never, 2:past, 3:current",
    "Baseline Ethanol consumption g/wk",
    "Baseline HDL-cholesterol, mg/dL",
    "Baseline Total Cholesterol, mg/dL",
    "Baseline Triglycerides, mg/dL",
    "Baseline Fasting plasma glucose, mg/dl",
    "Patient Number",
    "Baseline BMI≥25 0/1",
    "Baseline HbA1c, mmol/mol",
    "Baseline BMI?25 0/1",
]
df.drop(columns=columns_to_drop, inplace=True, errors="ignore")

# ---------------------------------------------------------------------------
# 3. Encode sex: 1→0 (Men), 2→1 (Women)
# ---------------------------------------------------------------------------
df["Sex, 1:Men, 2:Women"] = df["Sex, 1:Men, 2:Women"].replace({1: 0, 2: 1})

# ---------------------------------------------------------------------------
# 4. Derived features (identical to notebook)
# ---------------------------------------------------------------------------
df["TyG"] = np.log(
    (df["Baseline Triglycerides, mmol/L"] * df["Baseline Fasting plasma glucose, mmol/L"]) / 2
)
df["TyG_BMI"] = df["TyG"] * df["Baseline BMI, kg/m2"]
df["TyG_WC"]  = df["TyG"] * df["Baseline Waist circumference(WC), cm"]
df["TG_HDL"]  = df["Baseline Triglycerides, mmol/L"] / df["Baseline HDL-cholesterol, mmol/L"]

# ---------------------------------------------------------------------------
# 5. Split features / target
# ---------------------------------------------------------------------------
X = df.drop("Incident DM 0/1", axis=1)
y = df["Incident DM 0/1"]

# Confirm exact feature columns used
print(f"\nFeature columns ({len(X.columns)}):")
for i, col in enumerate(X.columns, 1):
    print(f"  {i:2}. {col}")

# ---------------------------------------------------------------------------
# 6. Train / test split
# ---------------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Handle inf / NaN:
# Step 1 — replace inf with NaN FIRST, then compute means on finite values only.
# (Calling .mean() on a column containing inf yields NaN, so imputation fails.)
X_train = X_train.copy()
X_train.replace([np.inf, -np.inf], np.nan, inplace=True)
train_means = X_train.mean()          # computed on finite values only
X_train = X_train.fillna(train_means)

X_test = X_test.copy()
X_test.replace([np.inf, -np.inf], np.nan, inplace=True)
X_test = X_test.fillna(train_means)  # use train means for test too

# ---------------------------------------------------------------------------
# 7. Build and fit pipeline
# ---------------------------------------------------------------------------
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model",  LGBMClassifier(
        n_estimators=100,
        learning_rate=0.1,
        class_weight="balanced",
        random_state=42,
    )),
])

print("\nTraining pipeline...")
pipeline.fit(X_train, y_train)

# ---------------------------------------------------------------------------
# 8. Evaluate
# ---------------------------------------------------------------------------
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
auc      = roc_auc_score(y_test, y_prob)
print(f"\nAccuracy : {accuracy:.4f}")
print(f"AUC-ROC  : {auc:.4f}")

# ---------------------------------------------------------------------------
# 9. Save pipeline
# ---------------------------------------------------------------------------
with open(PKL_PATH, "wb") as f:
    pickle.dump(pipeline, f)

print(f"\nPipeline saved → {PKL_PATH}")
print("You can now start the FastAPI service.")

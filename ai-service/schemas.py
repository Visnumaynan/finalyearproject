from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


class BloodTestInput(BaseModel):
    """
    Laravel sends these values. Lipids and glucose arrive in mg/dL;
    FastAPI converts them to mmol/L internally before prediction.

    sex           : 0 = Male, 1 = Female   (from UserProfile)
    age           : years                   (computed from UserProfile.date_of_birth)
    has_fatty_liver: 0 = No, 1 = Yes
    """

    # Demographic (from UserProfile — null triggers mean imputation)
    sex: Optional[int] = Field(None, ge=0, le=1, description="0=Male, 1=Female")
    age: Optional[int] = Field(None, ge=1, le=120, description="Age in years")
    has_fatty_liver: int = Field(..., ge=0, le=1, description="Known fatty liver: 0=No, 1=Yes")

    # Anthropometric (required by model)
    bmi: float = Field(..., ge=10, le=100, description="BMI (kg/m²)")
    waist_circumference: float = Field(..., ge=30, le=300, description="Waist circumference (cm)")
    body_weight: float = Field(..., ge=10, le=400, description="Body weight (kg)")

    # Liver enzymes — IU/L (required)
    alt: float = Field(..., ge=0, le=5000, description="ALT (IU/L)")
    ast: float = Field(..., ge=0, le=5000, description="AST (IU/L)")

    # Optional labs
    ggt: Optional[float] = Field(None, ge=0, le=5000, description="GGT (IU/L)")

    # Lipids — input in mg/dL, converted to mmol/L internally
    triglycerides_mgdl:       Optional[float] = Field(None, ge=0, le=2000, description="Triglycerides (mg/dL)")
    hdl_mgdl:                 Optional[float] = Field(None, ge=0, le=500,  description="HDL Cholesterol (mg/dL)")
    total_cholesterol_mgdl:   Optional[float] = Field(None, ge=0, le=1000, description="Total Cholesterol (mg/dL)")

    # Glycemic
    fasting_glucose_mgdl: Optional[float] = Field(None, ge=0, le=1000, description="Fasting Glucose (mg/dL)")
    hba1c: Optional[float] = Field(None, ge=0, le=20, description="HbA1c (%)")

    # Blood pressure — mmHg
    blood_pressure_systolic:  Optional[float] = Field(None, ge=60, le=300)
    blood_pressure_diastolic: Optional[float] = Field(None, ge=40, le=200)


class PredictionResponse(BaseModel):
    prediction: int   = Field(description="0 = Low/No risk, 1 = Elevated risk")
    probability: float = Field(description="Model probability (0.0–1.0)")
    risk: str          = Field(description="LOW | MEDIUM | HIGH")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    feature_count: int

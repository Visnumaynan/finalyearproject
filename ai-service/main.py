"""
main.py — NAFLD FastAPI AI service.

Starts on port 8000 (configurable via PORT env var).
Laravel communicates exclusively with this service over HTTP.
This service has NO database access.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import model as model_module
from exceptions import FeatureMismatchError, ModelNotLoadedError
from schemas import BloodTestInput, HealthResponse, PredictionResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Security: internal token check
# ---------------------------------------------------------------------------
INTERNAL_TOKEN = os.getenv("FASTAPI_INTERNAL_TOKEN", "")


def _verify_token(request: Request) -> None:
    """Reject requests that don't carry the shared internal token."""
    if not INTERNAL_TOKEN:
        return  # Token not configured — skip check (dev mode)
    token = request.headers.get("X-Internal-Token", "")
    if token != INTERNAL_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Internal-Token header.",
        )


# ---------------------------------------------------------------------------
# Application lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model at startup — crash early if the .pkl is missing or corrupt."""
    try:
        model_module.load_model()
        logger.info("FastAPI service ready — model loaded successfully.")
    except FileNotFoundError as exc:
        logger.critical("STARTUP FAILED: %s", exc)
        raise  # Prevent server from accepting requests without a model
    yield
    logger.info("FastAPI service shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="NAFLD AI Prediction Service",
    description="Accepts blood test data from Laravel and returns NAFLD risk prediction.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

# Allow only the Laravel server (adjust origin in production)
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://127.0.0.1,http://localhost").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Internal-Token"],
)


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(ModelNotLoadedError)
async def model_not_loaded_handler(request: Request, exc: ModelNotLoadedError):
    logger.error("Model not loaded: %s", exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "AI model is not loaded. Service is unavailable."},
    )


@app.exception_handler(FeatureMismatchError)
async def feature_mismatch_handler(request: Request, exc: FeatureMismatchError):
    logger.error("Feature mismatch: %s", exc)
    return JSONResponse(
        status_code=422,
        content={
            "detail":  "Feature mismatch between request and model.",
            "missing": exc.missing,
            "extra":   exc.extra,
        },
    )


@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s", request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}"},
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["ops"])
async def health() -> HealthResponse:
    """Liveness probe used by Laravel's MLPredictionService::healthCheck()."""
    loaded = model_module._pipeline is not None
    feature_count = len(model_module.feature_names()) if loaded else 0
    return HealthResponse(
        status="ok" if loaded else "model_not_loaded",
        model_loaded=loaded,
        feature_count=feature_count,
    )


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
async def predict(data: BloodTestInput, request: Request) -> PredictionResponse:
    """
    Accept blood test values from Laravel and return an NAFLD prediction.

    All numeric values must be in standard units:
      - Enzymes: U/L   |  Lipids/Glucose: mg/dL   |  HbA1c: %
      - BMI: kg/m²    |  Waist: cm                |  BP: mmHg

    Null values are accepted; internal imputation is applied automatically.
    """
    _verify_token(request)

    try:
        result = model_module.predict(data.model_dump())
    except ModelNotLoadedError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except FeatureMismatchError as exc:
        raise HTTPException(
            status_code=422,
            detail={"message": str(exc), "missing": exc.missing, "extra": exc.extra},
        )
    except Exception as exc:
        logger.exception("Prediction pipeline error")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    logger.info(
        "Prediction — risk=%s  prob=%.4f  pred=%d",
        result["risk"],
        result["probability"],
        result["prediction"],
    )

    return PredictionResponse(**result)

FROM python:3.11-slim

WORKDIR /app

# libgomp1 is required by LightGBM at runtime — not included in slim base
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code (build context = project root)
COPY ai-service/ .

# Copy trained model into the local fallback path that model.py checks
COPY backend-app/public/model/nafld_pipeline.pkl ./models/nafld_pipeline.pkl

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

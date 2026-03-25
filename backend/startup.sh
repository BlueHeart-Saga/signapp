#!/bin/bash

echo "Starting FastAPI App..."

# Go to app directory (Docker WORKDIR)
cd /app

# Run FastAPI with Gunicorn
gunicorn main:app \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 600
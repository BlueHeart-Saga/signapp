#!/bin/bash

echo "Starting FastAPI App..."

cd /home/site/wwwroot/backend

# install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install LibreOffice if not already installed
if ! command -v libreoffice &> /dev/null; then
    echo "Installing LibreOffice..."
    
    # For Ubuntu-based containers
    apt-get update
    apt-get install -y libreoffice \
        libreoffice-writer \
        libreoffice-calc \
        libreoffice-impress \
        && rm -rf /var/lib/apt/lists/*
    
    echo "LibreOffice installed successfully"
fi

# run FastAPI with Gunicorn + Uvicorn worker
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 600

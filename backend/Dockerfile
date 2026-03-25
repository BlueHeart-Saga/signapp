FROM python:3.11-slim

# Install system dependencies + LibreOffice
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    fonts-dejavu \
    curl \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Start app
CMD ["sh", "startup.sh"]
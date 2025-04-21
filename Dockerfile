# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies for psycopg2 (PostgreSQL driver)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install flask[async] for async support (optional, if needed for WebSockets)
RUN pip install "flask[async]"

# Copy the current directory contents into the container
COPY . .

# Expose port 5000
EXPOSE 5000

# Set environment variables for Flask development
ENV FLASK_APP=run.py
ENV FLASK_ENV=development
ENV PYTHONUNBUFFERED=1

# Run Flask development server with live reloading
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000", "--reload"]

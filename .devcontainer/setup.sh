#!/bin/bash

# Exit on error
set -e

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting DegenZLounge setup...${NC}"

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python3 is not installed. Please install Python 3.10 or higher.${NC}"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
if [[ ! $PYTHON_VERSION =~ ^3\.(10|11) ]]; then
    echo -e "${RED}Python 3.10 or 3.11 is required. Found $PYTHON_VERSION.${NC}"
    exit 1
fi

# Set up virtual environment
if [ ! -d "venv" ]; then
    echo -e "${GREEN}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install backend dependencies
echo -e "${GREEN}Installing backend dependencies...${NC}"
pip install --no-cache-dir -r backend/requirements.txt
pip install flask[async]

# Check for Node.js (for frontend)
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js for the frontend.${NC}"
    exit 1
fi

# Install frontend dependencies
echo -e "${GREEN}Installing frontend dependencies...${NC}"
cd frontend/degenz-frontend
npm install
cd ../..

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 -U degenz &> /dev/null; then
    echo -e "${RED}PostgreSQL is not running or not configured. Ensure PostgreSQL is running with user 'degenz' and database 'degenzdb'.${NC}"
    exit 1
fi

# Run Flask migrations (if using Flask-Migrate)
if [ -f "backend/migrations" ]; then
    echo -e "${GREEN}Running Flask database migrations...${NC}"
    cd backend
    flask db upgrade
    cd ..
else
    echo -e "${GREEN}No migrations found. Skipping database migrations.${NC}"
fi

echo -e "${GREEN}Setup complete! To start the app:${NC}"
echo -e "${GREEN}1. Activate the virtual environment: source venv/bin/activate${NC}"
echo -e "${GREEN}2. Start the backend: cd backend && flask run --host=0.0.0.0 --port=5000${NC}"
echo -e "${GREEN}3. Start the frontend: cd frontend/degenz-frontend && npm start${NC}"

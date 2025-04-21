#!/bin/bash

# Set environment variables
export POSTGRES_USER=degenz
export POSTGRES_PASSWORD=degenzpassword
export POSTGRES_DB=degenzdb
export SECRET_KEY=$(openssl rand -hex 32)
export FLASK_ENV=production

# Create .env file
cat > .env << EOL
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
SECRET_KEY=${SECRET_KEY}
FLASK_ENV=${FLASK_ENV}
REACT_APP_API_URL=http://localhost:5000

# AI Provider API Keys - Add your keys here
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
HUGGINGFACE_API_KEY=
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
MISTRAL_API_KEY=
PERPLEXITY_API_KEY=
GROK_API_KEY=
OLLAMA_URL=http://ollama:11434
EOL

echo "Created .env file with environment variables"

# Update nginx.conf in frontend Dockerfile
sed -i 's|# COPY nginx.conf|COPY nginx.conf|' frontend/degenz-frontend/Dockerfile

# Build and start the containers
echo "Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Initialize the database
echo "Initializing database..."
docker-compose exec backend flask db init
docker-compose exec backend flask db migrate -m "Initial migration"
docker-compose exec backend flask db upgrade

# Pull Ollama models (optional)
echo "Pulling Ollama models (this may take some time)..."
docker-compose exec ollama ollama pull llama2
docker-compose exec ollama ollama pull mistral

echo "Deployment complete!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo "Ollama API: http://localhost:11434"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"

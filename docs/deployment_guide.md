# DeGeNz Lounge Deployment Guide

This comprehensive guide provides detailed instructions for deploying the DeGeNz Lounge webapp using various deployment methods. Choose the method that best suits your needs and infrastructure requirements.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment (Recommended)](#docker-deployment-recommended)
3. [GitHub Codespaces Deployment](#github-codespaces-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Google Cloud Deployment](#google-cloud-deployment)
6. [Firebase Deployment](#firebase-deployment)
7. [Android Deployment via Termux](#android-deployment-via-termux)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying DeGeNz Lounge, ensure you have the following:

- Git installed
- Docker and Docker Compose (for Docker deployment)
- Node.js 20.x or later
- Python 3.10 or later
- PostgreSQL 14 or later
- API keys for Gemini Flash 2.0 (or other LLM provider)
- Stripe API keys (for monetization features)

## Docker Deployment (Recommended)

Docker deployment is the simplest and most consistent way to deploy DeGeNz Lounge across different environments.

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-organization/degenz-lounge.git
cd degenz-lounge
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# General
NODE_ENV=production
PRODUCTION_URL=https://your-domain.com

# Backend
FLASK_ENV=production
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-domain.com

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=degenz_lounge
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Stripe (for monetization)
STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### Step 3: Build and Start the Containers

```bash
# Build the containers
docker-compose build

# Start the services
docker-compose up -d
```

### Step 4: Initialize the Database

```bash
# Run database migrations
docker-compose exec backend flask db upgrade

# Seed initial data (optional)
docker-compose exec backend flask seed
```

### Step 5: Verify Deployment

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- WebSocket: ws://localhost:5000

## GitHub Codespaces Deployment

GitHub Codespaces provides a cloud-based development environment that can also be used for deployment and testing.

### Step 1: Set Up GitHub Repository

1. Push your DeGeNz Lounge code to a GitHub repository
2. Configure the repository for Codespaces by adding a `.devcontainer` directory

### Step 2: Create devcontainer.json

Create a file at `.devcontainer/devcontainer.json`:

```json
{
  "name": "DeGeNz Lounge Development",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "backend",
  "workspaceFolder": "/app",
  "forwardPorts": [3000, 5000, 5432],
  "postCreateCommand": "bash .devcontainer/post-create.sh",
  "extensions": [
    "ms-python.python",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Step 3: Create Post-Create Script

Create a file at `.devcontainer/post-create.sh`:

```bash
#!/bin/bash
set -e

# Install dependencies
cd /app/backend
pip install -r requirements.txt

cd /app/frontend/degenz-frontend
npm install

# Set up database
cd /app/backend
flask db upgrade
flask seed

# Start development servers
echo "Starting development servers..."
cd /app/backend
flask run --host=0.0.0.0 &
cd /app/frontend/degenz-frontend
npm start
```

### Step 4: Launch GitHub Codespace

1. Go to your GitHub repository
2. Click the "Code" button
3. Select the "Codespaces" tab
4. Click "Create codespace on main"

### Step 5: Access Your Application

Once the Codespace is running:
- Frontend: Click on the "Ports" tab and open the forwarded port 3000
- Backend: Click on the "Ports" tab and open the forwarded port 5000

## AWS Deployment

This section covers deploying DeGeNz Lounge on AWS using Elastic Beanstalk for the backend, S3 and CloudFront for the frontend, and RDS for the database.

### Step 1: Set Up AWS Resources

#### Create RDS PostgreSQL Database

1. Go to AWS RDS Console
2. Click "Create database"
3. Select PostgreSQL
4. Choose appropriate settings (recommend at least db.t3.small for production)
5. Set database name, username, and password
6. Configure network settings to allow access from your Elastic Beanstalk environment
7. Create the database and note the endpoint URL

#### Create S3 Bucket for Frontend

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Enter a unique bucket name
4. Configure for static website hosting
5. Disable "Block all public access" (since this will host your frontend)
6. Create the bucket

### Step 2: Prepare Backend for Elastic Beanstalk

1. Create an `application.py` file in the backend directory:

```python
from app import create_app, socketio

application = create_app()

if __name__ == "__main__":
    socketio.run(application)
```

2. Create a `requirements.txt` file with all dependencies

3. Create a `.ebextensions` directory with configuration files:

Create `.ebextensions/01_flask.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:python:
    WSGIPath: application:application
  aws:elasticbeanstalk:application:environment:
    FLASK_ENV: production
    POSTGRES_HOST: YOUR_RDS_ENDPOINT
    POSTGRES_DB: degenz_lounge
    POSTGRES_USER: YOUR_DB_USERNAME
    POSTGRES_PASSWORD: YOUR_DB_PASSWORD
    SECRET_KEY: YOUR_SECRET_KEY
    JWT_SECRET: YOUR_JWT_SECRET
```

### Step 3: Deploy Backend to Elastic Beanstalk

1. Install the EB CLI:
```bash
pip install awsebcli
```

2. Initialize EB CLI in the backend directory:
```bash
cd backend
eb init
```

3. Create an environment:
```bash
eb create degenz-lounge-prod
```

4. Deploy the application:
```bash
eb deploy
```

### Step 4: Build and Deploy Frontend

1. Update API endpoint in frontend configuration:

```bash
# In frontend/.env.production
REACT_APP_API_URL=https://your-eb-environment-url.elasticbeanstalk.com/api
```

2. Build the frontend:
```bash
cd frontend/degenz-frontend
npm run build
```

3. Upload to S3:
```bash
aws s3 sync build/ s3://your-bucket-name/ --delete
```

### Step 5: Set Up CloudFront (Optional but Recommended)

1. Go to AWS CloudFront Console
2. Create a new distribution
3. Set the origin domain to your S3 bucket website endpoint
4. Configure cache behavior and other settings
5. Create the distribution

### Step 6: Set Up Custom Domain (Optional)

1. Register a domain in Route 53 or use an existing domain
2. Create SSL certificate in ACM
3. Configure CloudFront to use the certificate
4. Create Route 53 records pointing to your CloudFront distribution and Elastic Beanstalk environment

## Google Cloud Deployment

This section covers deploying DeGeNz Lounge on Google Cloud Platform using Cloud Run for the backend, Firebase Hosting for the frontend, and Cloud SQL for the database.

### Step 1: Set Up Google Cloud Project

1. Create a new Google Cloud project
2. Enable required APIs:
   - Cloud Run API
   - Cloud SQL Admin API
   - Cloud Build API
   - Container Registry API

### Step 2: Create Cloud SQL Instance

1. Go to Cloud SQL in Google Cloud Console
2. Create a new PostgreSQL instance
3. Configure instance settings (recommend at least db-g1-small for production)
4. Set password for the postgres user
5. Create the instance and note the connection details

### Step 3: Prepare Backend for Cloud Run

1. Create a `Dockerfile` in the backend directory if not already present:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
ENV FLASK_ENV=production

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 "app:create_app()"
```

2. Create a `.env.yaml` file for environment variables:

```yaml
FLASK_ENV: "production"
SECRET_KEY: "your-secret-key"
JWT_SECRET: "your-jwt-secret"
POSTGRES_HOST: "/cloudsql/YOUR_INSTANCE_CONNECTION_NAME"
POSTGRES_DB: "degenz_lounge"
POSTGRES_USER: "postgres"
POSTGRES_PASSWORD: "your-db-password"
GEMINI_API_KEY: "your-gemini-api-key"
```

### Step 4: Deploy Backend to Cloud Run

1. Build and push the Docker image:

```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/degenz-lounge-backend
```

2. Deploy to Cloud Run:

```bash
gcloud run deploy degenz-lounge-backend \
  --image gcr.io/YOUR_PROJECT_ID/degenz-lounge-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_INSTANCE_CONNECTION_NAME \
  --env-vars-file .env.yaml
```

### Step 5: Build and Deploy Frontend

1. Update API endpoint in frontend configuration:

```bash
# In frontend/.env.production
REACT_APP_API_URL=https://degenz-lounge-backend-xxxx-xx.a.run.app/api
```

2. Build the frontend:
```bash
cd frontend/degenz-frontend
npm run build
```

3. Deploy to Firebase Hosting:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Deploy to Firebase
firebase deploy --only hosting
```

### Step 6: Set Up Custom Domain (Optional)

1. Configure custom domain in Firebase Hosting
2. Add custom domain to your Cloud Run service

## Firebase Deployment

This section covers deploying DeGeNz Lounge using Firebase services, including Firebase Hosting for the frontend, Firebase Functions for the backend, and Firestore for the database.

### Step 1: Set Up Firebase Project

1. Create a new Firebase project
2. Enable Firestore database
3. Set up Authentication methods (Email/Password, Google, etc.)
4. Upgrade to Blaze plan (required for external API calls)

### Step 2: Initialize Firebase in Your Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

Select the following features:
- Firestore
- Functions
- Hosting
- Storage (optional)

### Step 3: Adapt Backend for Firebase Functions

1. Create a new `functions` directory if not created by Firebase init
2. Set up Express app in Firebase Functions:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));

// Set up routes
app.get('/api/health', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

// Import route handlers
const agentRoutes = require('./routes/agents');
const sandboxRoutes = require('./routes/sandbox');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/agents', agentRoutes);
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/auth', authRoutes);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_sandbox', (sandboxId) => {
    socket.join(sandboxId);
    console.log(`Client ${socket.id} joined sandbox ${sandboxId}`);
  });
  
  socket.on('leave_sandbox', (sandboxId) => {
    socket.leave(sandboxId);
    console.log(`Client ${socket.id} left sandbox ${sandboxId}`);
  });
  
  socket.on('message', async (data) => {
    // Process message and generate agent responses
    // ...
    
    // Broadcast message to all clients in the sandbox
    io.to(data.sandboxId).emit('message', {
      id: data.id,
      content: data.content,
      sender: data.sender,
      timestamp: data.timestamp
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export the API as a Firebase Function
exports.api = functions.https.onRequest(app);

// Export Socket.IO server as a Firebase Function
exports.io = functions.https.onRequest(server);
```

2. Install necessary dependencies:

```bash
cd functions
npm install express cors socket.io firebase-admin firebase-functions
```

### Step 4: Adapt Frontend for Firebase

1. Update API endpoint in frontend configuration:

```bash
# In frontend/.env.production
REACT_APP_API_URL=https://us-central1-your-project-id.cloudfunctions.net/api
REACT_APP_SOCKET_URL=https://us-central1-your-project-id.cloudfunctions.net/io
```

2. Build the frontend:
```bash
cd frontend/degenz-frontend
npm run build
```

3. Copy build files to Firebase hosting directory:
```bash
cp -r build/* ../public/
```

### Step 5: Deploy to Firebase

```bash
firebase deploy
```

This will deploy:
- Frontend to Firebase Hosting
- Backend to Firebase Functions
- Security rules to Firestore

### Step 6: Set Up Custom Domain (Optional)

1. Go to Firebase Hosting in the Firebase Console
2. Click "Connect domain"
3. Follow the instructions to verify and connect your domain

## Android Deployment via Termux

This section covers deploying DeGeNz Lounge on Android devices using Termux, which allows running Linux environments on Android without root access.

### Step 1: Install Termux

1. Install Termux from F-Droid (recommended) or Google Play Store
2. Open Termux and update packages:
```bash
pkg update && pkg upgrade
```

### Step 2: Install Required Packages

```bash
# Install essential packages
pkg install git python nodejs yarn postgresql openssh

# Install development tools
pkg install build-essential python-dev libffi-dev

# Start PostgreSQL service
pg_ctl -D $PREFIX/var/lib/postgresql start
```

### Step 3: Clone the Repository

```bash
git clone https://github.com/your-organization/degenz-lounge.git
cd degenz-lounge
```

### Step 4: Set Up Backend

```bash
# Create and activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create database
createdb degenz_lounge

# Set environment variables
export FLASK_ENV=production
export SECRET_KEY=your-secret-key
export JWT_SECRET=your-jwt-secret
export POSTGRES_HOST=localhost
export POSTGRES_DB=degenz_lounge
export POSTGRES_USER=$(whoami)
export POSTGRES_PASSWORD=""
export GEMINI_API_KEY=your-gemini-api-key

# Initialize database
flask db upgrade
flask seed
```

### Step 5: Set Up Frontend

```bash
cd ../frontend/degenz-frontend

# Install dependencies
yarn install

# Configure API endpoint
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.local
echo "REACT_APP_SOCKET_URL=ws://localhost:5000" >> .env.local

# Build frontend
yarn build

# Install serve to host the frontend
yarn global add serve
```

### Step 6: Run the Application

Open two Termux sessions (use swipe from left to access drawer menu and create new session):

Session 1 (Backend):
```bash
cd degenz-lounge/backend
source venv/bin/activate
flask run --host=0.0.0.0
```

Session 2 (Frontend):
```bash
cd degenz-lounge/frontend/degenz-frontend
serve -s build -l 3000
```

### Step 7: Access the Application

1. Open a browser on your Android device
2. Navigate to http://localhost:3000

### Step 8: Create Startup Script (Optional)

Create a script to automate the startup process:

```bash
# Create startup script
cat > ~/start-degenz.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

# Start PostgreSQL
pg_ctl -D $PREFIX/var/lib/postgresql start

# Start backend
cd ~/degenz-lounge/backend
source venv/bin/activate
flask run --host=0.0.0.0 &
BACKEND_PID=$!

# Start frontend
cd ~/degenz-lounge/frontend/degenz-frontend
serve -s build -l 3000 &
FRONTEND_PID=$!

echo "DeGeNz Lounge started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Access at http://localhost:3000"
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; pg_ctl -D $PREFIX/var/lib/postgresql stop; echo 'DeGeNz Lounge stopped!'" INT
wait
EOF

# Make script executable
chmod +x ~/start-degenz.sh
```

To start the application:
```bash
~/start-degenz.sh
```

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues

**Problem**: Backend cannot connect to the database.

**Solution**:
1. Verify database credentials in environment variables
2. Check if database service is running
3. Ensure network connectivity between backend and database
4. Check firewall rules to allow database port (usually 5432)

#### WebSocket Connection Failures

**Problem**: Real-time features not working due to WebSocket connection issues.

**Solution**:
1. Ensure WebSocket URL is correctly configured in frontend
2. Check if CORS is properly configured on the backend
3. Verify that the WebSocket server is running
4. Check for any proxy or firewall blocking WebSocket connections

#### Authentication Issues

**Problem**: Users cannot log in or register.

**Solution**:
1. Verify JWT secret is correctly set
2. Check if authentication routes are working properly
3. Ensure database tables for users exist
4. Check for CORS issues if frontend and backend are on different domains

#### Deployment Fails

**Problem**: Deployment process fails with errors.

**Solution**:
1. Check deployment logs for specific error messages
2. Verify all required environment variables are set
3. Ensure build process completes successfully
4. Check if all dependencies are installed

### Getting Help

If you encounter issues not covered in this guide:

1. Check the project's GitHub repository for known issues
2. Join our Discord community for real-time support
3. Submit a detailed bug report with steps to reproduce
4. Contact our support team at support@degenz-lounge.com

## Maintenance and Updates

### Updating the Application

To update your DeGeNz Lounge deployment:

1. Pull the latest changes from the repository
2. Run database migrations if needed
3. Rebuild and redeploy the frontend and backend
4. Clear browser cache if necessary

### Backup and Recovery

Regular backups are essential for production deployments:

1. Database: Use PostgreSQL's pg_dump utility or cloud provider's backup features
2. User-generated content: Back up file storage regularly
3. Configuration: Keep copies of all environment variables and configuration files
4. Store backups securely and test restoration procedures periodically

### Monitoring

Monitor your deployment for performance and issues:

1. Set up logging with services like CloudWatch, Stackdriver, or ELK stack
2. Configure alerts for critical errors and performance thresholds
3. Monitor database performance and scale as needed
4. Track user activity and system resource usage

---

This deployment guide covers the most common deployment scenarios for DeGeNz Lounge. For custom deployment needs or enterprise support, please contact our team at enterprise@degenz-lounge.com.

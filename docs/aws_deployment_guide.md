# Detailed Deployment Guide for AWS

This guide provides step-by-step instructions for deploying the DeGeNz Lounge webapp to Amazon Web Services (AWS).

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI installed and configured
- Git
- Node.js and npm
- Docker and Docker Compose (for local testing)

## Deployment Architecture

The DeGeNz Lounge webapp will be deployed using the following AWS services:

- **Amazon ECR**: For storing Docker images
- **Amazon ECS**: For running containerized applications
- **Amazon RDS**: For PostgreSQL database
- **Amazon ElastiCache**: For Redis caching (optional)
- **Amazon S3 + CloudFront**: For static assets and frontend hosting
- **AWS Lambda**: For serverless AI processing (optional enhancement)

## Step 1: Set Up AWS Resources

### Create a VPC and Subnets

1. Open the AWS Management Console and navigate to the VPC dashboard
2. Click "Create VPC"
3. Select "VPC and more"
4. Configure the VPC:
   - Name tag: `degenz-vpc`
   - IPv4 CIDR block: `10.0.0.0/16`
   - Number of Availability Zones: 2
   - Number of public subnets: 2
   - Number of private subnets: 2
5. Click "Create VPC"

### Create a Security Group

1. Navigate to the Security Groups section in the VPC dashboard
2. Click "Create security group"
3. Configure the security group:
   - Name: `degenz-sg`
   - Description: "Security group for DeGeNz Lounge"
   - VPC: Select the VPC created earlier
4. Add inbound rules:
   - HTTP (80): Anywhere
   - HTTPS (443): Anywhere
   - PostgreSQL (5432): Custom (your IP)
   - Custom TCP (5000): Anywhere (for API)
   - Custom TCP (3000): Anywhere (for development)
5. Click "Create security group"

### Create an RDS PostgreSQL Instance

1. Navigate to the RDS dashboard
2. Click "Create database"
3. Select "Standard create"
4. Choose PostgreSQL as the engine
5. Configure the database:
   - DB instance identifier: `degenz-db`
   - Master username: `degenz`
   - Master password: Create a secure password
   - DB instance class: db.t3.micro (or as needed)
   - Storage: 20 GB (or as needed)
   - VPC: Select the VPC created earlier
   - Security group: Select the security group created earlier
   - Initial database name: `degenzdb`
6. Click "Create database"

## Step 2: Set Up Amazon ECR Repositories

1. Navigate to the Amazon ECR dashboard
2. Click "Create repository"
3. Create two repositories:
   - `degenz-frontend`: For the frontend container
   - `degenz-backend`: For the backend container
4. Note the repository URIs for later use

## Step 3: Build and Push Docker Images

### Configure AWS CLI

```bash
aws configure
```

### Log in to Amazon ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Build and Push Frontend Image

```bash
cd /path/to/degenz-lounge/frontend/degenz-frontend

# Update the API URL in the environment variables
echo "REACT_APP_API_URL=https://your-api-domain.com" > .env

# Build the Docker image
docker build -t degenz-frontend .

# Tag the image
docker tag degenz-frontend:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/degenz-frontend:latest

# Push the image to ECR
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/degenz-frontend:latest
```

### Build and Push Backend Image

```bash
cd /path/to/degenz-lounge/backend

# Create a .env file with your configuration
cat > .env << EOL
POSTGRES_USER=degenz
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=degenzdb
DATABASE_URL=postgresql://degenz:your-db-password@degenz-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/degenzdb
SECRET_KEY=your-secret-key
FLASK_ENV=production
GEMINI_API_KEY=your-gemini-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
MISTRAL_API_KEY=your-mistral-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
GROK_API_KEY=your-grok-api-key
EOL

# Build the Docker image
docker build -t degenz-backend .

# Tag the image
docker tag degenz-backend:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/degenz-backend:latest

# Push the image to ECR
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/degenz-backend:latest
```

## Step 4: Create ECS Cluster and Services

### Create an ECS Cluster

1. Navigate to the ECS dashboard
2. Click "Create Cluster"
3. Select "EC2 Linux + Networking"
4. Configure the cluster:
   - Cluster name: `degenz-cluster`
   - EC2 instance type: t3.small (or as needed)
   - Number of instances: 2
   - VPC: Select the VPC created earlier
   - Subnets: Select the public subnets
   - Security group: Select the security group created earlier
5. Click "Create"

### Create Task Definitions

#### Backend Task Definition

1. Navigate to "Task Definitions" in the ECS dashboard
2. Click "Create new Task Definition"
3. Select "EC2" as the launch type
4. Configure the task:
   - Task Definition Name: `degenz-backend-task`
   - Task Role: `ecsTaskExecutionRole`
   - Network Mode: `bridge`
   - Task Execution Role: `ecsTaskExecutionRole`
   - Task Memory: 512 MB
   - Task CPU: 256
5. Add a container:
   - Container name: `degenz-backend`
   - Image: `<your-account-id>.dkr.ecr.us-east-1.amazonaws.com/degenz-backend:latest`
   - Memory Limits: 512 MB
   - Port mappings: 5000:5000
   - Environment variables: Add all variables from the .env file
6. Click "Create"

#### Frontend Task Definition

1. Navigate to "Task Definitions" in the ECS dashboard
2. Click "Create new Task Definition"
3. Select "EC2" as the launch type
4. Configure the task:
   - Task Definition Name: `degenz-frontend-task`
   - Task Role: `ecsTaskExecutionRole`
   - Network Mode: `bridge`
   - Task Execution Role: `ecsTaskExecutionRole`
   - Task Memory: 512 MB
   - Task CPU: 256
5. Add a container:
   - Container name: `degenz-frontend`
   - Image: `<your-account-id>.dkr.ecr.us-east-1.amazonaws.com/degenz-frontend:latest`
   - Memory Limits: 512 MB
   - Port mappings: 80:80
6. Click "Create"

### Create Services

#### Backend Service

1. Navigate to your ECS cluster
2. Click "Create Service"
3. Configure the service:
   - Launch type: EC2
   - Task Definition: `degenz-backend-task`
   - Service name: `degenz-backend-service`
   - Number of tasks: 2
   - Deployment type: Rolling update
4. Configure networking:
   - VPC: Select the VPC created earlier
   - Subnets: Select the public subnets
   - Security groups: Select the security group created earlier
   - Load balancer type: Application Load Balancer
   - Load balancer name: Create a new load balancer named `degenz-backend-lb`
   - Container to load balance: `degenz-backend:5000`
   - Target group name: Create a new target group named `degenz-backend-tg`
   - Path pattern: `/api/*`
   - Health check path: `/api/health`
5. Click "Next step" and then "Create Service"

#### Frontend Service

1. Navigate to your ECS cluster
2. Click "Create Service"
3. Configure the service:
   - Launch type: EC2
   - Task Definition: `degenz-frontend-task`
   - Service name: `degenz-frontend-service`
   - Number of tasks: 2
   - Deployment type: Rolling update
4. Configure networking:
   - VPC: Select the VPC created earlier
   - Subnets: Select the public subnets
   - Security groups: Select the security group created earlier
   - Load balancer type: Application Load Balancer
   - Load balancer name: Create a new load balancer named `degenz-frontend-lb`
   - Container to load balance: `degenz-frontend:80`
   - Target group name: Create a new target group named `degenz-frontend-tg`
   - Path pattern: `/*`
   - Health check path: `/`
5. Click "Next step" and then "Create Service"

## Step 5: Set Up DNS and SSL

### Register a Domain (if needed)

1. Navigate to Route 53
2. Click "Registered domains"
3. Click "Register Domain"
4. Follow the steps to register a domain

### Create DNS Records

1. Navigate to Route 53
2. Click "Hosted zones"
3. Select your domain
4. Click "Create Record"
5. Create two records:
   - Record name: `api` (for the backend)
     - Record type: A
     - Value: Alias to Application Load Balancer (select `degenz-backend-lb`)
   - Record name: `www` (for the frontend)
     - Record type: A
     - Value: Alias to Application Load Balancer (select `degenz-frontend-lb`)
6. Click "Create records"

### Set Up SSL Certificates

1. Navigate to AWS Certificate Manager
2. Click "Request a certificate"
3. Select "Request a public certificate"
4. Add domain names:
   - `api.yourdomain.com`
   - `www.yourdomain.com`
5. Select "DNS validation"
6. Click "Request"
7. Follow the steps to validate the certificate
8. Once validated, update your load balancers to use HTTPS:
   - Navigate to EC2 > Load Balancers
   - Select each load balancer
   - Add a listener for HTTPS (port 443)
   - Select the certificate
   - Update the target group

## Step 6: Configure Environment Variables

### Update Backend Environment Variables

1. Navigate to ECS > Task Definitions
2. Select the backend task definition
3. Create a new revision
4. Update the environment variables:
   - `DATABASE_URL`: Update with the actual RDS endpoint
   - `SECRET_KEY`: Update with a secure key
   - `FLASK_ENV`: Set to `production`
   - Add all API keys for the AI providers
5. Click "Create"

### Update Frontend Environment Variables

1. Navigate to ECS > Task Definitions
2. Select the frontend task definition
3. Create a new revision
4. Update the environment variables:
   - `REACT_APP_API_URL`: Set to `https://api.yourdomain.com`
5. Click "Create"

## Step 7: Update Services

1. Navigate to ECS > Clusters > Your Cluster
2. Select each service
3. Click "Update"
4. Select the latest task definition revision
5. Click "Update Service"

## Step 8: Verify Deployment

1. Wait for the services to stabilize
2. Open a web browser and navigate to `https://www.yourdomain.com`
3. Verify that the frontend loads correctly
4. Test the API by navigating to `https://api.yourdomain.com/api/health`
5. Test the AI functionality by creating agents and using the sandbox

## Step 9: Set Up Monitoring and Logging

### Configure CloudWatch Logs

1. Navigate to ECS > Task Definitions
2. Update each task definition to use CloudWatch Logs
3. Specify log group names:
   - `/ecs/degenz-frontend`
   - `/ecs/degenz-backend`

### Set Up CloudWatch Alarms

1. Navigate to CloudWatch > Alarms
2. Create alarms for:
   - CPU utilization
   - Memory utilization
   - HTTP 5xx errors
   - Response time

## Step 10: Set Up CI/CD Pipeline (Optional)

### Create CodeBuild Projects

1. Navigate to CodeBuild
2. Create two projects:
   - `degenz-frontend-build`
   - `degenz-backend-build`
3. Configure each project to:
   - Use your GitHub repository
   - Build on push to main branch
   - Use buildspec.yml files

### Create CodePipeline Pipelines

1. Navigate to CodePipeline
2. Create two pipelines:
   - `degenz-frontend-pipeline`
   - `degenz-backend-pipeline`
3. Configure each pipeline to:
   - Source: GitHub
   - Build: CodeBuild project
   - Deploy: ECS service

## Troubleshooting

### Common Issues and Solutions

1. **Database Connection Issues**
   - Check the security group rules
   - Verify the DATABASE_URL environment variable
   - Check the RDS instance status

2. **Container Startup Failures**
   - Check the CloudWatch Logs
   - Verify environment variables
   - Check the Docker image

3. **Load Balancer Health Check Failures**
   - Verify the health check paths
   - Check that the containers are exposing the correct ports
   - Check the security group rules

4. **SSL Certificate Issues**
   - Ensure the certificate is validated
   - Check the load balancer listener configuration
   - Verify the DNS records

## Cost Optimization

To optimize costs for this deployment:

1. Use t3.micro or t3.small instances for ECS
2. Use RDS t3.micro for the database
3. Enable auto-scaling for ECS services
4. Use Spot Instances for non-critical workloads
5. Set up AWS Budgets to monitor costs

## Security Considerations

1. Use IAM roles with least privilege
2. Enable VPC Flow Logs
3. Use AWS WAF to protect against common web exploits
4. Regularly rotate secrets and API keys
5. Enable encryption for RDS and ECS task definitions

## Maintenance and Updates

1. Regularly update the Docker images
2. Monitor for security vulnerabilities
3. Perform database backups
4. Test updates in a staging environment before deploying to production
5. Document all configuration changes

This deployment guide provides a comprehensive approach to deploying the DeGeNz Lounge webapp on AWS. Adjust the resources and configurations based on your specific requirements and expected traffic.

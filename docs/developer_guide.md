# DeGeNz Lounge Developer Guide

## Architecture Overview

DeGeNz Lounge follows a modern web application architecture with separate frontend and backend components:

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API and hooks
- **UI Components**: Custom components with Headless UI
- **Real-time Communication**: Socket.io client

### Backend Architecture
- **Framework**: Flask (Python)
- **API**: RESTful endpoints with JSON responses
- **Real-time Communication**: Flask-SocketIO
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT-based authentication
- **AI Integration**: LangChain for agent workflows

### Database Schema
- **Users**: User accounts and authentication
- **Agents**: AI agent definitions and configurations
- **Sandboxes**: Collaborative sessions
- **Agent Sessions**: Junction table for agents in sandboxes
- **Messages**: Chat history in sandbox sessions
- **User Settings**: User preferences
- **Subscriptions**: User subscription plans

## Development Setup

### Prerequisites
- Node.js 20+
- Python 3.10+
- PostgreSQL 14+
- Docker and Docker Compose (for containerized development)

### Local Development

#### Frontend
```bash
# Install dependencies
cd frontend/degenz-frontend
npm install

# Start development server
npm start
```

#### Backend
```bash
# Create and activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python run.py
```

#### Database
```bash
# Initialize database
cd database
./init.sh
```

### Docker Development
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Code Organization

### Frontend Structure
```
frontend/degenz-frontend/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── agents/        # Agent-related components
│   │   ├── layout/        # Layout components
│   │   ├── sandbox/       # Sandbox components
│   │   └── ui/            # Generic UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   ├── contexts/          # React contexts
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   └── index.tsx          # Application entry point
└── package.json           # Dependencies and scripts
```

### Backend Structure
```
backend/
├── app/                   # Application code
│   ├── api/               # API routes
│   │   ├── agent_routes.py    # Agent endpoints
│   │   ├── auth_routes.py     # Authentication endpoints
│   │   └── sandbox_routes.py  # Sandbox endpoints
│   ├── models/            # Database models
│   │   ├── agent.py           # Agent model
│   │   ├── database.py        # Database configuration
│   │   ├── sandbox.py         # Sandbox models
│   │   └── user.py            # User model
│   ├── services/          # Business logic
│   │   ├── ai_service.py      # AI integration
│   │   ├── agent_tools.py     # Agent tools
│   │   └── sandbox_manager.py # Sandbox orchestration
│   ├── utils/             # Utility functions
│   └── __init__.py        # Application factory
├── tests/                 # Test suite
├── run.py                 # Application entry point
└── requirements.txt       # Dependencies
```

## Key Components

### Agent Creation
The agent creation flow involves:
1. Frontend form for agent configuration
2. API endpoint to save agent to database
3. AI service to create agent chain with LangChain

```python
# Backend: Creating an agent chain
def create_agent_chain(agent_config):
    # Create prompt template with agent configuration
    prompt = PromptTemplate(
        template=AGENT_TEMPLATE,
        input_variables=["input", "context"],
        partial_variables={
            "name": agent_config["name"],
            "role": agent_config["role"],
            "personality": agent_config["personality"],
            "specialization": agent_config.get("specialization", ""),
            "system_instructions": agent_config["system_instructions"]
        }
    )
    
    # Create chain with prompt and language model
    chain = LLMChain(
        llm=self.llm,
        prompt=prompt,
        verbose=True
    )
    
    return chain
```

### Sandbox Environment
The sandbox environment uses:
1. Drag-and-drop interface for agent management
2. WebSocket for real-time communication
3. Manager agent for orchestration

```javascript
// Frontend: Handling WebSocket messages
useEffect(() => {
  const socket = io(WEBSOCKET_URL);
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    socket.emit('join', { session_id: sandboxId });
  });
  
  socket.on('message', (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  });
  
  socket.on('status', (status) => {
    console.log('Status update:', status.msg);
  });
  
  return () => {
    socket.emit('leave', { session_id: sandboxId });
    socket.disconnect();
  };
}, [sandboxId]);
```

### Manager Agent
The manager agent orchestrates the collaboration between agents:
1. Analyzes user input
2. Assigns tasks to appropriate agents
3. Resolves conflicts between agent responses

```python
# Backend: Manager agent response generation
def get_manager_response(self, sandbox_id, message_content):
    # Get the sandbox
    sandbox = Sandbox.query.get(sandbox_id)
    if not sandbox:
        logging.error(f"Sandbox {sandbox_id} not found")
        return None
    
    # Get the manager chain
    chain = self.get_manager_chain(sandbox_id, sandbox.mode)
    if not chain:
        return None
    
    # Generate the response
    response = self.ai_service.generate_response(chain, message_content)
    
    # Save the manager response
    manager_message = Message(
        sandbox_id=sandbox_id,
        sender_type='manager',
        sender_id=0,  # Manager has ID 0
        content=response,
        created_at=datetime.datetime.utcnow()
    )
    
    db_session.add(manager_message)
    db_session.commit()
    
    return manager_message
```

## API Integration

### Authentication Flow
```javascript
// Frontend: Login function
const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### Agent API
```javascript
// Frontend: Creating an agent
const createAgent = async (agentData) => {
  try {
    const response = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(agentData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create agent');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Create agent error:', error);
    throw error;
  }
};
```

## Testing

### Unit Tests
Unit tests focus on testing individual components in isolation:
- Models
- Services
- Utility functions

```python
# Backend: Testing AI service
def test_create_agent_chain():
    """Test creating an agent chain."""
    ai_service = AIService()
    agent_config = {
        'name': 'Test Agent',
        'role': 'Testing',
        'personality': 'Analytical',
        'specialization': 'Unit Testing',
        'system_instructions': 'You are a test agent designed to verify functionality.'
    }
    chain = ai_service.create_agent_chain(agent_config)
    assert chain is not None
```

### Integration Tests
Integration tests verify that components work together correctly:
- API endpoints
- Database interactions
- WebSocket communication

```python
# Backend: Testing sandbox API
def test_create_sandbox(client, auth_token):
    """Test sandbox session creation."""
    response = client.post('/api/sandbox/sessions', 
        json={
            'name': 'Test Session',
            'description': 'A test sandbox session',
            'mode': 'collaborative'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Session'
```

### End-to-End Tests
End-to-end tests simulate user interactions with the application:
- User flows
- UI interactions
- Real-time communication

## Deployment

### Production Deployment
For production deployment:
1. Build the frontend for production
2. Configure environment variables
3. Deploy using Docker Compose

```bash
# Build frontend for production
cd frontend/degenz-frontend
npm run build

# Deploy with Docker Compose
cd ../..
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables
Configure the following environment variables for production:
- `DATABASE_URI`: PostgreSQL connection string
- `SECRET_KEY`: Secret key for JWT tokens
- `GEMINI_API_KEY`: API key for Gemini Flash 2.0
- `FLASK_ENV`: Set to "production"
- `NODE_ENV`: Set to "production"

## Performance Optimization

### Frontend Optimization
- Use React.memo for expensive components
- Implement virtualized lists for large datasets
- Optimize bundle size with code splitting

### Backend Optimization
- Implement database query optimization
- Use caching for frequently accessed data
- Optimize WebSocket message handling

## Security Considerations

### Authentication
- Use JWT tokens with appropriate expiration
- Implement refresh token mechanism
- Store tokens securely (HTTP-only cookies)

### Data Protection
- Validate all user inputs
- Implement rate limiting
- Use HTTPS for all communications

### AI Safety
- Implement content filtering
- Set appropriate system instructions
- Monitor and log AI interactions

## Extending the Application

### Adding New Agent Types
1. Create a new agent template
2. Implement specialized prompt templates
3. Add UI components for the new agent type

### Adding New Tools
1. Implement the tool in `agent_tools.py`
2. Register the tool with the agent executor
3. Update the UI to support the new tool

### Custom AI Models
1. Modify the `AIService` class to support new models
2. Implement model-specific prompt templates
3. Update the UI to allow model selection

## Troubleshooting

### Common Development Issues
- **Database connection errors**: Check PostgreSQL service is running
- **WebSocket connection issues**: Verify CORS configuration
- **AI integration problems**: Check API keys and model availability

### Debugging Tips
- Use Flask's debug mode for backend development
- Enable React DevTools for frontend debugging
- Check browser console and network tab for errors

## Contributing

### Code Style
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/TypeScript
- Write meaningful commit messages

### Pull Request Process
1. Create a feature branch from `main`
2. Implement changes with tests
3. Submit a pull request with a clear description
4. Address review comments

### Documentation
- Update API documentation for new endpoints
- Document new features in the user guide
- Add code comments for complex logic

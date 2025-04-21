# DeGeNz Lounge API Tests

This file contains tests for the DeGeNz Lounge API endpoints.

## Running Tests

```bash
cd backend
python -m pytest tests/
```

## Test Cases

### Authentication Tests

- Test user registration
- Test user login
- Test token validation
- Test protected routes

### Agent Tests

- Test agent creation
- Test agent retrieval
- Test agent update
- Test agent deletion

### Sandbox Tests

- Test sandbox session creation
- Test adding agents to sandbox
- Test removing agents from sandbox
- Test message handling

### WebSocket Tests

- Test connection
- Test joining/leaving rooms
- Test message broadcasting
- Test agent responses

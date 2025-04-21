# DeGeNz Lounge API Documentation

## Overview

This document provides detailed API documentation for the DeGeNz Lounge backend services, including authentication, agent management, sandbox sessions, and WebSocket communication.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:5000/api
```

## Authentication

### Register User

Creates a new user account.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "user1",
    "email": "user1@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "id": 1,
    "username": "user1",
    "email": "user1@example.com",
    "message": "User registered successfully"
  }
  ```
- **Error Response**: `400 Bad Request`
  ```json
  {
    "error": "User with this email already exists"
  }
  ```

### Login

Authenticates a user and returns a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user1@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "username": "user1",
    "email": "user1@example.com",
    "token": "jwt_token_here",
    "message": "Login successful"
  }
  ```
- **Error Response**: `401 Unauthorized`
  ```json
  {
    "error": "Invalid email or password"
  }
  ```

### Get Current User

Retrieves the currently authenticated user's information.

- **URL**: `/auth/user`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "username": "user1",
    "email": "user1@example.com"
  }
  ```
- **Error Response**: `401 Unauthorized`
  ```json
  {
    "error": "Authentication token is missing"
  }
  ```

## Agent Management

### Create Agent

Creates a new AI agent with custom configuration.

- **URL**: `/agents`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "name": "Researcher",
    "role": "Research and Analysis",
    "personality": "Analytical",
    "specialization": "Market Research",
    "system_instructions": "You are a research specialist...",
    "examples": [
      {
        "input": "What are the current trends in sustainable fashion?",
        "output": "Based on my research, the current trends in sustainable fashion include..."
      }
    ]
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "id": 1,
    "name": "Researcher",
    "role": "Research and Analysis",
    "personality": "Analytical",
    "specialization": "Market Research",
    "system_instructions": "You are a research specialist...",
    "examples": [...],
    "created_at": "2025-04-20T12:00:00Z",
    "updated_at": "2025-04-20T12:00:00Z"
  }
  ```
- **Error Response**: `400 Bad Request`
  ```json
  {
    "error": "Missing required field: name"
  }
  ```

### Get All Agents

Retrieves all agents created by the current user.

- **URL**: `/agents`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "name": "Researcher",
      "role": "Research and Analysis",
      "personality": "Analytical",
      "specialization": "Market Research",
      "system_instructions": "You are a research specialist...",
      "examples": [...],
      "created_at": "2025-04-20T12:00:00Z",
      "updated_at": "2025-04-20T12:00:00Z"
    },
    {
      "id": 2,
      "name": "Copywriter",
      "role": "Content Creation",
      "personality": "Creative",
      "specialization": "Marketing Copy",
      "system_instructions": "You are a creative copywriter...",
      "examples": [...],
      "created_at": "2025-04-20T12:30:00Z",
      "updated_at": "2025-04-20T12:30:00Z"
    }
  ]
  ```

### Get Agent by ID

Retrieves a specific agent by ID.

- **URL**: `/agents/{id}`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "name": "Researcher",
    "role": "Research and Analysis",
    "personality": "Analytical",
    "specialization": "Market Research",
    "system_instructions": "You are a research specialist...",
    "examples": [...],
    "created_at": "2025-04-20T12:00:00Z",
    "updated_at": "2025-04-20T12:00:00Z"
  }
  ```
- **Error Response**: `404 Not Found`
  ```json
  {
    "error": "Agent not found"
  }
  ```

### Update Agent

Updates an existing agent's configuration.

- **URL**: `/agents/{id}`
- **Method**: `PUT`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "name": "Updated Researcher",
    "role": "Research and Analysis",
    "personality": "Analytical",
    "specialization": "Market Research",
    "system_instructions": "You are a research specialist...",
    "examples": [...]
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "name": "Updated Researcher",
    "role": "Research and Analysis",
    "personality": "Analytical",
    "specialization": "Market Research",
    "system_instructions": "You are a research specialist...",
    "examples": [...],
    "created_at": "2025-04-20T12:00:00Z",
    "updated_at": "2025-04-20T13:00:00Z"
  }
  ```
- **Error Response**: `404 Not Found`
  ```json
  {
    "error": "Agent not found"
  }
  ```

### Delete Agent

Deletes an agent.

- **URL**: `/agents/{id}`
- **Method**: `DELETE`
- **Auth Required**: Yes (Bearer Token)
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Agent deleted successfully"
  }
  ```
- **Error Response**: `404 Not Found`
  ```json
  {
    "error": "Agent not found"
  }
  ```

## Sandbox Sessions

### Create Sandbox Session

Creates a new sandbox session for agent collaboration.

- **URL**: `/sandbox/sessions`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "name": "Eco-Friendly Shoe Launch",
    "description": "Planning session for new eco-friendly shoe product launch",
    "mode": "collaborative"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "id": 1,
    "name": "Eco-Friendly Shoe Launch",
    "description": "Planning session for new eco-friendly shoe product launch",
    "mode": "collaborative",
    "created_at": "2025-04-20T12:00:00Z",
    "updated_at": "2025-04-20T12:00:00Z",
    "user_id": 1
  }
  ```
- **Error Response**: `400 Bad Request`
  ```json
  {
    "error": "Missing required field: name"
  }
  ```

### Get All Sandbox Sessions

Retrieves all sandbox sessions created by the current user.

- **URL**: `/sandbox/sessions`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "name": "Eco-Friendly Shoe Launch",
      "description": "Planning session for new eco-friendly shoe product launch",
      "mode": "collaborative",
      "created_at": "2025-04-20T12:00:00Z",
      "updated_at": "2025-04-20T12:00:00Z",
      "user_id": 1
    },
    {
      "id": 2,
      "name": "Marketing Campaign",
      "description": "Planning for Q3 marketing campaign",
      "mode": "strict",
      "created_at": "2025-04-20T13:00:00Z",
      "updated_at": "2025-04-20T13:00:00Z",
      "user_id": 1
    }
  ]
  ```

### Get Sandbox Session by ID

Retrieves a specific sandbox session by ID, including its agents and messages.

- **URL**: `/sandbox/sessions/{id}`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "name": "Eco-Friendly Shoe Launch",
    "description": "Planning session for new eco-friendly shoe product launch",
    "mode": "collaborative",
    "created_at": "2025-04-20T12:00:00Z",
    "updated_at": "2025-04-20T12:00:00Z",
    "user_id": 1,
    "agents": [
      {
        "id": 1,
        "name": "Researcher",
        "role": "Research and Analysis",
        "personality": "Analytical",
        "specialization": "Market Research",
        "system_instructions": "You are a research specialist..."
      },
      {
        "id": 2,
        "name": "Copywriter",
        "role": "Content Creation",
        "personality": "Creative",
        "specialization": "Marketing Copy",
        "system_instructions": "You are a creative copywriter..."
      }
    ],
    "messages": [
      {
        "id": 1,
        "sandbox_id": 1,
        "sender_type": "user",
        "sender_id": 1,
        "content": "Let's plan an eco-friendly shoe launch",
        "created_at": "2025-04-20T12:05:00Z"
      },
      {
        "id": 2,
        "sandbox_id": 1,
        "sender_type": "manager",
        "sender_id": 0,
        "content": "I'll help coordinate our team to develop a comprehensive marketing plan...",
        "created_at": "2025-04-20T12:05:10Z"
      }
    ]
  }
  ```
- **Error Response**: `404 Not Found`
  ```json
  {
    "error": "Session not found"
  }
  ```

### Add Agent to Sandbox

Adds an agent to a sandbox session.

- **URL**: `/sandbox/sessions/{id}/agents`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "agent_id": 1,
    "is_manager": false
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "sandbox_id": 1,
    "agent_id": 1,
    "is_manager": false,
    "created_at": "2025-04-20T12:10:00Z"
  }
  ```
- **Error Response**: `400 Bad Request`
  ```json
  {
    "error": "Agent already in session"
  }
  ```

### Remove Agent from Sandbox

Removes an agent from a sandbox session.

- **URL**: `/sandbox/sessions/{id}/agents/{agent_id}`
- **Method**: `DELETE`
- **Auth Required**: Yes (Bearer Token)
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Agent 1 removed from session 1"
  }
  ```
- **Error Response**: `404 Not Found`
  ```json
  {
    "error": "Agent not in session"
  }
  ```

## WebSocket Communication

The application uses WebSockets for real-time communication in sandbox sessions.

### Connection

Connect to the WebSocket server at:

```
ws://localhost:5000/
```

### Events

#### Join Session

Joins a sandbox session room to receive messages.

- **Event**: `join`
- **Data**:
  ```json
  {
    "session_id": 1
  }
  ```
- **Response Event**: `status`
- **Response Data**:
  ```json
  {
    "msg": "User has joined session 1"
  }
  ```

#### Leave Session

Leaves a sandbox session room.

- **Event**: `leave`
- **Data**:
  ```json
  {
    "session_id": 1
  }
  ```
- **Response Event**: `status`
- **Response Data**:
  ```json
  {
    "msg": "User has left session 1"
  }
  ```

#### Send Message

Sends a message in a sandbox session.

- **Event**: `message`
- **Data**:
  ```json
  {
    "session_id": 1,
    "message": "Let's plan an eco-friendly shoe launch",
    "sender_type": "user",
    "sender_id": 1,
    "agent_id": 2  // Optional, if message is directed to a specific agent
  }
  ```
- **Response Event**: `message`
- **Response Data**:
  ```json
  {
    "id": 1,
    "sandbox_id": 1,
    "sender_type": "user",
    "sender_id": 1,
    "content": "Let's plan an eco-friendly shoe launch",
    "created_at": "2025-04-20T12:05:00Z"
  }
  ```

#### Resolve Conflict

Resolves a conflict between agent responses.

- **Event**: `resolve_conflict`
- **Data**:
  ```json
  {
    "session_id": 1,
    "context": "What is the best approach for this project?",
    "responses": [
      {
        "sender": "Agent 1",
        "content": "We should use approach A because it is more efficient."
      },
      {
        "sender": "Agent 2",
        "content": "We should use approach B because it is more reliable."
      }
    ]
  }
  ```
- **Response Event**: `message`
- **Response Data**:
  ```json
  {
    "id": 10,
    "sandbox_id": 1,
    "sender_type": "manager",
    "sender_id": 0,
    "content": "After analyzing both approaches, I recommend a hybrid solution...",
    "created_at": "2025-04-20T12:15:00Z"
  }
  ```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: Authentication required or invalid token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Error response format:

```json
{
  "error": "Error message here"
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

When rate limit is exceeded, the API returns:

- **Status Code**: `429 Too Many Requests`
- **Response Body**:
  ```json
  {
    "error": "Rate limit exceeded. Please try again later."
  }
  ```

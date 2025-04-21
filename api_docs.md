# DeGeNz Lounge Backend API Documentation

## Overview

This document provides documentation for the DeGeNz Lounge backend API, which powers the AI Agent Orchestration Platform.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User

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

#### Login

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

#### Logout

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Logout successful"
  }
  ```

#### Get Current User

- **URL**: `/auth/user`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "username": "user1",
    "email": "user1@example.com"
  }
  ```

### Agents

#### Get All Agents

- **URL**: `/agents`
- **Method**: `GET`
- **Auth Required**: Yes
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
      "examples": [],
      "created_at": "2025-04-20T12:00:00Z",
      "updated_at": "2025-04-20T12:00:00Z"
    }
  ]
  ```

#### Get Agent by ID

- **URL**: `/agents/{id}`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "name": "Researcher",
    "role": "Research and Analysis",
    "personality": "Analytical",
    "specialization": "Market Research",
    "system_instructions": "You are a research specialist...",
    "examples": [],
    "created_at": "2025-04-20T12:00:00Z",
    "updated_at": "2025-04-20T12:00:00Z"
  }
  ```

#### Create Agent

- **URL**: `/agents`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Researcher",
    "role": "Research and Analysis",
    "personality": "Analytical",
    "specialization": "Market Research",
    "system_instructions": "You are a research specialist...",
    "examples": []
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
    "examples": [],
    "created_at": "2025-04-20T12:00:00Z",
    "updated_at": "2025-04-20T12:00:00Z"
  }
  ```

#### Update Agent

- **URL**: `/agents/{id}`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Updated Researcher",
    "role": "Research and Analysis",
    "personality": "Analytical",
    "specialization": "Market Research",
    "system_instructions": "You are a research specialist...",
    "examples": []
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
    "examples": [],
    "created_at": "2025-04-20T12:00:00Z",
    "updated_at": "2025-04-20T12:30:00Z"
  }
  ```

#### Delete Agent

- **URL**: `/agents/{id}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Agent deleted successfully"
  }
  ```

### Sandbox

#### Get All Sandbox Sessions

- **URL**: `/sandbox/sessions`
- **Method**: `GET`
- **Auth Required**: Yes
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
    }
  ]
  ```

#### Create Sandbox Session

- **URL**: `/sandbox/sessions`
- **Method**: `POST`
- **Auth Required**: Yes
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

#### Get Sandbox Session by ID

- **URL**: `/sandbox/sessions/{id}`
- **Method**: `GET`
- **Auth Required**: Yes
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
      }
    ]
  }
  ```

#### Add Agent to Sandbox Session

- **URL**: `/sandbox/sessions/{id}/agents`
- **Method**: `POST`
- **Auth Required**: Yes
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

#### Remove Agent from Sandbox Session

- **URL**: `/sandbox/sessions/{id}/agents/{agent_id}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Agent 1 removed from session 1"
  }
  ```

## WebSocket Events

The application uses WebSockets for real-time communication in sandbox sessions.

### Connection

Connect to the WebSocket server at:

```
ws://localhost:5000/
```

### Events

#### Join Session

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

## Error Responses

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

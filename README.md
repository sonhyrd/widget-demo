# HR Token API

A simple Express.js API server that generates JWT tokens for HR integration.

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Server

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on port 3000 by default (or the port specified in the `PORT` environment variable).

## API Endpoints

### POST /hr-token

Generates a JWT token for HR integration.

**Request Body:**
```json
{
  "userId": "string (required)",
  "email": "string (required)", 
  "firstName": "string (optional)",
  "lastName": "string (optional)"
}
```

**Response:**
```json
{
  "token": "jwt_token_string",
  "expiresIn": 5184000
}
```

**Example Usage:**
```bash
curl -X POST http://localhost:3000/hr-token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### GET /health

Health check endpoint that returns server status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Environment Variables

- `PORT`: Server port (default: 3000)

## Token Details

- **Algorithm**: RS256
- **Expires**: 2 months from creation
- **Issuer**: https://integration.app.paulsjob.ai
- **Audience**: paul-job
- **Key ID**: 20250528-f216 
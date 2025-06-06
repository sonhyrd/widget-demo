# Widget Integration Guide

This guide explains how to integrate the Paul Job widget into your application, including backend token generation and frontend widget loading.

## Overview

The integration consists of two main parts:
1. **Backend API Handler**: Generates JWT tokens for widget authentication
2. **Frontend Widget Integration**: Loads the widget script and handles authentication

## Backend Implementation

### 1. API Handler Setup

Create an API endpoint to generate JWT tokens for widget authentication.

**Express.js Implementation**:

```javascript
const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const app = express()

// Middleware to parse JSON bodies
app.use(express.json())

// POST endpoint for token generation
app.post('/api/generate-token', async (req, res) => {
  try {
    const { userId, email, firstName, lastName } = req.body

    // Validate required parameters
    if (!userId || !email) {
      return res.status(400).json({
        error: 'userId and email are required'
      })
    }

    const now = Math.floor(Date.now() / 1000)
    
    // Generate unique JWT ID
    const jti = crypto
      .createHash('sha256')
      .update(`${userId}-${now}-${Math.random()}`)
      .digest('hex')

    // Token expires in 2 months
    const expiresIn = 60 * 60 * 24 * 30 * 2

    // JWT Claims
    const claims = {
      iss: 'https://integration.app.paulsjob.ai', // Your issuer URL
      aud: 'paul-job', // Audience
      sub: userId, // Subject (user ID)
      email,
      firstName,
      lastName,
      exp: now + expiresIn,
      iat: now,
      nbf: now,
      jti,
    }

    // Get private key from protected environment storage
    const privateKeyRaw = process.env.SSO_PRIVATE_KEY
    const keyId = process.env.SSO_KEY_ID

    if (!privateKeyRaw) {
      return res.status(500).json({
        error: 'SSO private key is not configured'
      })
    }

    // JWT signing options
    const signOptions = {
      algorithm: 'RS256',
      keyid: keyId, // Key ID from your dashboard
    }

    // Create JWT token
    const token = jwt.sign(claims, privateKeyRaw, signOptions)

    res.json({
      token,
      expiresIn,
    })

  } catch (error) {
    console.error('Token generation error:', error)
    res.status(500).json({
      error: error.message || 'Failed to generate JWT token'
    })
  }
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

**Alternative: Node.js with Built-in HTTP Module**:

```javascript
const http = require('http')
const url = require('url')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true)
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/hr-token') {
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', async () => {
      try {
        const { userId, email, firstName, lastName } = JSON.parse(body)

        // Validate required parameters
        if (!userId || !email) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'userId and email are required' }))
          return
        }

        const now = Math.floor(Date.now() / 1000)
        
        // Generate unique JWT ID
        const jti = crypto
          .createHash('sha256')
          .update(`${userId}-${now}-${Math.random()}`)
          .digest('hex')

        // Token expires in 2 months
        const expiresIn = 60 * 60 * 24 * 30 * 2

        // JWT Claims
        const claims = {
          iss: 'https://integration.app.paulsjob.ai',
          aud: 'paul-job',
          sub: userId,
          email,
          firstName,
          lastName,
          exp: now + expiresIn,
          iat: now,
          nbf: now,
          jti,
        }

        // Get private key from environment
        const privateKeyRaw = process.env.SSO_PRIVATE_KEY
        const keyId = process.env.SSO_KEY_ID

        if (!privateKeyRaw) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'SSO private key is not configured' }))
          return
        }

        // JWT signing options
        const signOptions = {
          algorithm: 'RS256',
          keyid: keyId,
        }

        // Create JWT token
        const token = jwt.sign(claims, privateKeyRaw, signOptions)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ token, expiresIn }))

      } catch (error) {
        console.error('Token generation error:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: error.message || 'Failed to generate JWT token' }))
      }
    })
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

### 2. Environment Configuration

Store your SSO credentials in your application's protected environment configuration:

- **Private Key**: The RSA private key from your Paul Job dashboard
- **Key ID**: The key identifier from your Paul Job dashboard

**Environment Variables Setup**:

Set these environment variables in your deployment environment:

```bash
SSO_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
[Your Private Key from Dashboard]
-----END RSA PRIVATE KEY-----"

SSO_KEY_ID="your-key-id-from-dashboard"
```

**For Development**: You can use a `.env` file (but never commit it to version control):

```env
# .env file (add to .gitignore)
SSO_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
[Your Private Key from Dashboard]
-----END RSA PRIVATE KEY-----"

SSO_KEY_ID="your-key-id-from-dashboard"
```

If using a `.env` file, install and configure dotenv:

```bash
npm install dotenv
```

Then add to the top of your main server file:

```javascript
require('dotenv').config()
```

### 3. Dependencies Installation

Install the required dependencies for your backend:

```bash
# For Express.js
npm install express jsonwebtoken

# If using .env file for development
npm install dotenv

# For TypeScript support (optional)
npm install --save-dev @types/jsonwebtoken @types/express
```

## Frontend Implementation

### Widget Integration Script

Create a JavaScript file to handle widget loading and authentication.

**File**: `widget-integration.js`

```javascript
// Configuration
const WIDGET_CONFIG = {
  apiEndpoint: '/api/generate-token',
  companySlug: 'your-company-slug',
  sdkUrl: 'https://widget.hyrd.ai/staging/sdk.iife.js'
}

// User data (get this from your authentication system)
const currentUser = {
  email: 'user@example.com',
  userId: 'user-unique-id',
  firstName: 'John', // Optional
  lastName: 'Doe'     // Optional
}

function loadPaulJobWidget() {
  loadPaulJobScript()
  initializePaulJob()
}

function loadPaulJobScript() {
  const firstScript = document.getElementsByTagName('script')[0]
  let scriptElement = document.getElementById('widget-paul-job-sdk')

  if (!scriptElement) {
    scriptElement = document.createElement('script')
    scriptElement.type = 'text/javascript'
    scriptElement.async = true
    scriptElement.src = WIDGET_CONFIG.sdkUrl
    scriptElement.id = 'widget-paul-job-sdk'
    firstScript.parentNode.insertBefore(scriptElement, firstScript)
  }
}

function initializePaulJob() {
  // Initialize HyrdWidget if not exists
  if (!window.HyrdWidget) {
    window.HyrdWidget = function (callback) {
      (window.HyrdWidget.readyQueue = window.HyrdWidget.readyQueue || []).push(callback)
    }
    window.HyrdWidget.readyQueue = []
  }

  // Initialize widget with company configuration
  window.HyrdWidget({
    company: WIDGET_CONFIG.companySlug
  })

  // Handle widget loaded event
  window.HyrdWidget({
    method: 'loaded',
    callback: async () => {
      await authenticateUserWithPaulJob()
    }
  })
}

async function authenticateUserWithPaulJob() {
  try {
    // Call your backend API to get the token
    const response = await fetch(WIDGET_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: currentUser.email,
        userId: currentUser.userId,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Send token to widget for verification and auto-login
    const result = await window.HyrdWidgetManager.verifyToken(data.token)
    console.log('Widget authentication successful:', result)

  } catch (error) {
    console.error('Widget authentication failed:', error)
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPaulJobWidget)
} else {
  loadPaulJobWidget()
}

// Logout function
function logoutFromPaulJob() {
  try {
    // Clear the stored authentication token
    window.HyrdWidgetManager?.clearToken()
    console.log('Paul Job widget logout successful')
  } catch (error) {
    console.error('Error during Paul Job widget logout:', error)
  }
}
```

## Integration Steps

### Step 1: Get Dashboard Credentials

1. Log into your Paul Job dashboard
2. Navigate to Integration settings
3. Generate/copy your private key and key ID
4. Note your company slug

### Step 2: Backend Setup

1. **Install required dependencies**:
   ```bash
   npm install express jsonwebtoken
   # Optional: for development environment variables
   npm install dotenv
   ```

2. **Create the API handler** (choose one approach):
   - Express.js server with `/api/hr-token` endpoint
   - Node.js HTTP server with token generation logic

3. **Configure environment variables**:
   - Set `SSO_PRIVATE_KEY` and `SSO_KEY_ID` in your deployment environment
   - For development, optionally use `.env` file with `dotenv`

4. **Start your backend server**:
   ```bash
   node server.js
   # or
   npm start
   ```

### Step 3: Frontend Setup

1. **Include the integration script** in your HTML:

   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Your App</title>
   </head>
   <body>
     <!-- Your app content -->
     
     <!-- Include the widget integration script -->
     <script src="widget-integration.js"></script>
   </body>
   </html>
   ```

2. **Configure the integration**:
   - Update `companySlug` in the script with your company slug from dashboard
   - Set the correct `apiEndpoint` URL for your backend
   - Provide current user's `email` and `userId` in the `currentUser` object

### Step 4: User Logout Implementation

To handle user logout, you need to clear the stored authentication token from the widget.

#### Basic Logout Implementation

```javascript
function handleUserLogout() {
  // Clear Paul Job widget authentication
  logoutFromPaulJob()
  
  // Your application logout logic here
  // e.g., redirect to login page, clear session, etc.
}
```

#### Integration with Your Logout Flow

```javascript
// Example: Integration with existing logout button
document.getElementById('logout-button').addEventListener('click', async () => {
  try {
    // Clear Paul Job widget first
    logoutFromPaulJob()
    
    // Then handle your application logout
    await handleAppLogout()
    
    // Redirect or refresh as needed
    window.location.href = '/login'
  } catch (error) {
    console.error('Logout error:', error)
  }
})

// Example: Integration with SPA router logout
function onUserLogout() {
  // Clear widget authentication
  logoutFromPaulJob()
  
  // Clear application state
  clearUserSession()
  
  // Navigate to login page
  router.navigate('/login')
}
```


## Security Considerations

1. **Private Key Security**: Never expose your private key in client-side code
2. **Protected Storage**: Store credentials in secure environment configuration (not in code)
3. **Token Validation**: Ensure tokens are properly validated on both ends
4. **HTTPS Only**: Always use HTTPS in production
5. **Token Expiration**: Set appropriate token expiration times
6. **Environment Separation**: Use different keys for staging and production

## Environment Storage Options

Consider these secure options for storing your credentials:

- **Cloud Platform Secrets**: AWS Secrets Manager, Google Secret Manager, Azure Key Vault
- **Deployment Platform**: Vercel Environment Variables, Netlify Environment Variables
- **Container Orchestration**: Kubernetes Secrets, Docker Secrets
- **CI/CD Pipeline**: GitHub Secrets, GitLab CI Variables
- **Server Configuration**: Environment variables on your server

## Troubleshooting

### Common Issues

1. **Widget not loading**:
   - Check network requests in browser dev tools
   - Verify SDK URL is accessible
   - Check console for JavaScript errors

2. **Authentication failures**:
   - Verify private key format and content
   - Check token claims and expiration
   - Ensure key ID matches dashboard configuration

3. **Environment configuration**:
   - Verify credentials are properly loaded from protected storage
   - Check runtime configuration setup
   - Ensure environment variables are available at runtime

### Debug Mode

Enable debug logging by adding to your widget configuration:

```javascript
window.HyrdWidget({
  company: 'your-company-slug',
  debug: true, // Enable debug mode
})
```

## API Reference

### Backend API Endpoint

**POST** `/api/generate-token`

**Request Body**:
```json
{
  "userId": "user-unique-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Note**: `firstName` and `lastName` are optional fields.

**Response**:
```json
{
  "token": "jwt-token-string",
  "expiresIn": 5184000
}
```

**Error Response**:
```json
{
  "error": "Error message description"
}
```

### Widget JavaScript API

#### Configuration

Update the configuration in `widget-integration.js`:

```javascript
const WIDGET_CONFIG = {
  apiEndpoint: '/api/generate-token',    // Your backend endpoint
  companySlug: 'your-company-slug',      // Your company slug from dashboard
  sdkUrl: 'https://widget.hyrd.ai/staging/sdk.iife.js'
}

const currentUser = {
  email: 'user@example.com',     // Current user's email
  userId: 'user-unique-id',       // Current user's ID
  firstName: 'John', // Optional
  lastName: 'Doe'     // Optional
}
```

#### Widget Methods

- `HyrdWidget({ company: 'slug' })`: Initialize widget
- `HyrdWidget({ method: 'loaded', callback: function })`: Handle loaded event
- `HyrdWidgetManager.verifyToken(token)`: Verify JWT token
- `HyrdWidgetManager.clearToken()`: Clear stored authentication token (logout)

#### Functions

- `loadPaulJobWidget()`: Initialize and load the widget
- `loadPaulJobScript()`: Load the widget SDK script
- `initializePaulJob()`: Initialize widget configuration
- `authenticateUserWithPaulJob()`: Handle user authentication
- `logoutFromPaulJob()`: Clear user authentication and logout

## Support

For additional support or questions:
- Check the Hyrd dashboard documentation
- Contact the integration team
- Review browser console for error messages 
const express = require('express');
const { createHash } = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// HR Token endpoint
app.post('/hr-token', async (req, res) => {
  try {
    const { userId, email, firstName, lastName } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        error: 'userId and email are required'
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const jti = createHash('sha256')
      .update(`${userId}-${now}-${Math.random()}`)
      .digest('hex');

    const expiresIn = 60 * 60 * 24 * 30 * 2; // 2 months

    const claims = {
      iss: 'https://app.paulsjob.ai',
      aud: 'paul-job-update',
      sub: userId,
      email,
      firstName,
      lastName,
      exp: now + expiresIn,
      iat: now,
      nbf: now,
      jti,
    }
  

    const privateKeyRaw = process.env.PRIVATE_KEY

    if (!privateKeyRaw) {
      return res.status(500).json({
        error: 'SSO private key is not configured'
      });
    }

    // JWT signing options
    const signOptions = {
      algorithm: 'RS256',
      keyid: process.env.KEY_ID,
    };

    let token;
    try {
      // Create JWT using jsonwebtoken library
      token = jwt.sign(claims, privateKeyRaw, signOptions);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to sign JWT token'
      });
    }

    res.json({
      token,
      expiresIn,
    });

  } catch (error) {
    console.error('Error in hr-token endpoint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`HR Token endpoint: http://localhost:${port}/hr-token`);
  console.log(`Health check: http://localhost:${port}/health`);
});

module.exports = app; 
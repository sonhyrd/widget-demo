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
    };

    const privateKeyRaw = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAv0uFykDlwckNap9y359r+kCiiSxXIUGkC2BePJqJ+LHTElrs
NH4zDn8c7v91a9ceg56Uii07aJ3j99JUsMhpUC2mWLVR3HCTYXKHz2vKcoU7AZmL
p3raUwbDBK2+eWw1coPfTAXxGfN0aHR+3brA/OttZxZuhMhnY8oG/z2hXNz6jcLj
pbLbrCgJXZ0ezG1pHtJ8RPTGMSp0uQhu96uypRcx0kZKDy3HOrknFmuD2x6D4Duc
uWTmmVobkG5PbvlvS4x0qAzPPFjlGHCfK3eS10J6egIbzFrGUTHVHKhC0uHtI+Zy
9kVRY/TmCbImlNglBXvbVIq5ariwGOKaIjDRJQIDAQABAoIBAQC+Nwu3XKbZ9eCo
aBqi8HQ/KKw2OGf/QrUrNs0d+BE/wRsAAncjj2WXgaA0qsKI1CScfkB30ZhkY7P+
hh/+lZnaxznEta/Lwgla+ba/8xAgpghRg+vRQqD7tBqReW6QcKAI2cZdYv8mbeYP
w98u/ffOxw9HVY/Z6yibmpUwkoj0u3BycPlBdyND7v8k//jdhvVF5ibcB/XpFk1H
ppG5m3vjwxBu5EDeeUpE3Y98kgk7aQRITlelITYaP89jtDLoDbqfPtNGoXD68AHE
859R/VBzRqcDZATCds3HFT4Ns40FJZhup4vHxybnjc+A12L5+ep7xHtxiVDRF+V6
x3PEdDEhAoGBAPd8iYhsmjrdbq80UbNBUygdaAdvjwdXsOpeX4O+xJaskELHB2YJ
uVC12HQO4xSJGHOH7cPLV+MlGGx+mm2g7IoLwzrUvS41520xd4/v+EWvoqQD04jc
EsAReE1Awq00qr7+bgZoeDZnPKQqgz+Q0z7PHiRyEv+LA9TujbO5iKp9AoGBAMXg
JDADX8yp3fbbKK2Z0aSLCGS5/25ugybXRK5dAO+zeHD1jO7AMXg2KWh68kURrRBe
A3O+uvLu+6uDL7CGxIM9iorzyrraSteE1ja70qLViGhmfu6d8cexq8DdHr5JIu5h
TrH4iQUqj548qsK6WdIoxymq5d5HxiWD0vaSC9nJAoGANnsA37pgnVK/mewfjCF2
R99pVjG1v70LIhzSU/M73ZtxSnH76/d6Bw1w7+OTE6M2ccBbk/2AhG1XGhMotbd2
OtFqEdphJvoQzxXTpykBc329hPOeroMb0ZJG9GKsOGrep5rk55450GgbjlwZdnXQ
OwRnM0i1a/HTTx2Qrh7KuhUCgYB69fbm0yHz11b0MGoNvrkUq8TyetZstEXRnBG0
3FxZl8fvQddrAYl8LwP6RfRI0VwfAJzajxozHijMAsBezNBO0a5G/IntJPs/A+/t
oTeaMmEKpy6XbxSwyAp31bBmBKKtSVCSrWPQDwuiBAcE7LImM2rXzLf9MdLCuzEc
QdMVaQKBgATd+cGzyk5IMqUznu4H7ueoxeWvUZNr0+c5ytJ34fQZf9F+mJzO8Cbp
oxPIJZZ6UAXxIRs7IX+/QoOlcFMIqtUGUnct5ICD6Kdx4gmdnwat5a1izfmw1keo
5kzqAZ60HdJfH8ynoVZ0S7rLt7ZIOdIs/dg5do1PAEFvl8M1C4nb
-----END RSA PRIVATE KEY-----`;

    if (!privateKeyRaw) {
      return res.status(500).json({
        error: 'SSO private key is not configured'
      });
    }

    // JWT signing options
    const signOptions = {
      algorithm: 'RS256',
      keyid: '20250606-d92b',
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
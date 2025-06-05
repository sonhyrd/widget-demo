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
MIIEowIBAAKCAQEArYGydUoG+qDLb2gD7NpPJA9HXjtrmeh/rz2CVnh8eBarolh0
OFFdt2eX8FsI1aVJuRFuSX6WlEeS/yEH9M3O6auMrM3XfruvupCDZ/73s8G8Zl3x
NLuYNqzoJEGSRj5jbvRYluiMT1iS5LX7mC+pPnt7OUA+sZ4HG2qykaj2bzVqOUe0
s36GP/IGhiideH0xzM6MxB/TD0Wu1r/t4HvDEB1AhTA8iROkxWVL2BQu/GuVrGkZ
B38OgoCQX1Q/Jz2T/06UuYHNrOmqpDt9Q4wCJf7vYL7XGYpXmJeaYDX2U+LBNT7x
wizVdDi4MrfRt8j5YWC5rN852AgCS7P/d09I0QIDAQABAoIBADpr6F4L3gu35qgN
evzeiTVYG6zEDzgUjCHCcUeSbD63S3VvmTp5Uzf1HrjkvjXJ4Of60YrXn/Yvn3Re
d+JbBieyBr0M1lmq8sG79TMoK9mQC1LgoN4jqF4InGXQ2mLikPKEPewaQ1xYM6Xl
DOEycydBxr0BP9ronfYCWDwpi0joQmDEUZXQ0gWTrU7v9OiOYfgOakXTJ3qm9VqB
A/wgM1aCJndtjHEdXZ1fKXoqX9ME5x6qNCbgorLW83XogxY4eN24fFrihe2LDZw6
E91dQBib6IH6w5iqOWgghHi3sgV6qzE8b23ET3P7zQhBqRfrGFRfvq2gWgEJ1FnQ
x279DV0CgYEAypD71LxQmmRDTYfyJvMwbzueJra1t++ykSkTdkdrKIttvlBaNDPN
2zatiEdg1JAjkUm+eP/Y9xOiJ+cGASSTgNOPoIfTKzgxlv6+8nCK0BqqQz/ZRhYi
outJpu1BAazr8eF1geiFHYBxv4OSJqWJ1sDl4ke4H9O9qsYMOlSfZ9sCgYEA20Za
NawjohIqGdfJfBJXghJolCEA8GYjgJhVyknW2SfZM/lSlS9lwFZ0lYdONDRhDPC9
mE16Vlz48qDXB7KNgCMcVGijPprl9QE+IK5m7mN/oTCl1dZWUKMeopBdEP3TGw9Y
V6LynL6SayahNxbKwy4C96FNwrPulbUu61Ezl8MCgYBmczGLBLtXesI3Yjxsyq6C
c4qnVd1ObCLKHBZFyhU+alZU3NricBj7eAoIVOF6YHQ8tSlqlSusuvdWaxe0WEVp
8JZBwLBiuYcLMUht4dGzMulOHerL8cIO2CVmEbTBHi4vJbKCw5EfvKjLDcZLWYn/
XYxnB5LuNe9FgekJT2dX5QKBgQCHb3HCmvs7XJrScX0KfE2+kl4zuBrbYUrmX7EF
jAv+/uTifEmsyaTAYuYJgZQlHIEhPATu8FPyyeQeAIgwQfGyRn12CVdjEMueQ9E6
4F3FOoGXbvPPG18e2VHPuPkyyIQ+v4CiSIwvkmnfcvG6lAJTAbVlfCUKcJaZs1oy
kGocfwKBgB/SBed7NSYZ/gNFV1mZmTyjH/THlXYZ2wJRpU69e19Fy2dFdx4jIjFP
AzUeHNWoqX3tB33srIJdlobTaXBXyyFyojs4G2YclNfWpBbXQFoMrikCpRcjpOOO
0D9txZdSgfYmXyWMiXHVTigbBuliK70BLrZoaDfUX/eJupOPMHgN
-----END RSA PRIVATE KEY-----`;

    if (!privateKeyRaw) {
      return res.status(500).json({
        error: 'SSO private key is not configured'
      });
    }

    // JWT signing options
    const signOptions = {
      algorithm: 'RS256',
      keyid: '20250528-f216',
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
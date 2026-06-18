// Import Express and bcrypt
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Import database
const pool = require('../db');

// POST /api/auth/login - User logs in
router.post('/login', async (request, response) => {
  try {
    // Get email and password from the request
    const { email, password } = request.body;

    // Validate: Did they send both email and password?
    if (!email || !password) {
      return response.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find the user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // Check: Does the user exist?
    if (userResult.rows.length === 0) {
      return response.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const user = userResult.rows[0];

    // Compare the password they sent with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    // Check: Does the password match?
    if (!passwordMatch) {
      return response.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Password is correct! Create a session
    request.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    // Send back success
    response.json({
      success: true,
      message: 'Logged in successfully',
      user: request.session.user,
    });
  } catch (error) {
    console.error('Error during login:', error);
    response.status(500).json({
      error: 'Login failed',
    });
  }
});

// POST /api/auth/logout - User logs out
router.post('/logout', (request, response) => {
  try {
    // Destroy the session
    request.session.destroy((err) => {
      if (err) {
        return response.status(500).json({
          error: 'Logout failed',
        });
      }

      // Session destroyed
      response.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (error) {
    console.error('Error during logout:', error);
    response.status(500).json({
      error: 'Logout failed',
    });
  }
});

// Export the router
module.exports = router;
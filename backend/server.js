// Load environment variables
require('dotenv').config();

// Import Express
const express = require('express');

// Import session management
const session = require('express-session');

// Import the database connection
const pool = require('./db');

// Create the Express app
const app = express();

// Middleware: Allow Express to read JSON from requests
app.use(express.json());

// Configure sessions
app.use(session({
  secret: 'your-secret-key-change-this-in-production', // Random string (change this later)
  resave: false,                                         // Don't resave sessions that haven't changed
  saveUninitialized: false,                              // Don't create session until data is stored
  cookie: {
    secure: false,                                       // Set to true if using HTTPS
    httpOnly: true,                                      // Prevent JavaScript from accessing the cookie
    maxAge: 1000 * 60 * 60 * 24,                        // Cookie expires in 24 hours
  },
}));

// Import the applications auth
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Import the applications routes
const applicationsRoutes = require('./routes/applications');

// Use the applications routes at /api/applications
app.use('/api/applications', applicationsRoutes);

// Test endpoint (just to verify the server is working)
app.get('/api/test', async (request, response) => {
  try {
    // Query the database
    const result = await pool.query('SELECT NOW()');
    response.json({
      message: '✅ Server and database are working!',
      timestamp: result.rows[0],
    });
  } catch (error) {
    console.error('Error:', error);
    response.status(500).json({ error: 'Database error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
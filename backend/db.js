// Load environment variables from .env
require('dotenv').config();

// Import the PostgreSQL library
const { Pool } = require('pg');

// Create a connection pool to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Export the pool so other files can use it
module.exports = pool;
// server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check route
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    console.error('Health check error:', err);  // <-- this will show details in Terminal
    res.status(500).json({ ok: false, error: 'Database error' });
  }
});


// Root route
app.get('/', (req, res) => {
  res.send('FoodShare API is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`FoodShare server listening on http://localhost:${PORT}`);
});

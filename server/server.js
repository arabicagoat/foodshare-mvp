// server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

// Helper: basic email validation
function isValidEmail(email) {
  return typeof email === 'string' && email.includes('@');
}

// Sign-up endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, display_name, zip_code, lat, lng } = req.body;

    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'email, password, and display_name are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, zip_code, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, display_name, zip_code, lat, lng, created_at`,
      [email, hashed, display_name, zip_code || null, lat || null, lng || null]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Root route
app.get('/', (req, res) => {
  res.send('FoodShare API is running');
});

// Create a food listing
app.post('/api/listings', async (req, res) => {
  try {
    const { user_id, title, description, pickup_location, lat, lng } = req.body;

    if (!user_id || !title || !description) {
      return res.status(400).json({ error: 'user_id, title, and description are required' });
    }

    const result = await pool.query(
      `INSERT INTO food_listings (user_id, title, description, pickup_location, lat, lng, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'available')
       RETURNING *`,
      [user_id, title, description, pickup_location || null, lat || null, lng || null]
    );

    res.status(201).json({ listing: result.rows[0] });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available listings (for receivers)
app.get('/api/listings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        food_listings.*,
        users.display_name,
        users.zip_code
       FROM food_listings
       JOIN users ON food_listings.user_id = users.id
       WHERE food_listings.status = 'available'
       ORDER BY food_listings.created_at DESC
       LIMIT 20`
    );

    res.json({ listings: result.rows });
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my listings (for givers)
app.get('/api/listings/my/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM food_listings
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ listings: result.rows });
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a food listing
app.post('/api/listings', async (req, res) => {
  try {
    const { user_id, title, description, pickup_location, lat, lng } = req.body;

    if (!user_id || !title || !description) {
      return res.status(400).json({ error: 'user_id, title, and description are required' });
    }

    const result = await pool.query(
      `INSERT INTO food_listings (user_id, title, description, pickup_location, lat, lng, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'available')
       RETURNING *`,
      [user_id, title, description, pickup_location || null, lat || null, lng || null]
    );

    res.status(201).json({ listing: result.rows[0] });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available listings (for receivers)
app.get('/api/listings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        food_listings.*,
        users.display_name,
        users.zip_code
       FROM food_listings
       JOIN users ON food_listings.user_id = users.id
       WHERE food_listings.status = 'available'
       ORDER BY food_listings.created_at DESC
       LIMIT 20`
    );

    res.json({ listings: result.rows });
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my listings (for givers)
app.get('/api/listings/my/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM food_listings
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ listings: result.rows });
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`FoodShare server listening on http://localhost:${PORT}`);
});

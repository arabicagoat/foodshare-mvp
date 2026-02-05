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
  `INSERT INTO users (
      email, password_hash, display_name, zip_code, lat, lng,
      role_giver, role_receiver, role_driver,
      pref_no_contact, pref_pickup_notes, pref_notification_level
   )
   VALUES ($1, $2, $3, $4, $5, $6,
           $7, $8, $9,
           $10, $11, $12)
   RETURNING id, email, display_name, zip_code, lat, lng,
             role_giver, role_receiver, role_driver,
             pref_no_contact, pref_pickup_notes, pref_notification_level,
             created_at`,
  [
    email,
    hashed,
    display_name,
    zip_code || null,
    lat || null,
    lng || null,
    // default roles based on signup role field:
    req.body.role === 'giver',
    req.body.role === 'receiver' || !req.body.role,
    req.body.role === 'driver',
    false,
    null,
    'all'
  ]
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

// Claim a listing (receiver requests it)
app.patch('/api/listings/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ error: 'receiver_id is required' });
    }

    // Update listing status and store who claimed it
    const result = await pool.query(
      `UPDATE food_listings 
       SET status = 'claimed'
       WHERE id = $1 AND status = 'available'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found or already claimed' });
    }

    // Store the claim in messages table (simple way to track who claimed it)
    await pool.query(
      `INSERT INTO messages (listing_id, sender_id, receiver_id, content)
       VALUES ($1, $2, $3, $4)`,
      [id, receiver_id, result.rows[0].user_id, 'CLAIM_REQUEST']
    );

    res.json({ listing: result.rows[0], message: 'Listing claimed successfully!' });
  } catch (err) {
    console.error('Claim listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark listing as completed
app.patch('/api/listings/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE food_listings 
       SET status = 'completed'
       WHERE id = $1 AND status = 'claimed'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found or not in claimed status' });
    }

    res.json({ listing: result.rows[0], message: 'Marked as completed!' });
  } catch (err) {
    console.error('Complete listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single listing details
app.get('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        food_listings.*,
        users.display_name,
        users.zip_code
       FROM food_listings
       JOIN users ON food_listings.user_id = users.id
       WHERE food_listings.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ listing: result.rows[0] });
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const result = await pool.query(
  `SELECT id, email, display_name, zip_code, lat, lng,
          role_giver, role_receiver, role_driver,
          pref_no_contact, pref_pickup_notes, pref_notification_level,
          password_hash
   FROM users
   WHERE email = $1`,
  [email]
);


    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Don't send password_hash back to client
    delete user.password_hash;

    res.json({ user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Get current user's profile
app.get('/api/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, display_name, zip_code, lat, lng,
              role_giver, role_receiver, role_driver,
              pref_no_contact, pref_pickup_notes, pref_notification_level
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user's profile
app.put('/api/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      display_name,
      zip_code,
      role_giver,
      role_receiver,
      role_driver,
      pref_no_contact,
      pref_pickup_notes,
      pref_notification_level
    } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET display_name = $1,
           zip_code = $2,
           role_giver = $3,
           role_receiver = $4,
           role_driver = $5,
           pref_no_contact = $6,
           pref_pickup_notes = $7,
           pref_notification_level = $8
       WHERE id = $9
       RETURNING id, email, display_name, zip_code, lat, lng,
                 role_giver, role_receiver, role_driver,
                 pref_no_contact, pref_pickup_notes, pref_notification_level`,
      [
        display_name,
        zip_code,
        role_giver,
        role_receiver,
        role_driver,
        pref_no_contact,
        pref_pickup_notes,
        pref_notification_level,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`FoodShare server listening on http://localhost:${PORT}`);
});

-- ===================================
-- FoodShare Initial Schema
-- Base tables: users and listings
-- ===================================

-- Drop existing tables if recreating
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  zip_code VARCHAR(10),
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  
  -- Role capabilities (booleans)
  role_giver BOOLEAN DEFAULT FALSE,
  role_receiver BOOLEAN DEFAULT TRUE,
  role_driver BOOLEAN DEFAULT FALSE,
  
  -- Preferences
  pref_no_contact BOOLEAN DEFAULT FALSE,
  pref_pickup_notes TEXT,
  pref_notification_level VARCHAR(20) DEFAULT 'all',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- LISTINGS TABLE
CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Food details
  category VARCHAR(50),
  dietary_tags TEXT[],
  allergens TEXT[],
  quantity_available INTEGER DEFAULT 1,
  quantity_unit VARCHAR(20) DEFAULT 'serving',
  
  -- Pickup info
  pickup_location TEXT,
  pickup_window_start TIMESTAMP,
  pickup_window_end TIMESTAMP,
  pickup_instructions TEXT,
  
  -- Media
  photo_url TEXT,
  
  -- Location
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  
  -- Legacy status (will be replaced by transactions)
  status VARCHAR(50) DEFAULT 'available',
  receiver_id INTEGER REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_category CHECK (
    category IN (
      'Produce',
      'Baked Goods',
      'Dairy',
      'Prepared Meals',
      'Pantry Items',
      'Beverages',
      'Other'
    )
  )
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_zip ON users(zip_code);
CREATE INDEX idx_listings_user ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listings_category ON listings(category);

-- Comments
COMMENT ON TABLE users IS 'FoodShare users with role-based capabilities';
COMMENT ON TABLE listings IS 'Food items available for sharing';
COMMENT ON COLUMN users.role_giver IS 'Can post food to share';
COMMENT ON COLUMN users.role_receiver IS 'Can request food pickups';
COMMENT ON COLUMN users.role_driver IS 'Can volunteer for deliveries';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Base schema created successfully!';
END $$;

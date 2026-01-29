-- Simple FoodShare MVP schema (3 tables)

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    zip_code VARCHAR(10),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. FOOD_LISTINGS
CREATE TABLE IF NOT EXISTS food_listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    photo_url VARCHAR(500),
    pickup_location TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    status VARCHAR(20) DEFAULT 'available', -- available, claimed, completed
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES food_listings(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_listings_location ON food_listings(lat, lng);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

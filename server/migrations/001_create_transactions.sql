-- ===================================
-- FoodShare Transactions Table
-- Separates food listings from order/delivery transactions
-- ===================================

CREATE TABLE IF NOT EXISTS transactions (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- References
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  giver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  
  -- Timestamps for each state transition
  created_at TIMESTAMP DEFAULT NOW(),
  claimed_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  ready_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  delivered_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Delivery details
  delivery_address TEXT,
  delivery_zone VARCHAR(10),
  delivery_instructions TEXT,
  
  -- Ratings and feedback
  receiver_rating INTEGER CHECK (receiver_rating >= 1 AND receiver_rating <= 5),
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  giver_rating INTEGER CHECK (giver_rating >= 1 AND giver_rating <= 5),
  receiver_feedback TEXT,
  driver_feedback TEXT,
  
  -- Issue tracking
  issue_reported BOOLEAN DEFAULT FALSE,
  issue_description TEXT,
  issue_resolved BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (
    status IN (
      'AVAILABLE',
      'CLAIMED',
      'CONFIRMED',
      'READY_FOR_PICKUP',
      'IN_TRANSIT',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED'
    )
  )
);

-- Indexes for performance
CREATE INDEX idx_transactions_listing ON transactions(listing_id);
CREATE INDEX idx_transactions_giver ON transactions(giver_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX idx_transactions_driver ON transactions(driver_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- Composite index for feed queries
CREATE INDEX idx_transactions_active ON transactions(status, created_at DESC)
  WHERE status IN ('AVAILABLE', 'CLAIMED', 'CONFIRMED', 'READY_FOR_PICKUP', 'IN_TRANSIT');

COMMENT ON TABLE transactions IS 'Tracks the lifecycle of food sharing transactions from listing to delivery';
COMMENT ON COLUMN transactions.status IS 'Current state: AVAILABLE, CLAIMED, CONFIRMED, READY_FOR_PICKUP, IN_TRANSIT, DELIVERED, COMPLETED, CANCELLED';

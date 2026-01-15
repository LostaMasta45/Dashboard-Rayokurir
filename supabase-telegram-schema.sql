-- ============================================
-- RAYO KURIR - NOTIFICATIONS TABLE
-- Supabase PostgreSQL
-- ============================================
-- This schema only adds the notifications table
-- since other tables (mitra, couriers, orders, etc.)
-- already exist in the database.
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- NOTIFICATIONS TABLE (for Telegram bot logging)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target
  target_type VARCHAR(20) NOT NULL, -- admin, kurir, customer
  target_id VARCHAR(100), -- chat_id or user_id
  
  -- Content
  message TEXT NOT NULL,
  type VARCHAR(50), -- order_new, status_update, cod_reminder, etc.
  
  -- Reference (using TEXT to match existing orders.id type)
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Status
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

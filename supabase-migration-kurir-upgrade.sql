-- Supabase Migration Script for Courier Workflow Upgrade
-- Run this in Supabase SQL Editor

-- ================================================
-- 1. Update couriers table with Telegram fields
-- ================================================
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS pairing_code_expires_at TIMESTAMPTZ;

-- Create index for faster lookup by telegram_user_id
CREATE INDEX IF NOT EXISTS idx_couriers_telegram_user_id 
ON couriers(telegram_user_id);

-- ================================================
-- 2. Update orders table with new fields
-- ================================================

-- Add mapsLink to pickup and dropoff (if stored as JSONB)
-- If pickup/dropoff are JSONB columns, no migration needed - the TypeScript will handle it

-- Add new columns if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '{"returnPP": false, "bulky": false, "heavy": false, "waitingFee": false}'::jsonb,
ADD COLUMN IF NOT EXISTS pod_photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS audit_log JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cod_settled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS talangan_diganti BOOLEAN DEFAULT false;

-- ================================================
-- 3. Add new status enum values (if using enum)
-- ================================================
-- If your status column is an ENUM, run these:
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'NEW';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'OFFERED';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ACCEPTED';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'REJECTED';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'OTW_PICKUP';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'PICKED';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'OTW_DROPOFF';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'NEED_POD';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'DELIVERED';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'CANCELLED';

-- If your status column is VARCHAR, no migration needed

-- ================================================
-- 4. Create RLS policies for new columns (optional)
-- ================================================
-- Ensure your existing RLS policies allow access to new columns

-- ================================================
-- 5. Verify migration
-- ================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'couriers' 
AND column_name IN ('telegram_user_id', 'telegram_chat_id', 'pairing_code');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('addons', 'pod_photos', 'audit_log', 'cod_settled');

-- Migration to add missing columns to orders table for upgradebot.md implementation
-- Run this in Supabase SQL Editor

-- Add auditLog column as JSONB array if not exists
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "auditLog" JSONB DEFAULT '[]'::jsonb;

-- Add addons column if not exists (for service type add-ons)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '{}'::jsonb;

-- Add podPhotos column if not exists (for proof of delivery photos)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "podPhotos" JSONB DEFAULT '[]'::jsonb;

-- Add talanganDiganti column if not exists
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "talanganDiganti" BOOLEAN DEFAULT false;

-- Add talanganReimbursed column if not exists
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "talanganReimbursed" BOOLEAN DEFAULT false;

-- Add codSettled column if not exists
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "codSettled" BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

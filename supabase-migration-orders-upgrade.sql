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

-- ========================================
-- FIX CONSTRAINT: jenisOrder values mismatch
-- ========================================
-- The old constraint only allows: 'Barang', 'Makanan', 'Dokumen', 'Antar Jemput'
-- The new form uses: 'Antar Barang', 'Jemput Barang', 'Titip Beli', 'Dokumen', 'Lainnya'

-- Step 1: Drop the old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_jenisorder_check;

-- Step 2: Add new constraint with updated values
ALTER TABLE orders ADD CONSTRAINT orders_jenisorder_check 
CHECK ("jenisOrder" IN ('Antar Barang', 'Jemput Barang', 'Titip Beli', 'Dokumen', 'Lainnya', 'Barang', 'Makanan', 'Antar Jemput'));

-- ========================================
-- FIX CONSTRAINT: serviceType (if needed)
-- ========================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_servicetype_check;
ALTER TABLE orders ADD CONSTRAINT orders_servicetype_check 
CHECK ("serviceType" IN ('Regular', 'Express', 'Same Day', 'Reguler'));

-- ========================================
-- FIX CONSTRAINT: status (add new bot statuses)
-- ========================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'BARU', 'ASSIGNED', 'PICKUP', 'DIKIRIM', 'SELESAI',
  'NEW', 'OFFERED', 'ACCEPTED', 'REJECTED', 
  'OTW_PICKUP', 'PICKED', 'OTW_DROPOFF', 'NEED_POD', 'DELIVERED', 'CANCELLED'
));

-- ========================================
-- Verify constraints
-- ========================================
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass;

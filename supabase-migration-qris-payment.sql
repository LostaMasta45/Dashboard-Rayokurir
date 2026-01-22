-- Migration to add QRIS/Cash payment method tracking columns to orders table
-- Run this in Supabase SQL Editor
-- Created: 2026-01-22

-- ========================================
-- ADD PAYMENT METHOD COLUMNS
-- ========================================

-- Add ongkir_payment_method column (CASH, QRIS, TRANSFER)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "ongkirPaymentMethod" TEXT;

-- Add ongkir_payment_status column (PENDING, PAID)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "ongkirPaymentStatus" TEXT;

-- Add ongkir_paid_at column (timestamp when payment was made)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "ongkirPaidAt" TIMESTAMPTZ;

-- ========================================
-- ADD CHECK CONSTRAINTS
-- ========================================

-- Constraint for valid payment methods
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_ongkir_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_ongkir_payment_method_check 
CHECK ("ongkirPaymentMethod" IS NULL OR "ongkirPaymentMethod" IN ('CASH', 'QRIS', 'TRANSFER'));

-- Constraint for valid payment status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_ongkir_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_ongkir_payment_status_check 
CHECK ("ongkirPaymentStatus" IS NULL OR "ongkirPaymentStatus" IN ('PENDING', 'PAID'));

-- ========================================
-- ADD INDEX FOR PERFORMANCE
-- ========================================

-- Index for filtering orders by payment method
CREATE INDEX IF NOT EXISTS idx_orders_ongkir_payment_method 
ON orders ("ongkirPaymentMethod") 
WHERE "ongkirPaymentMethod" IS NOT NULL;

-- Composite index for finance queries (payment method + status + date)
CREATE INDEX IF NOT EXISTS idx_orders_payment_finance 
ON orders ("ongkirPaymentMethod", "ongkirPaymentStatus", "createdAt") 
WHERE "ongkirPaymentMethod" IS NOT NULL;

-- ========================================
-- VERIFY COLUMNS ADDED
-- ========================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('ongkirPaymentMethod', 'ongkirPaymentStatus', 'ongkirPaidAt')
ORDER BY column_name;

-- ========================================
-- VERIFY CONSTRAINTS
-- ========================================

SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass
  AND conname LIKE '%ongkir%';

-- Migration: Add sudah_kirim_wa column to umkm table
-- This column tracks whether WhatsApp promotional message has been sent to each UMKM

-- Add the new column
ALTER TABLE umkm 
ADD COLUMN IF NOT EXISTS sudah_kirim_wa BOOLEAN DEFAULT FALSE;

-- Update existing rows to have false value
UPDATE umkm SET sudah_kirim_wa = FALSE WHERE sudah_kirim_wa IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN umkm.sudah_kirim_wa IS 'Indicates if WhatsApp promotional message has been sent to this UMKM';

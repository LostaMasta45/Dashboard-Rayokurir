-- Add missing columns to mitra table
ALTER TABLE mitra ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE mitra ADD COLUMN IF NOT EXISTS logo text;
ALTER TABLE mitra ADD COLUMN IF NOT EXISTS cover text;
ALTER TABLE mitra ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE mitra ADD COLUMN IF NOT EXISTS "waktuAntar" text; -- Quoted to preserve camelCase if needed, or usually snake_case is better but let's stick to TS interface
ALTER TABLE mitra ADD COLUMN IF NOT EXISTS "jumlahReview" integer DEFAULT 0;
ALTER TABLE mitra ADD COLUMN IF NOT EXISTS "sedangBuka" boolean DEFAULT false;

-- Just in case, grant permissions again? No, RLS policy handles rows, GRANT handles table access.
GRANT ALL ON mitra TO postgres;
GRANT ALL ON mitra TO service_role;
GRANT ALL ON mitra TO anon;
GRANT ALL ON mitra TO authenticated;

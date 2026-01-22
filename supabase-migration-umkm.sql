-- UMKM Tracking Table
-- Untuk menyimpan data UMKM dan status outreach

CREATE TABLE IF NOT EXISTS umkm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    zona TEXT DEFAULT 'KANAN', -- 'KANAN' atau 'KIRI'
    brosur_disebar BOOLEAN DEFAULT FALSE,
    daftar_mitra BOOLEAN DEFAULT FALSE,
    wa TEXT DEFAULT '',
    catatan TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk search
CREATE INDEX IF NOT EXISTS idx_umkm_nama ON umkm (nama);
CREATE INDEX IF NOT EXISTS idx_umkm_zona ON umkm (zona);

-- Enable RLS
ALTER TABLE umkm ENABLE ROW LEVEL SECURITY;

-- Policy untuk public read/write (untuk demo, bisa diperketat nanti)
DROP POLICY IF EXISTS "Allow all access to umkm" ON umkm;
CREATE POLICY "Allow all access to umkm" ON umkm
    FOR ALL
    USING (true)
    WITH CHECK (true);

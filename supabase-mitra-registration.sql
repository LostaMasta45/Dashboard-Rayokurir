-- Add 'pending' to Mitra status if needed, or rely on sedangBuka = false
-- Enable RLS for mitra table
ALTER TABLE mitra ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) to insert into mitra (for registration)
CREATE POLICY "Enable insert for everyone" ON mitra FOR INSERT WITH CHECK (true);

-- Allow everyone to read mitra (public catalog)
CREATE POLICY "Enable read access for everyone" ON mitra FOR SELECT USING (true);

-- Allow authenticated (admin) to update/delete
CREATE POLICY "Enable update for authenticated users only" ON mitra FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON mitra FOR DELETE USING (auth.role() = 'authenticated');

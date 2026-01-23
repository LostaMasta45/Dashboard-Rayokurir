-- Enable RLS for menu_items table
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) to insert into menu_items (for registration)
-- We might want to restrict this to only link to 'their' mitra_id but for anonymous registration we just allow insert.
CREATE POLICY "Enable insert for everyone" ON menu_items FOR INSERT WITH CHECK (true);

-- Allow everyone to read menu_items (public catalog)
CREATE POLICY "Enable read access for everyone" ON menu_items FOR SELECT USING (true);

-- Allow authenticated (admin) to update/delete
CREATE POLICY "Enable update for authenticated users only" ON menu_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON menu_items FOR DELETE USING (auth.role() = 'authenticated');

-- Grant access
GRANT ALL ON menu_items TO postgres;
GRANT ALL ON menu_items TO service_role;
GRANT ALL ON menu_items TO anon;
GRANT ALL ON menu_items TO authenticated;

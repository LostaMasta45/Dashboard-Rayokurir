
-- =============================================
-- COURIER PHOTOS BUCKET
-- =============================================
-- Create bucket for courier photos (testimoni/activity)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('courier-photos', 'courier-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access
CREATE POLICY "Public Access Courier Photos" ON storage.objects FOR SELECT USING (bucket_id = 'courier-photos');

-- Policy for authenticated upload (couriers)
CREATE POLICY "Auth Upload Courier Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'courier-photos');

-- Policy for authenticated update
CREATE POLICY "Auth Update Courier Photos" ON storage.objects FOR UPDATE USING (bucket_id = 'courier-photos');

-- Policy for authenticated delete
CREATE POLICY "Auth Delete Courier Photos" ON storage.objects FOR DELETE USING (bucket_id = 'courier-photos');

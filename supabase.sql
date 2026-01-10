-- Tabel users
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  role TEXT CHECK (role IN ('ADMIN', 'KURIR')) NOT NULL,
  name TEXT NOT NULL,
  courierId TEXT
);

-- Tabel couriers
CREATE TABLE couriers (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  wa TEXT NOT NULL,
  aktif BOOLEAN NOT NULL,
  online BOOLEAN NOT NULL
);

-- Tabel orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  createdAt TIMESTAMP NOT NULL,
  createdDate TEXT NOT NULL,
  pengirim JSONB NOT NULL, -- { nama, wa }
  pickup JSONB NOT NULL,   -- { alamat }
  dropoff JSONB NOT NULL,  -- { alamat }
  kurirId TEXT,
  status TEXT CHECK (status IN ('BARU', 'ASSIGNED', 'PICKUP', 'DIKIRIM', 'SELESAI')) NOT NULL,
  jenisOrder TEXT CHECK (jenisOrder IN ('Barang', 'Makanan', 'Dokumen', 'Antar Jemput')) NOT NULL,
  serviceType TEXT CHECK (serviceType IN ('Reguler', 'Express', 'Same Day')) NOT NULL,
  ongkir INTEGER NOT NULL,
  danaTalangan INTEGER NOT NULL,
  bayarOngkir TEXT CHECK (bayarOngkir IN ('NON_COD', 'COD')) NOT NULL,
  talanganReimbursed BOOLEAN,
  cod JSONB NOT NULL, -- { nominal, isCOD, codPaid }
  nonCodPaid BOOLEAN NOT NULL,
  notes TEXT
);

-- Tabel cod_history
CREATE TABLE cod_history (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  kurirId TEXT NOT NULL,
  nominal INTEGER NOT NULL,
  tanggal TEXT NOT NULL,
  buktiUrl TEXT
);

-- Tabel expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  nominal INTEGER NOT NULL
);


-- Tabel courier_photos
CREATE TABLE courier_photos (
  id TEXT PRIMARY KEY,
  kurirId TEXT NOT NULL,
  kurirName TEXT NOT NULL,
  photoUrl TEXT NOT NULL,
  description TEXT,
  orderId TEXT,
  timestamp TEXT NOT NULL
);

-- Tabel contacts
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  address TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  notes TEXT,
  createdAt TEXT NOT NULL,
  lastContacted TEXT
);

-- Seed users
INSERT INTO users (username, role, name, courierId) VALUES
  ('admin', 'ADMIN', 'Administrator', NULL),
  ('kurir1', 'KURIR', 'Budi Santoso', '1'),
  ('kurir2', 'KURIR', 'Sari Dewi', '2');

-- Seed couriers
INSERT INTO couriers (id, nama, wa, aktif, online) VALUES
  ('1', 'Budi Santoso', '081234567890', TRUE, TRUE),
  ('2', 'Sari Dewi', '081234567891', TRUE, FALSE);

-- Tabel mitra (partners)
CREATE TABLE IF NOT EXISTS mitra (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT[] NOT NULL,
  logo TEXT,
  cover TEXT,
  lokasi TEXT,
  "waktuAntar" TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  "jumlahReview" INTEGER DEFAULT 0,
  "sedangBuka" BOOLEAN DEFAULT TRUE,
  whatsapp TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabel menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  "mitraId" TEXT NOT NULL REFERENCES mitra(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  harga INTEGER NOT NULL,
  gambar TEXT,
  "kategoriMenu" TEXT,
  terlaris BOOLEAN DEFAULT FALSE,
  tersedia BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_items_mitra ON menu_items("mitraId");
CREATE INDEX IF NOT EXISTS idx_mitra_kategori ON mitra USING GIN(kategori);

-- =============================================
-- SUPABASE STORAGE BUCKETS
-- =============================================
-- Jalankan di Supabase Dashboard > Storage > New Bucket
-- atau gunakan SQL berikut:

-- Buat bucket untuk gambar mitra (logos, covers, menus)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mitra-images', 'mitra-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy untuk public read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'mitra-images');

-- Policy untuk authenticated upload
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mitra-images');

-- Policy untuk authenticated delete
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'mitra-images');
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
  status TEXT CHECK (status IN ('MENUNGGU_PICKUP', 'PICKUP_OTW', 'BARANG_DIAMBIL', 'SEDANG_DIKIRIM', 'SELESAI')) NOT NULL,
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
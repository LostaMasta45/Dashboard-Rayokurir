-- ============================================
-- RAYO KURIR - DATABASE SCHEMA
-- Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. MITRA TABLE (Partners/Shops)
-- ============================================
CREATE TABLE IF NOT EXISTS mitra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'food', -- food, retail, pharmacy, service, special
  description TEXT,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  village VARCHAR(100), -- Desa
  district VARCHAR(100), -- Kecamatan
  
  -- Business Info
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_orders INT DEFAULT 0,
  
  -- Media
  cover_image TEXT,
  logo TEXT,
  
  -- Menu/Products (JSON)
  menu JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  
  -- Badges
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  has_promo BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. KURIR TABLE (Drivers)
-- ============================================
CREATE TABLE IF NOT EXISTS kurir (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  
  -- Status
  is_online BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_orders INT DEFAULT 0,
  active_orders INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  
  -- Location (optional, for future GPS tracking)
  last_latitude DECIMAL(10, 8),
  last_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- References
  mitra_id UUID REFERENCES mitra(id) ON DELETE SET NULL,
  kurir_id UUID REFERENCES kurir(id) ON DELETE SET NULL,
  
  -- Mitra Info (denormalized for convenience)
  mitra_name VARCHAR(100),
  mitra_type VARCHAR(20),
  pickup_address TEXT NOT NULL,
  
  -- Customer Info
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_landmark TEXT, -- Patokan
  customer_village VARCHAR(100), -- Desa
  
  -- Order Items
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ "name": "Item", "qty": 1, "price": 10000, "notes": "" }]
  
  -- Additional (for retail/service)
  shopping_list TEXT, -- Free text shopping list
  service_details JSONB, -- For service type
  
  -- Pricing
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- COD
  is_cod BOOLEAN DEFAULT true,
  cod_amount DECIMAL(12, 2) DEFAULT 0,
  cod_collected BOOLEAN DEFAULT false,
  cod_collected_at TIMESTAMPTZ,
  
  -- Options
  is_express BOOLEAN DEFAULT false,
  is_titip_beli BOOLEAN DEFAULT false, -- Free service if eligible
  
  -- Status
  status VARCHAR(20) DEFAULT 'MENUNGGU',
  -- MENUNGGU, PICKUP_OTW, BARANG_DIAMBIL, DIKIRIM, SELESAI, GAGAL, BATAL
  
  -- Notes
  notes TEXT,
  cancel_reason TEXT,
  fail_reason TEXT,
  
  -- Proof
  proof_photos TEXT[], -- Array of photo URLs/file_ids
  
  -- Timestamps
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. COD SETORAN TABLE (COD Deposits)
-- ============================================
CREATE TABLE IF NOT EXISTS cod_setoran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kurir_id UUID REFERENCES kurir(id) ON DELETE CASCADE,
  
  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  
  -- Orders included in this deposit
  order_ids UUID[] NOT NULL,
  
  -- Proof
  proof_photo TEXT,
  transfer_method VARCHAR(50), -- bank_transfer, cash, ewallet
  bank_name VARCHAR(50),
  account_number VARCHAR(50),
  
  -- Verification
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
  verified_by UUID, -- Admin who verified
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. NOTIFICATIONS TABLE (for logging)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target
  target_type VARCHAR(20) NOT NULL, -- admin, kurir, customer
  target_id VARCHAR(100), -- chat_id or user_id
  
  -- Content
  message TEXT NOT NULL,
  type VARCHAR(50), -- order_new, status_update, cod_reminder, etc.
  
  -- Reference
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Status
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_kurir ON orders(kurir_id);
CREATE INDEX IF NOT EXISTS idx_orders_mitra ON orders(mitra_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kurir_telegram ON kurir(telegram_id);
CREATE INDEX IF NOT EXISTS idx_kurir_online ON kurir(is_online);
CREATE INDEX IF NOT EXISTS idx_mitra_type ON mitra(type);
CREATE INDEX IF NOT EXISTS idx_mitra_slug ON mitra(slug);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Sample Mitra
INSERT INTO mitra (name, slug, type, address, phone, is_open, cover_image, menu) VALUES
('Warung Madura Pak Joko', 'warung-madura-pak-joko', 'retail', 'Jl. Pasar Lama No. 5, Sumobito', '081234567890', true, 
 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
 '[{"name": "Indomie Goreng", "price": 3000, "category": "Mie"}, {"name": "Telur Ayam 1kg", "price": 25000, "category": "Sembako"}]'),

('Kopi Kenangan', 'kopi-kenangan', 'food', 'Jl. Raya Sumobito No. 10', '081234567891', true,
 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
 '[{"name": "Kopi Susu", "price": 18000, "category": "Minuman"}, {"name": "Americano", "price": 22000, "category": "Minuman"}]'),

('Apotek Sehat', 'apotek-sehat', 'pharmacy', 'Jl. Kesehatan No. 3, Sumobito', '081234567892', true,
 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800',
 '[{"name": "Paracetamol", "price": 5000, "category": "Obat"}, {"name": "Vitamin C", "price": 15000, "category": "Vitamin"}]'),

('Laundry Express', 'laundry-express', 'service', 'Jl. Bersih No. 7, Sumobito', '081234567893', true,
 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800',
 '[{"name": "Cuci Kiloan", "price": 7000, "category": "Laundry"}, {"name": "Cuci Express", "price": 12000, "category": "Laundry"}]')

ON CONFLICT (slug) DO NOTHING;

-- Sample Kurir (Note: You'll need to add real telegram_id later)
-- INSERT INTO kurir (telegram_id, name, phone, is_online) VALUES
-- (123456789, 'Budi Santoso', '081111111111', true),
-- (987654321, 'Sari Wulandari', '081222222222', true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS kurir_updated_at ON kurir;
CREATE TRIGGER kurir_updated_at
  BEFORE UPDATE ON kurir
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS mitra_updated_at ON mitra;
CREATE TRIGGER mitra_updated_at
  BEFORE UPDATE ON mitra
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_generate_number ON orders;
CREATE TRIGGER orders_generate_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kurir ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mitra ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REALTIME (Enable for live updates)
-- ============================================
-- Run in Supabase Dashboard:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE kurir;

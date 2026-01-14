# 🤖 Telegram Bot Rayo Kurir

Dokumentasi lengkap untuk sistem Telegram Bot Rayo Kurir yang mencakup Bot Admin dan Bot Kurir.

## 📋 Overview

Sistem ini terdiri dari:

| Komponen | Deskripsi |
|----------|-----------|
| **Bot Admin** | Mengelola pesanan, assign kurir, laporan |
| **Bot Kurir** | Terima tugas, update status, upload bukti |
| **API Orders** | Create order & notify admin |
| **API Kurir** | CRUD operasi kurir |

## 🚀 Quick Start

### 1. Environment Variables

Pastikan file `.env.local` sudah berisi:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Bot Admin
TELEGRAM_ADMIN_BOT_TOKEN=7649988627:AAEvqPrs2PNU3clI5jURo2eFeAuQ_aT0fzk
TELEGRAM_ADMIN_CHAT_ID=474127500

# Bot Kurir
TELEGRAM_KURIR_BOT_TOKEN=8250194033:AAFqgndyiKLeT7NFA2AILBtZE2xSar7gkcg
```

### 2. Setup Database

Jalankan SQL schema di Supabase:

```bash
# Copy file supabase-telegram-schema.sql ke SQL Editor Supabase
# Lalu jalankan
```

### 3. Set Webhook

Setelah deploy ke Vercel, set webhook untuk kedua bot:

```bash
# Bot Admin
curl "https://api.telegram.org/bot7649988627:AAEvqPrs2PNU3clI5jURo2eFeAuQ_aT0fzk/setWebhook?url=https://YOUR-DOMAIN.vercel.app/api/telegram/admin/webhook"

# Bot Kurir
curl "https://api.telegram.org/bot8250194033:AAFqgndyiKLeT7NFA2AILBtZE2xSar7gkcg/setWebhook?url=https://YOUR-DOMAIN.vercel.app/api/telegram/kurir/webhook"
```

## 📁 Struktur File

```
lib/telegram/
├── index.ts          # Export all modules
├── utils.ts          # API calls, formatters, constants
├── keyboards.ts      # Inline keyboard builders
└── messages.ts       # Message templates

app/api/
├── telegram/
│   ├── admin/webhook/route.ts   # Admin bot handler
│   └── kurir/webhook/route.ts   # Kurir bot handler
├── orders/route.ts              # Orders CRUD
└── kurir/route.ts               # Kurir CRUD

supabase-telegram-schema.sql     # Database schema
```

## 🔵 Bot Admin

### Perintah Tersedia

| Perintah | Deskripsi |
|----------|-----------|
| `/start` | Menu utama + statistik |
| `/orders` | Lihat pesanan baru |
| `/report` | Laporan harian |
| `/cod` | Laporan setoran COD |
| `/kurir` | Kelola kurir |
| `/help` | Bantuan |

### Fitur

- ✅ Notifikasi order baru real-time
- ✅ Assign kurir dengan one-click
- ✅ Laporan harian & COD
- ✅ Kelola kurir & mitra
- ✅ Inline keyboard navigation

### Contoh Notifikasi Order

```
📦 ORDER BARU MASUK!
━━━━━━━━━━━━━━━━━━━━

🆔 Order: ORD-260114-001
📍 Mitra: Warung Madura Pak Joko
👤 Customer: Ahmad
📱 WA: 081234567890

🛒 Detail Pesanan:
  1. Indomie Goreng x3 = Rp 9.000
  2. Telur Ayam 1kg = Rp 25.000

💰 Total: Rp 42.000
🚚 Ongkir: Rp 8.000
💵 COD: Rp 50.000

[🚚 Assign Kurir] [❌ Tolak]
```

## 🟢 Bot Kurir

### Perintah Tersedia

| Perintah | Deskripsi |
|----------|-----------|
| `/start` | Menu utama |
| `/tugas` | Lihat tugas aktif |
| `/dompet` | Saldo & COD pending |
| `/online` | Set status online |
| `/offline` | Set status offline |
| `/history` | Riwayat pengiriman |
| `/help` | Panduan |

### Fitur

- ✅ Terima/tolak tugas
- ✅ Update status pengiriman step-by-step
- ✅ Upload bukti foto
- ✅ Dompet & tracking COD
- ✅ Navigasi ke lokasi pickup

### Alur Status Order

```
MENUNGGU → PICKUP_OTW → BARANG_DIAMBIL → DIKIRIM → SELESAI
                                                 ↘ GAGAL
```

### Contoh Notifikasi Tugas

```
🚚 TUGAS BARU UNTUK KAMU!
━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order: ORD-260114-001
🏪 Pickup: Warung Madura Pak Joko
   📍 Jl. Pasar Lama No. 5

📦 Dropoff: Ahmad
   📍 Jl. Raya Sumobito No. 15
   📱 081234567890

💰 Collect COD: Rp 50.000
⏰ Target: 45 menit

[✅ Terima Tugas] [❌ Tolak]
```

## 📊 API Endpoints

### Orders API

```typescript
// Create order (POST /api/orders)
{
  mitraName: "Warung Madura",
  mitraType: "retail",
  pickupAddress: "Jl. Pasar Lama No. 5",
  customerName: "Ahmad",
  customerPhone: "081234567890",
  customerAddress: "Jl. Raya Sumobito No. 15",
  items: [{ name: "Indomie", qty: 3, price: 3000 }],
  subtotal: 9000,
  deliveryFee: 8000,
  total: 17000,
  isCOD: true,
  codAmount: 17000
}

// Response
{
  success: true,
  order: { id: "uuid", orderNumber: "ORD-260114-001" }
}
```

### Kurir API

```typescript
// Register kurir (POST /api/kurir)
{
  telegramId: 123456789,
  name: "Budi Santoso",
  phone: "081111111111"
}

// Get all kurir (GET /api/kurir)
// Get online only (GET /api/kurir?online=true)
```

## 🗄️ Database Schema

### Tables

| Table | Deskripsi |
|-------|-----------|
| `mitra` | Data mitra/toko |
| `kurir` | Data kurir |
| `orders` | Data pesanan |
| `cod_setoran` | Riwayat setoran COD |
| `notifications` | Log notifikasi |

### Order Status

| Status | Emoji | Deskripsi |
|--------|-------|-----------|
| MENUNGGU | ⏳ | Menunggu kurir |
| PICKUP_OTW | 🚚 | Kurir OTW ke pickup |
| BARANG_DIAMBIL | 📦 | Barang sudah diambil |
| DIKIRIM | 🛵 | Dalam pengiriman |
| SELESAI | ✅ | Selesai |
| GAGAL | ❌ | Gagal |
| BATAL | 🚫 | Dibatalkan |

## 🔧 Development

### Test Webhook Locally

```bash
# Install ngrok
npm install -g ngrok

# Start Next.js
npm run dev

# Tunnel ke port 3000
ngrok http 3000

# Set webhook ke ngrok URL
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://YOUR-NGROK.ngrok.io/api/telegram/admin/webhook"
```

### Debug

```bash
# Check webhook info
curl "https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo"

# Get updates (polling mode)
curl "https://api.telegram.org/botYOUR_TOKEN/getUpdates"
```

## 🚀 Deployment

### Vercel

1. Push ke GitHub
2. Connect repo ke Vercel
3. Set environment variables di Vercel
4. Deploy
5. Set webhook ke production URL

### Webhook Setup

Setelah deploy, jalankan:

```bash
# Set webhook Admin Bot
curl "https://api.telegram.org/bot7649988627:AAEvqPrs2PNU3clI5jURo2eFeAuQ_aT0fzk/setWebhook?url=https://rayokurir.vercel.app/api/telegram/admin/webhook"

# Set webhook Kurir Bot
curl "https://api.telegram.org/bot8250194033:AAFqgndyiKLeT7NFA2AILBtZE2xSar7gkcg/setWebhook?url=https://rayokurir.vercel.app/api/telegram/kurir/webhook"
```

## 📝 Catatan

- Bot Admin hanya merespons chat dari `TELEGRAM_ADMIN_CHAT_ID`
- Kurir harus didaftarkan dulu sebelum bisa menggunakan bot
- Foto bukti disimpan sebagai `file_id` Telegram (perlu setup storage untuk produksi)
- Realtime notification menggunakan Supabase Realtime (opsional)

## 🤝 Support

Hubungi developer jika ada pertanyaan:
- WhatsApp: wa.me/6281234567890

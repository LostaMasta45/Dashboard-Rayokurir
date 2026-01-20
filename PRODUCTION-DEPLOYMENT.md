# Production Deployment Guide - Kurir Workflow Upgrade

## 1. Environment Variables

Tambahkan environment variables berikut di **Vercel Dashboard**:

```env
# Bot Security - Generate random string 32+ characters
BOT_SHARED_SECRET=your-super-secret-shared-key-minimum-32-chars

# Existing Telegram Bot Tokens (pastikan sudah ada)
TELEGRAM_KURIR_BOT_TOKEN=your-kurir-bot-token
TELEGRAM_ADMIN_BOT_TOKEN=your-admin-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id

# Supabase (pastikan sudah ada)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Cara Generate BOT_SHARED_SECRET:
```bash
# Di terminal/PowerShell:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. Database Migration

1. Buka **Supabase Dashboard** → SQL Editor
2. Copy isi file `supabase-migration-kurir-upgrade.sql`
3. Jalankan query
4. Verifikasi kolom baru muncul di tabel `couriers` dan `orders`

---

## 3. Webhook Setup

### A. Set Webhook untuk Kurir Bot

```bash
# Ganti YOUR_DOMAIN dengan domain Vercel Anda
curl -X POST "https://api.telegram.org/bot${TELEGRAM_KURIR_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_DOMAIN.vercel.app/api/telegram/kurir/webhook"}'
```

### B. Verifikasi Webhook
```bash
curl "https://api.telegram.org/bot${TELEGRAM_KURIR_BOT_TOKEN}/getWebhookInfo"
```

Pastikan response menunjukkan:
- `url` = URL webhook yang benar
- `pending_update_count` = 0 (atau rendah)
- `last_error_message` = tidak ada error

---

## 4. Testing Manual

### A. Test Pairing Kurir

1. Buka Admin Dashboard → Kelola Kurir
2. Klik "Generate OTP" untuk kurir yang ingin di-pair
3. Kurir buka bot Telegram, ketik `/start`
4. Masukkan kode OTP yang diberikan
5. Verifikasi pairing berhasil

### B. Test Order Flow

1. **Admin**: Buat order baru via Quick Add Order
2. **Admin**: Assign ke kurir yang sudah ter-pair
3. **Kurir Bot**: Terima notifikasi Job Card
4. **Kurir Bot**: Klik "Terima"
5. **Kurir Bot**: Update status berurutan:
   - OTW Jemput → Sudah Jemput → OTW Antar → Terkirim
6. **Kurir Bot**: Upload foto POD
7. **Admin Bot**: Verifikasi notifikasi diterima di setiap step

### C. Test Reject Order

1. Admin assign order ke kurir
2. Kurir klik "Tolak" → pilih alasan
3. Verifikasi order kembali ke status NEW di admin

### D. Test Issue Reporting

1. Di tengah order, kurir klik "Laporkan Kendala"
2. Pilih jenis kendala
3. Verifikasi admin menerima notifikasi

---

## 5. Checklist Production

- [ ] BOT_SHARED_SECRET sudah ditambahkan di Vercel
- [ ] Migration SQL sudah dijalankan di Supabase
- [ ] Webhook sudah di-set untuk Kurir Bot
- [ ] Min 1 kurir sudah di-pair ke Telegram
- [ ] Test create order → assign → accept berhasil
- [ ] Test status update berurutan sampai DELIVERED
- [ ] Test upload POD foto berhasil
- [ ] Test reject order dengan alasan berhasil
- [ ] Test issue reporting berhasil
- [ ] Admin menerima semua notifikasi

---

## Troubleshooting

### Bot tidak merespons
1. Cek webhook dengan `getWebhookInfo`
2. Cek Vercel logs untuk error
3. Pastikan `BOT_SHARED_SECRET` sama di Vercel dan kode

### Order tidak bisa di-accept
1. Pastikan kurir sudah ter-pair (cek `telegram_user_id` di DB)
2. Pastikan order status = OFFERED
3. Pastikan `kurirId` match dengan kurir yang sudah pair

### POD tidak terupload
1. Pastikan user state ter-set saat klik tombol POD
2. Cek ukuran foto (Telegram limit 20MB)
3. Lihat Vercel logs untuk error storage

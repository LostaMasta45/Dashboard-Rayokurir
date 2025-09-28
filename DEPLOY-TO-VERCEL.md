# Deploy Next.js + Supabase ke Vercel

Berikut langkah-langkah step by step untuk deploy project Next.js (dengan Supabase) ke Vercel:

## 1. Persiapan Project
- Pastikan semua kode sudah di-push ke repository GitHub/GitLab/Bitbucket.
- Pastikan environment variable Supabase sudah ada di `.env.local` (lihat langkah 4).

## 2. Buat Akun Vercel
- Kunjungi https://vercel.com dan daftar/login dengan akun GitHub/GitLab/Bitbucket Anda.

## 3. Import Project ke Vercel
- Klik **Add New Project** di dashboard Vercel.
- Pilih repository project Next.js Anda.
- Klik **Import**.

## 4. Setting Environment Variables
- Di halaman setup project Vercel, klik tab **Environment Variables**.
- Tambahkan variable berikut (samakan dengan `.env.local` di lokal):
  - `NEXT_PUBLIC_SUPABASE_URL` → URL Supabase Anda
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Anon key Supabase Anda
- Klik **Save**.

## 5. Build & Deploy
- Klik **Deploy**.
- Tunggu proses build dan deploy selesai.
- Setelah selesai, klik link domain yang diberikan Vercel untuk melihat hasilnya.

## 6. (Opsional) Custom Domain
- Di dashboard Vercel, klik project Anda → **Settings** → **Domains**.
- Tambahkan custom domain jika ingin.

## 7. Update Data Supabase (Jika Perlu)
- Pastikan database Supabase sudah terisi data yang dibutuhkan (users, couriers, dsb).
- Jika perlu, jalankan seed data dari local atau Supabase SQL editor.

## 8. Troubleshooting
- Jika error env, cek tab **Environment Variables** di Vercel.
- Jika error Supabase, cek URL/key dan role policy di Supabase.
- Cek log build/deploy di dashboard Vercel untuk detail error.

---

**Catatan:**
- Jangan commit file `.env.local` ke repository publik.
- Untuk update kode, cukup push ke branch utama, Vercel akan auto-deploy.


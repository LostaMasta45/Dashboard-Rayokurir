# RayoKurir.id /mitra2 — Redesign Katalog Mitra (Gojek-like Native Mobile)
Version: 1.0  
Scope: **Redesign isi UI/UX** (tanpa kode), fokus **katalog mitra + order wajib via WA Admin**  
Target: Mobile-first, feel “native app” seperti Gojek (sticky header, chips, cards, bottom sheet)

---

## 0) Goal & Prinsip
### Goal utama
1) User cepat **menemukan mitra** (makanan/retail/jasa/apotek)
2) User masuk **detail mitra → pilih kebutuhan → checkout**
3) Checkout selalu **mengarah ke WA ADMIN** (bukan WA mitra)

### Prinsip desain
- Mobile-first, tap-friendly (min 44px tap targets)
- Layout “native”: sticky header, chips, carousel, cards, bottom sheet
- Ringan: gambar lazy-load, skeleton loading, no heavy animation
- Multitype: **bukan hanya makanan** (retail & jasa harus natural)

---

## 1) Struktur Informasi (IA)
### Halaman
- `/mitra2` = Homepage katalog mitra (discovery)
- `/mitra/:slug` = Detail mitra (menu/belanja/jasa) + cart + checkout WA Admin
- (Opsional) `/mitra/kategori/:kategori` = listing terfilter (atau filter di halaman yang sama)

---

## 2) Tipe Mitra (Wajib)
Setiap mitra wajib punya `type` untuk menentukan tampilan detail.

### Types
1) `food` — Food & Beverage (menu item + cart)
2) `retail` — Warung madura/kelontong/indomaret (quick picks + daftar belanja)
3) `pharmacy` — Apotek (OTC quick picks + foto/teks kebutuhan)
4) `service` — Laundry/fotokopi/ATK (paket layanan + input kebutuhan)
5) `special` — Frozen/catering/kue harian (mirip food tapi bisa pre-order)

> Catatan: Homepage tetap satu, hanya filter & badge type yang membedakan.

---

## 3) Homepage /mitra2 (Katalog Mitra)
### 3.1 Sticky Header (Top App Bar)
Komponen:
- Search bar placeholder: **"Cari warung, menu, atau toko…"**
- Subheader: label **LOKASI PENGANTARAN** + dropdown **"Kec. Sumobito"**
- Icon kanan:
  - (opsional) theme toggle
  - (opsional) notifikasi/promo

Behavior:
- Sticky saat scroll
- Search dapat menemukan: **nama mitra, kategori, item populer**

---

### 3.2 Mini Status Bar (Voucher & Poin)
Card horizontal 1 baris:
- Voucher: "2 tersedia"
- Rayo Poin: "2.400 XP"
- CTA kecil: "Lihat Semua"

Tujuan:
- Tambah “app feel” + trust + retention.

---

### 3.3 Quick Filter Chips (Horizontal Scroll)
Chips (multi-select boleh):
- **Buka Sekarang**
- **Promo**
- **Terlaris**
- **Favorit**
- **Rating 4.5+**
- **Harga Hemat**
- **Gratis Titip Beli**
- **Fast < 20 menit**
- **Mitra Baru**

Behavior:
- Menyaring semua section list mitra (tanpa pindah halaman)
- Ada tombol “Reset” (ikon X kecil)

---

### 3.4 Kategori Mitra (Bukan Layanan)
Tampilkan kategori “jenis mitra” (icon bulat mini + label):
- 🍜 Makanan
- ☕ Kopi
- 🛒 Retail / Sembako
- 🧊 Frozen
- 💊 Apotek
- 🧺 Laundry
- 📄 ATK / Fotokopi
- 🎂 Kue & Snack
- ⋯ Lainnya

Behavior:
- Tap kategori → filter list mitra
- Kategori bisa scroll horizontal (lebih ringan) atau grid 2 baris (lebih jelas)

---

### 3.5 Promo Banner Carousel (1–3 item)
Banner tidak terlalu tinggi, ringan:
- "Diskon Kilat 50% Pengguna Baru" (CTA: **Klaim Sekarang**)
- "Gratis Titip Beli (S&K berlaku)" (CTA: **Pelajari**)
- "Mitra Baru Minggu Ini" (CTA: **Lihat**)

---

### 3.6 Trending Row “Lagi Rame di Sumobito 🔥”
Story-style bubbles (scroll):
- "Gacoan"
- "Kopi"
- "Martabak"
- "Ayam"
- "Sembako"
- "Jajanan"
- "Apotek"

Behavior:
- Tap bubble → open listing terfilter (atau scroll ke section relevan)

---

### 3.7 Section Wajib (Agar Retail/Jasa Kebaca)
Susunan section rekomendasi:

1) **Belanja Cepat 🛒** (khusus `retail`)
   - Warung Madura / Kelontong / Indomaret
   - CTA: "Isi daftar belanja"

2) **Paling Deket Rumah 🏠**
   - Semua type, urut jarak (opsional), atau “desa sama”

3) **Buka Sekarang ✅**
   - Mitra aktif

4) **Favorit Sekecamatan ❤️**
   - Grid 2 kolom card

5) **Promo Hari Ini 🎁**
   - Badge promo jelas

6) **Kebutuhan Mendadak ⚡**
   - Apotek, Gas/Galon (jika ada), Retail buka malam

7) **Mitra Baru Gabung ✨**

> Tips: Minimal tampilkan 4–6 section di awal agar tidak terlalu panjang.

---

## 4) Komponen Card Mitra (Konsisten di Homepage)
Setiap card mitra wajib punya:

### Elemen
- Cover image (16:9 atau 4:3) + rounded
- Nama mitra (bold)
- Badge type (pill):
  - FOOD / RETAIL / APOTEK / JASA / SPECIAL
- Kategori kecil: "Noodle", "Coffee", "Sembako", dll
- Rating + count (opsional)
- Estimasi antar: "± 20 min" (opsional)
- Badge label:
  - "Promo", "Terlaris", "Favorit", "Baru"
- Status:
  - **BUKA** (hijau) / **TUTUP** (overlay)
- Icon heart/favorite (opsional)

### Behavior
- Tap card → `/mitra/:slug`
- Jika TUTUP: tetap bisa buka detail, tampilkan "TUTUP — tetap bisa lihat menu & preorder"

---

## 5) Detail Mitra /mitra/:slug (Multitype Layout)
### Shared (untuk semua type)
#### 5.1 Header Mitra
- Cover besar + overlay gradient
- Nama mitra + badge type
- Status buka/tutup + jam buka
- Rating (opsional)
- Info lokasi singkat (desa)
- Tombol kecil: **Chat Admin**
- Tombol besar sticky: **Order via WA Admin**

#### 5.2 Tabs
- **Utama** (berubah sesuai type): Menu / Belanja / Layanan
- Info
- Ulasan (opsional)

#### 5.3 CTA Sticky (Wajib)
Selalu tampil di bawah:
- Jika cart kosong:
  - "Order via WA Admin" (buka mode input sesuai type)
- Jika cart ada:
  - "2 item | Rp 35.000 | Lihat Keranjang"

---

## 6) Detail — Type Specific
## 6.1 Type: FOOD (`food`, `special`)
Layout seperti GoFood:
- Search within menu: "Cari di menu…"
- Chips kategori menu: "Makanan", "Minuman", "Snack", dst
- Menu item card:
  - Foto kecil (opsional)
  - Nama item
  - Deskripsi singkat
  - Harga
  - Tombol + tambah qty
- Add note per item (opsional): pedas, tanpa bawang, dll

Cart bottom sheet:
- List item + qty
- Catatan pesanan umum
- Opsi:
  - Titip Beli (Gratis) (default jika memenuhi S&K)
  - Express (+Rp…)
- Form alamat:
  - Desa + patokan + nomor WA pemesan
- Tombol final:
  - **Kirim Pesanan ke Admin (WA)**

---

## 6.2 Type: RETAIL (`retail`) — Model Terbaik (Quick Picks + Daftar Belanja)
Retail tidak cocok SKU panjang. Pakai 2 mode:

### Mode A: Quick Picks (paling sering dibeli)
Tampilkan grid/list item populer dengan tombol +:
- Indomie / Mie instan
- Telur
- Beras (1kg / 5kg)
- Gula
- Minyak goreng
- Kopi sachet
- Susu
- Air galon (opsional)
- Gas LPG (opsional)
- Popok bayi
- Sabun / shampoo
- Detergen
- Snack

Kategori chips:
- Sembako
- Minuman
- Snack
- Kebersihan
- Bayi
- Gas & Galon (opsional)
- Lainnya

### Mode B: Tulis Daftar Belanja (fallback wajib)
Textarea + input:
- Daftar belanja (free text)
- Budget maks (opsional)
- Preferensi substitusi:
  - "Boleh diganti merk setara"
  - "Jangan diganti, kalau habis skip"
- Catatan penting: "Rokok/produk tertentu mengikuti kebijakan mitra" (opsional)

Cart retail:
- Gabungkan Quick Picks + daftar belanja
- Checkout WA admin

---

## 6.3 Type: PHARMACY (`pharmacy`)
Tambahkan disclaimer:
- "Pembelian obat tertentu mengikuti aturan apotek. Admin akan konfirmasi."

UI:
- Quick picks OTC (opsional): paracetamol, vitamin, minyak kayu putih, plester
- Input kebutuhan:
  - "Tulis kebutuhan obat/produk"
  - Upload foto resep / foto obat (opsional fitur)
- Catatan alergi/aturan (opsional)

Checkout tetap WA admin.

---

## 6.4 Type: SERVICE (`service`)
UI berbasis “paket layanan”, bukan item menu.

Contoh Laundry:
- Pilih layanan:
  - Kiloan, Satuan, Express
- Input:
  - Estimasi berat (kg)
  - Jadwal pickup (opsional)
- Catatan: parfum, pemisahan warna, dll

Contoh Fotokopi/ATK:
- Pilih:
  - Print / Fotokopi / Jilid
- Input:
  - Jumlah lembar
  - Warna / BW
  - File (opsional upload / link)
- Catatan

Checkout WA admin.

---

## 7) Checkout → WA Admin (Wajib)
### 7.1 WA Message Format (FOOD)
[ORDER RAYO - MITRA]
Mitra: {nama_mitra}
Type: FOOD
Nama: {nama}
No WA: {no_wa}
Alamat: {desa}, {patokan}
Catatan: {catatan}

Pesanan:
1) {item} x{qty} = Rp...
2) ...

Opsi:
- Titip Beli (Gratis): YA/TIDAK
- Express: YA/TIDAK

Total Estimasi: Rp...
Mohon konfirmasi total akhir + ongkir.

---

### 7.2 WA Message Format (RETAIL)
[ORDER RAYO - RETAIL]
Mitra: {nama_mitra}
Nama: {nama}
No WA: {no_wa}
Alamat: {desa}, {patokan}

Quick Picks:
- {item} x{qty}
- ...

Daftar Belanja:
{free_text_list}

Preferensi:
- Boleh ganti merk setara: YA/TIDAK
- Jika tidak ada: SKIP / KONFIRMASI
Budget Maks: Rp {budget} (opsional)

Opsi:
- Titip Beli (Gratis): YA/TIDAK
- Express: YA/TIDAK

Mohon konfirmasi ketersediaan + total akhir.

---

### 7.3 WA Message Format (SERVICE)
[ORDER RAYO - JASA]
Mitra: {nama_mitra}
Jenis: {laundry/fotokopi/...}
Nama: {nama}
No WA: {no_wa}
Alamat: {desa}, {patokan}

Detail Layanan:
- Paket: {paket}
- Estimasi: {kg/lembar/dll}
- Jadwal pickup: {opsional}
Catatan: {catatan}

Opsi:
- Express: YA/TIDAK

Mohon konfirmasi total + jadwal.

---

## 8) Copywriting (Microcopy) — Lokal & Jelas
Homepage:
- "Belanja Cepat 🛒"
- "Paling Deket Rumah 🏠"
- "Lagi Rame di Sumobito 🔥"
- "Favorit Sekecamatan ❤️"
- "Kebutuhan Mendadak ⚡"
- "TUTUP — tetap bisa lihat & preorder"

Buttons:
- "Order via WA Admin"
- "Kirim Pesanan ke Admin"
- "Tulis Daftar Belanja"
- "Lihat Keranjang"
- "Tambah"

Info trust:
- "Order lewat Admin biar cepat & rapi."
- "Admin akan konfirmasi stok & total sebelum diproses."

---

## 9) Komponen UI yang Harus Ada (Checklist)
- Sticky App Bar + Search
- Chips filter horizontal
- Category row (icon pills)
- Banner carousel (1–3)
- Story/trending row
- Mitra card (list + grid)
- Detail header (cover + gradient)
- Tabs (Menu/Belanja/Layanan + Info)
- Floating cart bar
- Bottom sheet cart/checkout
- Skeleton loading & empty state
- Badge type & status overlay

---

## 10) Empty State & Error State
- Jika tidak ada mitra sesuai filter:
  - "Belum ada mitra di kategori ini. Coba kategori lain."
- Jika mitra tutup:
  - tampilkan label "Tutup" + "Preorder tetap bisa"
- Jika item belum tersedia:
  - admin konfirmasi via WA (tulis microcopy: "ketersediaan akan dikonfirmasi admin")

---

## 11) Dummy Content (Untuk Testing UI)
Buat minimal 6 mitra untuk demo:
- 2 FOOD (mie/ayam)
- 2 RETAIL (warung madura/kelontong)
- 1 PHARMACY
- 1 SERVICE (laundry)

Masing-masing:
- cover image
- jam buka
- 8–12 menu (food) atau 15 quick picks (retail) + daftar belanja
- badge promo/favorit

---

## 12) Acceptance Criteria (Berhasil kalau)
- Homepage terasa seperti “app”, bukan landing page biasa
- User bisa:
  - cari mitra/menu
  - filter kategori & chips
  - buka detail mitra multi-type
  - tambah item / isi daftar belanja / pilih paket jasa
  - checkout → WA Admin dengan format rapi
- Tidak ada jalur checkout ke WA mitra (selalu admin)
- Retail flow nyaman tanpa SKU ribet

---

## 13) Catatan Penting (Kebijakan Rayo)
- Gunakan istilah **"Titip Beli (Gratis)"** (hindari kata COD)
- Batasi ekspektasi: "Admin akan konfirmasi stok & total"
- Jika ada item sensitif (misal rokok): tampilkan sebagai opsional & mengikuti kebijakan mitra

# SPEC Revisi Perhitungan Ongkir — RayoKurir (/hitungongkir)
Tujuan dokumen ini: memberi instruksi jelas untuk Agent AI agar **merevisi LOGIKA perhitungan ongkir** di halaman `rayokurir.id/hitungongkir` dari versi lama ke **FINAL v1** (Sumobito).  
⚠️ Fokus: **hanya revisi perhitungan**, bukan redesign UI.

---

## 0) Output yang harus dihasilkan Agent
1) Logika ongkir baru sesuai FINAL v1 (D1 + D2 + add-ons).
2) UI yang sudah ada tetap jalan, tapi nilai hasil hitung & rincian berubah mengikuti aturan baru.
3) Rincian perjalanan (breakdown) menampilkan:
   - D1 (Penjemputan) + jarak D1
   - D2 (Pengantaran) + jarak D2
   - Add-ons yang aktif + nilainya
   - Total akhir
4) Edge case aman (jarak 0, jarak kosong, input belum lengkap, dsb).

---

## 1) Definisi & Rumus FINAL v1 (WAJIB DIIMPLEMENTASI)
### Rumus utama
**Ongkir = MAX(3000, D1 + D2) + AddOnsTotal**

- D1: biaya penjemputan (basecamp → lokasi jemput)
- D2: biaya pengantaran (lokasi jemput → tujuan)
- AddOnsTotal: total biaya add-ons yang dipilih (express, dll)

### D1 — Biaya Penjemputan (CAP)
Berdasarkan jarak `d1_km`:
- 0 – 1 km: Rp1.000
- >1 – 3 km: Rp2.000
- >3 – 5 km: Rp3.000
- >5 km: Rp4.000 (CAP / plafon)

### D2 — Biaya Pengantaran (Tier)
Berdasarkan jarak `d2_km`:
- 0 – 0,7 km  : Rp3.000
- >0,7 – 1,5  : Rp4.000
- >1,5 – 2,5  : Rp5.000
- >2,5 – 3,5  : Rp6.000
- >3,5 – 5,0  : Rp8.000
- >5,0 – 6,0  : Rp10.000
- >6,0 – 7,0  : Rp13.000
- >7,0 – 8,0  : Rp15.000
- >8,0 – 9,0  : Rp17.000
- >9,0 – 10,0 : Rp19.000
- >10,0 – 11,0: Rp21.000
- >11,0 – 12,0: Rp23.000
- >12,0 km: tambah **+Rp2.000 per +1 km** (dibulatkan ke atas per 1 km)

> Catatan pembulatan: untuk bagian >12km, hitung tambahan:
`extra_km = ceil(d2_km - 12)` lalu `extra_fee = extra_km * 2000`.

---

## 2) Add-ons (yang mempengaruhi total di kalkulator)
Agent hanya wajib implement add-ons yang memang ada di UI / kalkulator saat ini.
Kalau UI baru belum punya semuanya, tetap siapkan struktur perhitungan agar gampang ditambah.

### 2.1 Express Priority
- Jika toggle `express=true` → tambah **+Rp2.000**
- Copy aturan (hanya teks/label): “Prioritas jika driver tersedia (tidak membatalkan order yang sudah jalan).”
- Implementasi: `addons.express = 2000` bila aktif.

### 2.2 Multi-stop (opsional jika UI sudah ada / direncanakan)
Jika halaman sudah punya fitur “tambah titik” (multi-destination), implement aturan:
- D1 hanya dihitung **sekali** (basecamp → titik jemput pertama).
- D2 dihitung **per segmen**:
  - jemput → tujuan1
  - tujuan1 → tujuan2
  - dst…
- Total D2 = jumlah D2 tiap segmen menggunakan tabel tier D2 yang sama.
Jika UI belum ada multi-stop, abaikan implementasi, tapi buat fungsi yang siap dipakai.

### 2.3 Waiting fee, Titip Beli, Barang Besar/Berat, PP/Return
- Untuk kalkulator publik: **tidak wajib dihitung otomatis** kecuali UI memang punya inputnya.
- Kalau UI punya checkbox/field terkait, implement sesuai aturan FINAL v1:
  - Waiting fee: gratis 10 menit, lalu +Rp1.000/10 menit
  - Titip beli: gratis jika <=100k, 1 toko, antre <=10 menit; jika >: DP + waiting fee + jasa +2k
  - Bulky: +2k, Heavy/repot: +5k
  - PP/Return: +60% ongkir dasar (min +5k)
Jika UI belum ada, tampilkan sebagai info/tooltip (opsional) tapi tidak menambah total.

---

## 3) Data jarak yang digunakan (tetap sesuai sistem halaman sekarang)
Halaman saat ini menampilkan:
- jarak D1 (penjemputan) dalam km
- jarak D2 (pengantaran) dalam km
- estimasi waktu
- rute tercepat

Instruksi:
- Jangan ubah cara mengambil jarak (API / perhitungan jarak) kecuali memang bug.
- Yang direvisi hanya: **mapping jarak → biaya** & rumus total.

Variabel yang diharapkan ada:
- `d1_km` (float, km)
- `d2_km` (float, km)

Jika saat ini hanya ada `total_km`, agent harus memisahkan sesuai struktur halaman:
- D1: basecamp→pickup
- D2: pickup→dropoff

---

## 4) Implementasi fungsi (wajib dibuat / diperbarui)
Buat atau update minimal 3 fungsi pure (tanpa akses UI):
1) `calcD1Fee(d1_km) -> number`
2) `calcD2Fee(d2_km) -> number`
3) `calcTotal({d1_km, d2_km, express, ...}) -> {subtotal, addons, total, breakdown}`

### 4.1 Pseudocode `calcD1Fee`
- if d1_km <= 0: return 0 (atau 1000? **gunakan 0** agar MAX(3000, ...) tetap bekerja)
- if d1_km <= 1: 1000
- else if <= 3: 2000
- else if <= 5: 3000
- else: 4000

### 4.2 Pseudocode `calcD2Fee`
- if d2_km <= 0: return 0 (atau 3000? **gunakan 0** bila belum ada tujuan; tapi jika tujuan ada dan jarak sangat dekat, d2_km biasanya >0)
- else map tier sesuai tabel
- if d2_km > 12: base = 23000 + ceil(d2_km-12)*2000

> Catatan: Untuk jarak sangat kecil (misal 0.1km), tetap masuk tier 0–0.7 = 3000.

### 4.3 Total
- `subtotal = D1 + D2`
- `base = max(3000, subtotal)`
- `addonsTotal = (express?2000:0) + ...`
- `total = base + addonsTotal`

Return breakdown minimal:
- `{label:"Penjemputan (D1)", km:d1_km, fee:D1}`
- `{label:"Pengantaran (D2)", km:d2_km, fee:D2}`
- `{label:"Express Priority", fee:2000}` jika aktif
- `{label:"Total", fee:total}`

---

## 5) Pembulatan & tampilan angka
- Kilometer tampilkan 1 desimal (contoh 7.5 km).
- Rupiah tampilkan format: `Rp 14.000` (ribuan pakai titik).
- Semua perhitungan fee dalam integer rupiah.

---

## 6) Validasi & kasus uji (agent wajib memastikan hasil)
Gunakan test manual berikut:

### Case A (seperti contoh)
- d1=0.5km => D1=1000
- d2=7.0km => D2=13000
- subtotal=14000 => base=14000
- express off => total=14000

### Case B (dekat)
- d1=0.4 => 1000
- d2=0.6 => 3000
- subtotal=4000 => base=4000 (>=3000)
- total=4000

### Case C (jarak jauh >12km)
- d1=2.0 => 2000
- d2=13.2 => baseD2=23000 + ceil(1.2)*2000 = 27000
- subtotal=29000
- express on => total=31000

### Case D (input belum lengkap)
- d1 atau d2 null/NaN → total tidak dihitung (UI tampil “lengkapi data” / disabled tombol)
- Pastikan tidak crash.

---

## 7) Copy/Label yang harus disesuaikan di halaman (jika ada)
- Ganti label “Ongkir rata / Rp7.000 semua desa” yang lama (jika masih ada) menjadi:
  - “Ongkir mulai Rp3.000”
- Label express: “Express Priority (+Rp2.000)”
- Tambah footnote kecil: “Prioritas jika driver tersedia.”

---

## 8) Catatan penting
- Jangan mengubah struktur routing halaman atau SEO.
- Jangan menghapus fitur lama selain mapping harga.
- Pastikan semua harga yang muncul di UI konsisten dengan breakdown.

--- 

## 9) Deliverables
- PR/commit yang berisi:
  - update fungsi perhitungan ongkir
  - update breakdown/rincian biaya
  - update label/copy yang terkait ongkir mulai Rp3.000 dan express
- Pastikan build tidak error.

END.

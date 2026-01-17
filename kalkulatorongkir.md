````md
# Rayo Kurir — Rework Kalkulator Ongkir (Landingpage)
Versi: v1.0 (Spec + rekomendasi library + struktur implementasi)

> Target utama: kalkulator terasa “jelas”, cepat, dan hasilnya dipercaya (ada breakdown), lalu CTA WhatsApp muncul di waktu yang tepat.

---

## 1) Masalah pada tampilan saat ini (dari screenshot)
1. Tombol **“Cek Estimasi Ongkir via WhatsApp”** muncul sebelum user punya hasil → user bingung harus ngapain.
2. Dropdown terlihat “abu-abu” seperti disabled → kontras rendah & kurang meyakinkan.
3. Tombol di tengah (icon panah) terlihat seperti “scroll down”, bukan “swap lokasi”.
4. Output belum “berisi” (hanya empty state) → trust kurang karena user tidak lihat breakdown.
5. Express belum jelas sebagai toggle + aturan prioritasnya.

---

## 2) Perubahan UX/UI yang wajib
### A. Urutan flow (biar masuk akal)
1) User pilih **Jemput**  
2) User pilih **Antar**  
3) Sistem hitung jarak + ongkir (loading kecil: “Menghitung rute…”)  
4) Tampilkan **Hasil Estimasi (kartu output)** + breakdown  
5) Baru munculkan CTA **“Pesan via WhatsApp”** (Primary)

### B. CTA WhatsApp
- Tombol “Cek via WhatsApp” di header ubah jadi **secondary** atau pindah ke bawah.
- CTA utama ada di output:
  - **“Pesan via WhatsApp”** (prefilled message: jemput, antar, estimasi, express, catatan).
- Jika belum lengkap (jemput/antar kosong) → disabled + helper text “Pilih jemput & antar dulu.”

### C. Dropdown harus searchable (wajib)
Karena daftar desa banyak, dropdown biasa bikin user capek scroll.

**Wajib pakai Combobox searchable** (Command + Popover) → user tinggal ketik “kendal…”, “sumob…” dll.

### D. Tombol Swap jelas
Ganti icon jadi ⇅ + label kecil “Tukar” (tooltip).

### E. Output hasil harus “percaya”
Tampilkan:
- **Estimasi Total: Rp X.XXX** (besar)
- Breakdown:
  - Jemput (D1): Rp…
  - Antar (D2): Rp…
  - Express: +Rp2.000 (jika aktif)
  - Total: Rp…
- Info kecil:
  - Jarak rute: X km
  - Estimasi waktu: ±Y menit
- Accordion “Info tambahan”:
  - “Belanja besar / antre lama → admin konfirmasi DP &/atau waiting fee”

### F. Express jadi toggle + aturan singkat
- Toggle: **Express (prioritas)**  
- Catatan 1 baris: “Prioritas jika driver tersedia. Tidak membatalkan order yang sudah ditangani.”

---

## 3) Rekomendasi Stack & Library (ringan + gratis)
### Frontend (Next.js / React)
- **Next.js (App Router)**: SEO + cepat untuk landingpage
- **shadcn/ui + Radix UI**: komponen rapi (Popover, Command, Accordion, Switch)
- **TailwindCSS**: styling cepat & konsisten dengan brand teal
- **react-hook-form + zod**: validasi input (optional tapi bagus)
- **@tanstack/react-query**: caching request jarak (opsional tapi enak)
- **clsx / tailwind-merge**: className bersih

### Routing / hitung jarak “akurat”
**Paling cocok: OpenRouteService (ORS) Directions API**
- Gratis (ada limit harian & per menit)
- Jarak rute jalan (bukan garis lurus)
- Implementasi ideal: panggil ORS dari **server route** (API Next.js) supaya API key aman.

### Optional Map (kalau mau tampil peta)
- **Leaflet** (ringan) atau **MapLibre**
> Untuk landingpage, peta itu optional. Jangan dipasang kalau bikin berat.

---

## 4) Data Lokasi Desa (kunci biar konsisten)
Jangan geocoding nama desa realtime (rawan limit & lambat). Solusi terbaik:

### Buat file statis:
`/data/sumobito-locations.json`
Format:
```json
[
  { "id": "sumobito", "label": "Sumobito", "lat": -7.5, "lng": 112.2 },
  { "id": "kendalsari", "label": "Kendalsari", "lat": -7.5, "lng": 112.2 }
]
````

**Cara ambil koordinat akurat:**

* Ambil titik “pusat desa” (balai desa/landmark) dari Google Maps lalu simpan lat/lng.
* Nanti kalau mau lebih presisi → bisa upgrade jadi “pilih dusun / patokan”, tapi versi awal cukup desa.

### Basecamp (fix)

Simpan koordinat basecamp:
`BASECAMP_LAT`, `BASECAMP_LNG`

---

## 5) Logika Ongkir (sesuai model Rayo Kurir yang kamu finalkan)

Model:

* **D1 = biaya jemput (basecamp → lokasi jemput)** dengan **CAP max Rp4.000** (tier)
* **D2 = biaya antar (lokasi jemput → lokasi antar)** (tier)
* **Ongkir = MAX(3000, D1 + D2) + add-ons**
* Add-on:

  * **Express +Rp2.000** (prioritas jika driver tersedia)

### Tier D1 (jemput) — CAP max Rp4.000

* 0–1 km: Rp1.000
* > 1–3 km: Rp2.000
* > 3–5 km: Rp3.000
* > 5 km: Rp4.000 (cap)

### Tier D2 (antar)

> Kamu sudah punya start: **0–0.7 km = Rp3.000**.
> Saran: lanjutkan tier supaya natural & mudah dipahami (contoh berikut bisa kamu sesuaikan):

* 0–0.7 km: Rp3.000
* > 0.7–1.5 km: Rp4.000
* > 1.5–2.5 km: Rp5.000
* > 2.5–3.5 km: Rp6.000
* > 3.5–4.5 km: Rp7.000
* > 4.5 km: Rp8.000+ (atau lanjut tier per km)

> Kalau kamu sudah punya tabel final D2 versi kamu, tinggal masukin angka pastinya. Struktur kodenya sama.

---

## 6) Arsitektur Implementasi (Next.js App Router)

### Struktur file yang disarankan

```
/app
  /api
    /route-distance
      route.ts
  /page.tsx (landingpage)
  /components
    OngkirCalculator.tsx
    LocationCombobox.tsx
    PriceBreakdownCard.tsx
/lib
  ors.ts
  pricing.ts
  whatsapp.ts
/data
  sumobito-locations.json
```

---

## 7) API hitung jarak (amanin API key)

### Kenapa wajib via server route?

Kalau ORS key ditaruh di client:

* gampang dicuri (view-source)
* bisa disalahgunakan orang → jebol limit

### Endpoint:

`POST /api/route-distance`
Body:

```json
{
  "from": { "lat": -7.5, "lng": 112.2 },
  "to":   { "lat": -7.5, "lng": 112.2 }
}
```

Response:

```json
{
  "distance_m": 3120,
  "duration_s": 540
}
```

### Caching (biar hemat limit)

Minimal:

* Cache client dengan React Query (key: fromId-toId)
* Cache `localStorage` (mis. 7 hari)
  Opsional lebih serius:
* Cache di server (KV/Redis free tier kalau kamu mau)

---

## 8) State & Validasi (biar UX rapi)

### State wajib

* pickupLocation (id + lat/lng)
* dropoffLocation (id + lat/lng)
* isExpress (boolean)
* status: `idle | partial | loading | ready | error`
* result: { D1, D2, total, distance1, distance2, duration }

### Validasi

* pickup & dropoff wajib
* pickup != dropoff
* jika API gagal:

  * fallback: hitung jarak garis lurus (opsional) + tampilkan label “perkiraan”
  * atau tampilkan error: “Gagal hitung rute, coba lagi.”

---

## 9) UX Detail yang harus kamu implement

### A. Empty state

* Jika belum pilih apa-apa: “Pilih lokasi jemput & antar untuk melihat estimasi.”
* Jika baru pilih 1: “Pilih lokasi antar untuk lanjut.”
* Jika loading: loader kecil “Menghitung rute jalan…”

### B. Output card

* Judul: “Estimasi Ongkir”
* Total besar
* Breakdown
* Accordion Info tambahan (DP/waiting fee)
* CTA: “Pesan via WhatsApp”

### C. WhatsApp Prefilled Template

Contoh template (otomatis):

```
Halo Rayo Kurir, mau order 🙏
• Jemput: {pickupLabel}
• Antar: {dropoffLabel}
• Estimasi ongkir: Rp{total}
• Express: {YA/TIDAK}

Catatan barang/titip beli:
...
```

---

## 10) Checklist UI (sesuai brand Rayo Kurir)

* Font: **Poppins**
* Warna: teal utama (#14B8A6) + turunan
* Input tidak boleh terlalu pucat → naikkan kontras border + background
* Badge bawah: “Mulai Rp3.000 • Express +Rp2.000 • Kurir Lokal” (rapi 1 baris)
* Animasi micro:

  * swap button (rotate)
  * output muncul dengan fade/slide halus

---

## 11) Checklist Testing (wajib sebelum live)

1. Pilih jemput saja → belum ada CTA WA utama
2. Pilih jemput+antar → muncul hasil + breakdown
3. Swap → nilai berubah sesuai lokasi tertukar
4. Express on/off → total berubah + label jelas
5. Lokasi sama → validasi muncul
6. API error → pesan error / fallback tampil
7. Mobile view: combobox nyaman, output tidak kepotong
8. Lighthouse: jangan ada map berat kalau tidak perlu

---

## 12) “Nice-to-have” upgrade (kalau versi v1 sudah beres)

* Tambah field “Catatan barang” (textarea) → ikut masuk ke WA template
* Tambah opsi “Titip Beli” (toggle) + info syarat gratis (≤100k, 1 toko, antre ≤10 menit)
* Tambah estimasi waktu pickup (“±X menit kurir tiba”) jika kamu punya data driver (opsional)

---

## 13) Summary keputusan (biar agent AI paham)

* Gunakan **shadcn/ui** untuk UI (Combobox searchable, Switch, Accordion)
* Gunakan **OpenRouteService Directions** untuk jarak rute jalan (akurat)
* Panggil ORS via **Next.js API Route** (sembunyikan API key)
* Implement **breakdown** dan CTA WA setelah hasil tampil
* Implement pricing:

  * D1 tier + CAP 4k
  * D2 tier (0–0.7km = 3k, dst)
  * Total = MAX(3000, D1 + D2) + Express (2000)


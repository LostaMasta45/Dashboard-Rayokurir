# PRD — Google Maps untuk Pilih Lokasi dan Cari Tempat di Hitung Ongkir

**Status:** Usulan implementasi — menunggu persetujuan billing dan API key Google Maps Platform

**Tanggal:** 24 Juli 2026

**Pemilik:** Rayo Kurir

**Permukaan terdampak:** `/hitungongkir`, kalkulator landing page, pemilih lokasi mobile, Google Maps link dari WhatsApp, Vercel environment, serta halaman Kebijakan Privasi/Ketentuan Penggunaan.

## 1. Keputusan utama

Tujuan utama **bukan mengganti mesin rute**. Perhitungan jarak dan toggle rute yang sudah berjalan tetap memakai OpenRouteService (ORS):

- `kampung` → ORS `cycling-regular` sebagai estimasi jalur lokal.
- `car` → ORS `driving-car` sebagai pembanding jalur mobil.

Google Maps Platform hanya digunakan untuk pengalaman pemilihan lokasi:

1. **Google Map yang lebih familiar dan detail** untuk melihat pin/jalan/lokasi.
2. **Pencarian nama tempat** seperti warung, toko, gedung, sekolah, atau nama bangunan.
3. **Kesesuaian dengan tautan lokasi Google Maps dari WhatsApp**, selain tetap bisa memilih titik manual.

Konsekuensinya, Google **Routes API tidak diaktifkan**. Tidak ada biaya/risiko kuota rute motor Google dan tidak ada perubahan rumus ongkir atau rute ORS yang sudah bagus.

## 2. Masalah yang diselesaikan

Peta sekarang cukup untuk memilih titik, tetapi pengguna/admin lebih sering mengenali lokasi dari nama tempat atau tautan WhatsApp daripada alamat formal. Contoh: `Warung Bu Ani`, `Masjid Desa`, `Alfamart Sumobito`, atau nama gedung.

Memaksa pengguna menggeser peta untuk setiap lokasi menyulitkan di mobile. Di sisi lain, kolom pencarian permanen membuat form penuh dan keyboard menutup peta. Pengguna sebelumnya juga meminta form tetap sederhana: pilih peta atau tempel link.

## 3. Solusi UX yang direkomendasikan

Gunakan tiga aksi yang setara untuk tiap titik: **Jemput** dan **Tujuan**.

| Aksi | Kapan dipakai | Hasil |
| --- | --- | --- |
| **Pilih di peta** | Lokasi tidak muncul pada pencarian atau perlu titik sangat presisi | Google Map layar penuh, pin tetap di tengah, CTA tetap di bawah layar |
| **Cari nama tempat** | Pengguna tahu nama warung/toko/gedung | Bottom sheet khusus pencarian Google Places, lalu peta memusat ke hasil |
| **Tempel link** | Lokasi dibagikan dari WhatsApp/Google Maps | Parser mengambil koordinat, lalu peta menampilkan pin untuk konfirmasi |

### Alur mobile terbaik

1. Pengguna menekan salah satu dari tiga tombol di atas, bukan langsung membuka map yang sulit ditutup.
2. Untuk **Cari nama tempat**, buka layar/bottom sheet fokus dengan input Google autocomplete dan tombol kembali. Input ini tidak tampil permanen di form utama.
3. Saat hasil dipilih, sheet ditutup dan Google Map dipusatkan ke titik tersebut.
4. Tampilkan pin tengah dan panel bawah tetap: `Gunakan titik jemput ini` atau `Gunakan tujuan ini`.
5. Pengguna dapat menggeser/zoom peta tanpa menggeser halaman; hanya panel CTA yang menerima tap.
6. Setelah titik dikonfirmasi, kembali ke form dan tampilkan ringkasan nama/koordinat singkat serta tombol `Ubah`.

Ini menyelesaikan masalah scroll map, tanpa mengorbankan kemampuan pencarian. Google sendiri menyatakan Place Autocomplete widget mendukung mobile, aksesibilitas, dan keyboard/screen reader dengan baik.

## 4. Penyedia dan batasan biaya

| Kebutuhan | Produk Google | Dipakai? | Batas gratis/bulan | Estimasi awal |
| --- | --- | --- | ---: | ---: |
| Basemap/pin/interaksi peta | Maps JavaScript API — Dynamic Maps | Ya | 10.000 map load | ±1.350 load |
| Saran nama tempat | Places API (New) — Autocomplete | Ya | 10.000 event | ±900 sesi lokasi dipilih |
| Detail minimal lokasi | Place Details Essentials | Ya | 10.000 request | ±900 request |
| Rute kendaraan | Routes API | **Tidak** | — | 0 |
| Geocoding/Text Search/Nearby Search | API lain | **Tidak** | — | 0 |

Asumsi konservatif: 15 kalkulasi/hari × 30 hari × dua titik = 900 pemilihan lokasi/bulan. Bila setiap kalkulasi membuka peta hasil sekali, total map load kira-kira 1.350/bulan. Angka ini jauh di bawah batas gratis 10.000 untuk masing-masing SKU di atas.

Autocomplete harus memakai widget Google resmi berbasis sesi. Widget menangani session token sendiri; setelah pengguna memilih tempat, aplikasi hanya meminta field minimum `location`, `displayName`, dan `formattedAddress`. Jangan memakai Text Search, Nearby Search, atau Geocoding sebagai pengganti autocomplete karena tidak dibutuhkan dan menambah biaya.

Billing Google Cloud tetap wajib diaktifkan meski perkiraan pemakaian Rp0. Kuota gratis berlaku per SKU dan diakumulasikan untuk semua project yang terhubung ke billing account yang sama.

## 5. Batasan produk dan data

- **ORS tetap sumber angka ongkir dan garis rute saat ini.** Tidak ada pemanggilan Google Routes API.
- Google Map dipakai sebagai peta pemilih titik dan peta konteks. Bila garis ORS tetap ditampilkan di atasnya, garis itu harus jelas diberi label `Estimasi rute ORS`, bukan diklaim sebagai arah Google Maps. Sebelum rilis, lakukan review kebijakan Google Maps untuk tampilan konten non-Google pada peta.
- Alternatif paling aman dan hemat: pada peta Google hasil, tampilkan hanya marker Basecamp/Jemput/Tujuan + total ongkir ORS; sediakan tombol **Buka navigasi di Google Maps** yang membuat Maps URL. Ini tidak memakai Routes API dan tidak menjanjikan garis navigasi Google di aplikasi.
- Pencarian dibatasi negara Indonesia dan diberi bias di sekitar area layanan/basecamp atau viewport peta terakhir. Bias bukan blokir keras, agar lokasi pelanggan di luar area tetap bisa dipilih.
- Jangan simpan cache hasil autocomplete/place detail atau daftar tempat. Gunakan data hanya untuk sesi pemilihan lokasi. Titik yang sudah pengguna konfirmasi tetap mengikuti kebijakan penyimpanan order yang ada.
- Hindari menampilkan pencarian Google sebagai kolom form biasa. Ia hanya dibuka lewat tombol **Cari nama tempat**.

## 6. Persyaratan fungsional

### 6.1 Google Map

- Ganti basemap Leaflet/OSM pada pemilih lokasi menjadi Maps JavaScript API.
- Tampilkan marker/pin jelas, tombol lokasi saya, zoom controls, dan atribusi Google yang tidak tertutup CTA.
- Tetap gunakan pola satu layar di mobile: container fixed, tidak ada halaman yang dapat di-scroll ketika map picker terbuka, dan CTA berada sebagai dock bawah `pointer-events: auto`.
- Lazy-load peta hanya ketika pengguna menekan `Pilih di peta`, membuka hasil pilihan, atau memilih hasil pencarian. Jangan me-mount map tersembunyi di semua form.
- Reuse instance peta selama satu modal/sesi untuk menghindari map load berulang.

### 6.2 Cari nama tempat

- Tambahkan tombol `Cari nama tempat` dengan ikon pencarian pada kartu Jemput dan Tujuan.
- Gunakan `PlaceAutocompleteElement` dari Maps JavaScript Places library (Places API New), bukan endpoint search buatan sendiri.
- Placeholder: `Cari warung, toko, gedung, atau alamat`.
- Minta hanya `location`, `displayName`, dan `formattedAddress` setelah pengguna benar-benar memilih hasil.
- Terapkan `componentRestrictions` Indonesia dan `locationBias` sekitar basecamp/viewport, kemudian perbarui bias ketika pengguna menggeser peta.
- Hanya hasil pilihan pengguna yang mengubah pin. Mengetik kata kunci tidak boleh menghitung ongkir atau memanggil ORS.
- Jika tidak ada hasil, pengguna dapat kembali ke `Pilih di peta` atau `Tempel link`; jangan otomatis melakukan Text Search atau Geocoding.

### 6.3 Tautan dari WhatsApp

- Pertahankan tombol `Tempel link` yang sudah ada.
- Terima tautan Google Maps lengkap atau short link yang berhasil diekspansi parser yang ada, lalu ambil koordinat dan tampilkan konfirmasi pin di Google Map.
- Jika tautan tidak memuat/menyelesaikan koordinat, tampilkan error yang dapat ditindaklanjuti: `Link belum terbaca. Pilih titik di peta atau cari nama tempat.`
- Tempel link tidak memanggil Places API jika koordinat sudah ditemukan.

### 6.4 Perhitungan ongkir

- Jangan mengubah kontrak ORS, toggle `kampung|car`, basecamp, rumus tarif, minimum ongkir Rp3.000, Express, paket tes, atau share parameter rute yang sudah berjalan.
- Rute dihitung hanya sesudah titik jemput dan tujuan dikonfirmasi, seperti perilaku sekarang.
- Map picker tidak boleh memicu hitung rute saat peta digeser atau autocomplete sedang menampilkan saran.

## 7. Keamanan, privasi, dan biaya

Gunakan **satu browser key Google** karena seluruh penggunaan Google terjadi di browser. API key browser bukan rahasia absolut; perlindungannya adalah restriction yang tepat.

```dotenv
# Boleh di browser, tetapi dibatasi domain dan API.
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
```

- Restrict key ke HTTP referrer produksi: `https://rayokurir.id/*` dan `https://www.rayokurir.id/*`.
- Restrict key ke **Maps JavaScript API** dan **Places API (New)** saja.
- Tidak perlu `GOOGLE_MAPS_ROUTES_API_KEY`, karena Routes API tidak dipakai.
- Jangan memasukkan key ke source code, link share, log, screenshot, atau dokumentasi publik.
- Buat budget alert US$5/bulan pada 50%, 90%, dan 100%. Alert bukan pemutus request; pantau quota/usage juga.
- Catat hanya metrik agregat: tombol pemilih yang dipakai (`map|place_search|link`), sukses/gagal parser, dan jumlah request. Jangan log kata kunci tempat, alamat lengkap, URL WhatsApp/Maps, atau koordinat mentah.
- Sebelum live, pastikan Kebijakan Privasi dan Ketentuan Penggunaan yang publik memenuhi kebijakan/atribusi Google Maps Platform.

## 8. Desain teknis

| Area | Perubahan |
| --- | --- |
| `components/ongkir/MapPicker.tsx` | Integrasi Maps JavaScript API, map fullscreen mobile, pin tengah, dock CTA, location bias, lazy load |
| Komponen baru `PlaceSearchSheet.tsx` | Place Autocomplete widget, state hasil sementara, detail field minimum, aksesibilitas/focus management |
| `components/ongkir/OngkirCalculatorWithMap.tsx` | Tambah tombol Cari nama tempat, buka/tutup sheet, simpan hasil yang sudah dikonfirmasi; rumus ORS tidak diubah |
| Parser link yang ada | Pertahankan parsing Google Maps link; hanya tambah pesan fallback dan konfirmasi peta bila perlu |
| `lib/routing.ts`, API ORS | Tidak diubah kecuali penyesuaian kecil type/UI bila diperlukan |
| Environment Vercel | Tambah `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` di Preview/Production |
| Legal pages | Audit Terms/Privacy dan atribusi sebelum rilis |

## 9. Rencana uji dan rilis

### Tahap 1 — Peta tanpa pencarian

- Aktifkan Maps JavaScript API pada map picker dengan key referrer-restricted.
- Uji mobile kecil: peta dapat digeser, CTA selalu terlihat, halaman belakang tidak bergerak, dan tombol dapat diketuk.
- Uji paste link WhatsApp/Google Maps dan konfirmasi pin.

### Tahap 2 — Pencarian tempat

- Aktifkan Places API (New) dan autocomplete sheet.
- Uji nama warung/toko/gedung, alamat umum, hasil yang tidak ada, keyboard, dan screen reader.
- Pastikan memilih hasil tidak menghitung ongkir sebelum CTA konfirmasi ditekan.

### Tahap 3 — Kontrol biaya dan rollout

- Aktifkan budget alert serta review quota sebelum deploy production.
- Pantau 7 hari: Dynamic Maps loads, Autocomplete, Place Details Essentials, error rate, dan pola klik map/search/link.
- Jika pemakaian mendekati 70% dari free cap, matikan pencarian sementara via feature flag dan pertahankan pilih peta/paste link.

## 10. Kriteria penerimaan

- [ ] ORS `kampung`/`car` dan tarif saat ini tetap bekerja tanpa perubahan logika.
- [ ] Google Routes API tidak diaktifkan dan tidak ada call Google untuk menghitung ongkir.
- [ ] Pemilih titik memakai Google Map, CTA bawah tidak tertutup dan halaman tidak ikut scroll pada phone kecil.
- [ ] Ada tiga pilihan jelas: Pilih di peta, Cari nama tempat, dan Tempel link.
- [ ] Pencarian dapat menemukan nama tempat dan memusatkan pin ke hasil pilihan.
- [ ] Keyword yang hanya diketik tidak memicu ORS; hasil pencarian tidak disimpan/cache.
- [ ] Input link dari WhatsApp yang memuat koordinat tidak memanggil Places API.
- [ ] Key browser hanya dapat dipakai dari domain produksi dan hanya untuk dua API yang disetujui.
- [ ] Budget alert aktif dan penggunaan uji 15 ongkir/hari berada di bawah free cap.
- [ ] Atribusi Google tidak tertutup dan legal pages telah diaudit.

## 11. Tutorial setup Google Maps paling hemat

1. Buka [Google Cloud Console](https://console.cloud.google.com/) dengan akun pemilik bisnis, lalu buat project `rayo-kurir-production`.
2. Hubungkan **Billing account** dan metode pembayaran. Ini diperlukan walaupun targetnya tetap gratis.
3. Di **APIs & Services → Library**, aktifkan hanya:
   - **Maps JavaScript API**
   - **Places API (New)**
4. Jangan aktifkan Routes API, Geocoding API, Text Search, Nearby Search, atau Directions/Distance Matrix lama untuk fitur ini.
5. Di **APIs & Services → Credentials**, buat satu API key bernama `rayo-kurir-web-maps-production`.
6. Pilih **Application restrictions → Websites**, lalu masukkan:
   - `https://rayokurir.id/*`
   - `https://www.rayokurir.id/*`
   Tambahkan `http://localhost:3000/*` hanya sementara untuk development lokal, lalu hapus bila tidak dipakai.
7. Pilih **API restrictions → Restrict key**, lalu izinkan hanya Maps JavaScript API dan Places API (New).
8. Simpan nilainya sebagai `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` di Vercel pada Preview dan Production. Jangan commit key ke Git.
9. Di **Billing → Budgets & alerts**, buat budget US$5/bulan dengan alert 50%, 90%, dan 100%.
10. Di **APIs & Services → Enabled APIs**, buka masing-masing API dan periksa Usage/Quotas setiap minggu pertama rilis.
11. Uji production dengan 10–15 pencarian nama tempat dan beberapa link WhatsApp. Pastikan browser hanya memuat Maps JavaScript/Places, sedangkan `/api/route-distance` tetap menuju ORS.

## 12. Referensi resmi

- [Harga dan batas gratis Google Maps Platform](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Place Autocomplete widget baru](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new)
- [Autocompletion session dan field minimum](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Kebijakan dan atribusi Google Maps Platform](https://developers.google.com/maps/documentation/routes/policies)

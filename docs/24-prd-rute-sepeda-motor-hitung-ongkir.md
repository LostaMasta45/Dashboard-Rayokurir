# PRD — Mode Rute Sepeda Motor di Kalkulator Ongkir

**Status:** Usulan untuk ditinjau (belum diimplementasikan)  
**Tanggal:** 24 Juli 2026  
**Pemilik:** Rayo Kurir  
**Permukaan terdampak:** `/hitungongkir`, kalkulator pada landing page, API perhitungan rute, tampilan garis rute peta, dan tautan bagikan.

## 1. Ringkasan keputusan yang diusulkan

Tambahkan pemilih **Pilihan rute** dengan dua opsi yang seluruhnya memakai OpenRouteService (ORS) yang sudah digunakan sekarang:

- **Jalan kampung / motor — estimasi**: memakai profil ORS `cycling-regular` untuk mencari alternatif jalur lokal yang kadang lebih dekat untuk motor.
- **Jalan mobil**: memakai profil ORS `driving-car` seperti hasil sekarang.

Tidak ada Google API, billing baru, atau provider baru. ORS `cycling-regular` bukan profil motor resmi, sehingga istilah UI **tidak boleh** menjanjikan "rute motor pasti bisa". Ia hanya menjadi estimasi jalur lokal/alternatif yang harus tetap dicek kurir di lapangan. Rute Mobil selalu tersedia sebagai pembanding dan fallback.

## 2. Masalah dan bukti kondisi saat ini

Kalkulator sekarang menghitung perjalanan dari basecamp dengan dua kaki:

1. D1: basecamp → titik jemput.
2. D2: titik jemput → titik antar.

Kedua perhitungan ongkir memanggil `POST /api/route-distance`. Endpoint tersebut memanggil ORS pada profil `driving-car`. Garis peta dari `POST /api/route-geometry` juga memakai `driving-car`. Karena itu, rute dan angka yang muncul mengikuti batasan mobil, sehingga beberapa gang/jalan lokal yang dapat dilalui motor tidak dipilih dan jarak dapat lebih jauh daripada praktik kurir.

Jika ORS tidak tersedia, sistem menghitung garis lurus + faktor 30%, tetapi hasilnya saat ini tidak diberi penanda yang jelas kepada pelanggan. Cache rute juga belum memiliki dimensi mode kendaraan karena memang baru ada satu mode.

## 3. Tujuan dan ukuran keberhasilan

### Tujuan

- Menyediakan estimasi alternatif jalan kampung yang berpotensi lebih dekat untuk kurir motor di Sumobito dan sekitarnya.
- Mempertahankan rute Mobil sehingga admin/pelanggan dapat membandingkan ketika jalan lokal diragukan atau tidak layak.
- Mempertahankan dasar perhitungan: **Basecamp → Jemput → Antar**. Toggle tidak pernah mengubah basecamp, urutan kaki perjalanan, maupun skema biaya.
- Menjaga tarif tier, paket layanan, halaman, dan konfigurasi yang sudah ada.
- Menampilkan keandalan estimasi dengan jujur; tidak mengklaim jalur lokal selalu dapat dilalui motor.

### Ukuran keberhasilan setelah rilis

- Pada kumpulan minimal 10 rute uji lokal (termasuk jalan pintas yang diketahui kurir), opsi Jalan kampung menghasilkan rute yang layak ditinjau dan, pada kasus yang sesuai, jaraknya lebih pendek dari Mobil.
- Tidak ada hasil cache Mobil yang muncul saat Jalan kampung dipilih, dan sebaliknya.
- Jarak angka ongkir dan garis rute pada peta memakai mode yang sama.
- Tidak ada secret ORS, koordinat lengkap pelanggan, atau URL berisi key yang tercatat dalam log aplikasi.
- Persentase fallback, error, dan kuota ORS dapat dipantau per hari.

## 4. Kondisi sekarang vs target

| Aspek | Sekarang | Target |
| --- | --- | --- |
| Profil rute | ORS `driving-car` untuk semua kalkulasi dan peta | ORS `cycling-regular` untuk estimasi Jalan kampung atau `driving-car` untuk Jalan mobil |
| Jalan kampung yang hanya cocok motor | Sering dihindari karena dimodelkan sebagai mobil | Dapat muncul sebagai estimasi, tetapi perlu validasi kurir karena profilnya sepeda kayuh |
| Kontrol pengguna | Tidak ada | Segmented toggle: Jalan kampung (estimasi) / Jalan mobil |
| Konsistensi angka–peta | Satu profil mobil | Satu `routeMode` dikirim untuk D1 Basecamp→Jemput, D2 Jemput→Antar, dan geometri peta |
| Kegagalan provider | Haversine × 1,3 tanpa label hasil | Status eksplisit: rute Jalan kampung gagal dan fallback Mobil/Haversine yang dipakai |
| Berbagi estimasi | Titik dan Express dibawa URL | Tambahkan `route_mode`; penerima melihat mode yang sama |

### Kelebihan dan konsekuensi

| Opsi | Kelebihan | Konsekuensi |
| --- | --- | --- |
| Tetap Mobil saja | Tanpa biaya/provider baru | Estimasi gang motor tetap bisa lebih jauh dari kenyataan |
| Mengganti semua ke Jalan kampung | Berpotensi lebih dekat | Berisiko melewati akses yang tidak layak untuk motor dan menghilangkan pembanding |
| **Toggle Jalan kampung + Mobil (usulan)** | Tetap gratis, transparan, admin/pelanggan dapat membandingkan | Jalan kampung adalah estimasi berbasis profil sepeda kayuh, bukan navigasi motor resmi |
| Provider Google Motor | Profil motor resmi | Tidak dipilih karena membutuhkan billing dan biaya request |

## 5. Pengguna dan alur pengalaman

### Pelanggan

1. Memilih titik jemput dan titik antar seperti saat ini.
2. Sebelum/ketika kalkulasi, memilih `Jalan kampung` atau `Jalan mobil`; nilai awalnya **Jalan kampung — estimasi untuk kurir motor**.
3. Aplikasi memuat ulang D1, D2, total, durasi, dan polyline peta dengan mode yang sama.
4. Kartu hasil menyebutkan, misalnya, `Estimasi jalur kampung — cek akses kurir` atau `Estimasi rute mobil`.
5. Bila ingin mengecek jalan utama, pelanggan dapat beralih ke Mobil; kedua mode tetap hanya estimasi dan harga akhir dikonfirmasi admin.
6. Link Share menyertakan mode; orang yang membuka link mendapatkan hasil dengan mode yang sama.

### Admin/kurir

- Tidak ada perubahan format order atau tarif tier pada tahap ini.
- Admin tetap berwenang mengoreksi estimasi bila jalan tertutup, tidak aman, tidak dapat dilalui motor, atau pin lokasi salah.
- Tahap lanjutan (di luar PRD ini): tombol internal untuk melaporkan jalan/pin yang tidak akurat agar menjadi data evaluasi, bukan pengubahan rute otomatis oleh pelanggan.

## 6. Persyaratan fungsional

### 6.1 Pemilih mode

- Tampilkan label `Pilihan rute` dekat area peta/form lokasi, bukan pada toggle Express.
- Pilihan: `Jalan kampung (estimasi)` dan `Jalan mobil` dengan ikon motor/mobil serta status aksesibel (`radio` atau `radiogroup`, bukan sekadar dekorasi).
- Default: `kampung`. Jika pengguna membuka link lama tanpa parameter, gunakan default ini; seluruh halaman dan tarif lain tetap sama.
- Saat mode berubah setelah titik lengkap, batalkan/abaikan respons lama dan hitung ulang. Selama memuat, tampilkan `Menghitung jalur kampung…` atau `Menghitung rute mobil…`.
- Sertakan `route_mode=kampung|car` pada URL share. Parameter tidak valid kembali ke default aman `kampung`.

### 6.2 Kontrak API internal

Tambahkan parameter wajib `routeMode` pada kedua API:

```json
{ "from": { "lat": -7.520653, "lng": 112.343111 }, "to": { "lat": -7.52, "lng": 112.35 }, "routeMode": "kampung" }
```

dan:

```json
{ "waypoints": [{ "lat": -7.520653, "lng": 112.343111 }], "routeMode": "car" }
```

Respons harus menambahkan metadata tanpa mengekspos secret:

```json
{
  "distance_m": 3120,
  "duration_s": 540,
  "coordinates": [],
  "route_mode": "kampung",
  "provider": "ors",
  "fallback": false
}
```

- Validasi koordinat menerima nilai `0`; jangan memakai pemeriksaan truthy yang menolak koordinat lintang/bujur nol.
- Kedua endpoint wajib memvalidasi mode dengan allow-list `kampung|car`; jangan menjadikan nama profil provider sebagai input publik.

### 6.3 Penyedia rute

- **Jalan kampung:** panggil ORS dengan profil `cycling-regular` yang sudah tersedia pada konfigurasi sekarang.
- **Jalan mobil:** pertahankan ORS `driving-car` yang ada.
- Gunakan key `OPENROUTESERVICE_API_KEY` yang sudah ada. Tidak ada key Google, perubahan billing, maupun provider baru.
- Pertahankan geocoding dan picker peta yang ada; perubahan hanya memilih profil directions ORS.
- Gunakan fungsi pemilih profil server-side agar nilai input publik hanya `kampung|car`, bukan nama profil ORS bebas.

### 6.4 Harga, tampilan, dan fallback

- Rumus `calculateD1`, `calculateD2`, minimum ongkir Rp3.000, Express, serta seluruh paket yang sudah ada **tidak diubah**. Yang berubah hanya input kilometer dan durasi.
- Jika ORS Jalan kampung gagal, jangan diam-diam memakai Mobil sambil menampilkan label Jalan kampung. Tampilkan status `Jalur kampung sementara belum tersedia; estimasi memakai rute mobil` dan metadata `fallback: true`.
- Jika kedua provider tidak tersedia, gunakan fallback Haversine yang ada tetapi beri label `Estimasi jarak sementara`, tanpa polyline jalan palsu. Harga akhir tetap konfirmasi admin.
- Tambahkan teks wajib/terlihat di hasil Jalan kampung: `Jalur kampung adalah estimasi data peta; cek kondisi, akses, dan keamanan jalan di lapangan.` Profil ini dibuat untuk sepeda kayuh dan bukan jaminan akses motor.

### 6.5 Cache, privasi, dan observabilitas

- Cache key harus memuat `routeMode`, nama provider, dan versi, misalnya `v4|ors|kampung|lat,lng|lat,lng`; cache Mobil dan Jalan kampung tidak boleh saling berbagi.
- Cache polyline dan distance memakai mode/provider yang sama dan TTL yang konsisten. Pada Vercel, cache memori per instance bukan cache bersama; anggap sebagai optimasi, bukan jaminan.
- Catat metrik agregat: mode, provider, `success|fallback|error`, latency, dan jarak yang dibulatkan/kelompokkan. Jangan mencatat API key, alamat pelanggan, URL maps, atau koordinat mentah. Hapus log debug saat ini yang mencetak URL ORS/koordinat.
- Pantau quota ORS dan jumlah fallback/error sebelum dan sesudah rilis. Tidak ada billing maupun API key baru pada perubahan ini.

## 7. Desain teknis yang terdampak

| Area | Perubahan yang diperlukan |
| --- | --- |
| `components/ongkir/OngkirCalculatorWithMap.tsx` | State `routeMode`, toggle, copy/status, request D1–D2, URL share, dan proteksi respons balapan |
| `components/ongkir/MapPicker.tsx` | Teruskan `routeMode` ke geometri; beri label/warna sesuai mode bila diperlukan |
| `app/api/route-distance/route.ts` | Allow-list mode, pemilih profil ORS Kampung/Mobil, response metadata, cache key aman, fallback berlabel |
| `app/api/route-geometry/route.ts` | Pemilih profil ORS yang sama untuk polyline multi-waypoint, cache key aman, tanpa log koordinat |
| Environment Vercel | Tidak ada variabel baru; gunakan `OPENROUTESERVICE_API_KEY` yang telah ada |
| Tes | Unit test mapper response, cache key, fallback, dan smoke test rute nyata |

Catatan implementasi: lebih baik buat satu modul server, misalnya `lib/routing/`, yang menerima `RouteMode` dan mengembalikan struktur normalisasi. Jangan menduplikasi keputusan provider di dua endpoint.

## 8. Di luar cakupan

- Mengubah tarif/tier, biaya Express, paket tes, atau aturan admin.
- Memberi jaminan bahwa setiap gang bisa dilalui motor.
- Menavigasikan kurir secara turn-by-turn dari aplikasi.
- Membangun database jalan pintas manual atau izin akses per RT (dapat menjadi fase lanjutan setelah data laporan cukup).
- Mengganti peta Leaflet, geocoding ORS, atau seluruh provider rute Mobil pada rilis ini.

## 9. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Data peta belum mengenali gang motor | Jalur kampung masih bisa memutar atau memilih jalan yang tidak ideal | Uji rute lokal, tampilkan disclaimer, sediakan Mobil, dan jadikan admin penentu akhir |
| Jalan mungkin legal namun tidak aman/terhalang | Waktu dan ongkir aktual berbeda | Jangan menjanjikan akses; gunakan status estimasi dan catatan admin |
| Profil `cycling-regular` bukan motor resmi | Bisa merekomendasikan akses sepeda/pejalan kaki yang tidak cocok | Labelkan sebagai estimasi jalur kampung, review rute lokal, dan sediakan Mobil |
| Cache/rute/angka beda mode | Harga membingungkan | Mode wajib di request/response/cache/share link; test kontrak end-to-end |
| API gagal lalu diam-diam berganti profil | Pelanggan salah memahami estimasi | Metadata provider/fallback dan pesan UI eksplisit |

## 10. Rencana rilis dan pengujian

### Tahap 0 — Persiapan

- Buat daftar 10–15 pasangan titik uji yang disetujui kurir: jalan utama, gang motor, jalan buntu, titik dekat, dan lintas desa.
- Tentukan satu contoh nyata yang dilaporkan pengguna sebagai acceptance route utama.

### Tahap 1 — Implementasi dan preview

- Implementasi adapter dan toggle hanya di preview.
- Bandingkan Jalan kampung vs Jalan mobil untuk setiap titik uji; simpan hasil uji sebagai jarak/durasi/mode, bukan alamat pelanggan publik.
- Pastikan kalkulasi D1, D2, garis peta, label, dan link Share menggunakan mode identik.

### Tahap 2 — Rilis terbatas

- Rilis dengan Jalan kampung sebagai default dan Mobil sebagai toggle fallback.
- Pantau error, fallback, latency, serta pemakaian ORS setiap hari selama 7 hari.
- Admin menandai kasus ketika hasil Jalan kampung tidak masuk akal untuk dilacak, tanpa mengubah tarif otomatis.

### Tahap 3 — Evaluasi

- Evaluasi perbedaan estimasi vs perjalanan kurir serta pemakaian quota ORS.
- Putuskan apakah mode Mobil tetap sebagai pilihan publik, menjadi opsi admin, atau seluruh routing dipindahkan ke satu provider pada fase berikutnya.

### Kriteria penerimaan

- [ ] Toggle terlihat dan dapat dioperasikan keyboard/screen reader di desktop dan mobile.
- [ ] Default dan share URL memulihkan `route_mode` dengan benar.
- [ ] Jalan kampung memakai `cycling-regular`; Mobil tetap `driving-car`.
- [ ] Dua kaki ongkir dan polyline peta tidak bercampur profil.
- [ ] Beralih mode memperbarui kilometer, waktu, rincian harga, dan label tanpa hasil stale.
- [ ] Fallback selalu terlihat jelas dan tidak menyamar sebagai jalur kampung.
- [ ] Cache mengisolasi mode/provider dan log tidak memuat secret/koordinat mentah.
- [ ] Seluruh 10–15 rute uji lulus review kurir, khususnya rute jalan pintas motor yang dilaporkan.
- [ ] Tarif existing, Express, paket tes, lokasi picker, dan alur WhatsApp tetap berfungsi.

## 11. Keputusan yang perlu disetujui sebelum coding

1. Setujui default **Jalan kampung (estimasi)** dan opsi **Jalan mobil** sebagai toggle publik.
2. Berikan 1–3 contoh titik/rute lokal yang menurut operasional seharusnya lebih dekat lewat motor, untuk dijadikan uji penerimaan nyata.
3. Setujui teks disclaimer bahwa jalur kampung tetap estimasi dan harga/kelayakan akhir dikonfirmasi admin.

## 12. Referensi

- Dokumentasi ORS menawarkan profil mobil, sepeda, pejalan kaki, dan kendaraan berat; bukan profil sepeda motor khusus: https://openrouteservice.org/services/
- Dokumentasi ORS tentang profil bersepeda menjelaskan bahwa `cycling-regular` adalah profil sepeda normal, sehingga penggunaan sebagai jalur kampung perlu selalu diberi label estimasi: https://ask.openrouteservice.org/t/trying-to-understand-the-difference-between-cycling-profiles/302

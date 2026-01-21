# Spesifikasi & Desain Form Pendaftaran Mitra (Self-Service)

Dokumen ini merinci rencana desain dan alur UX untuk halaman pendaftaran mitra mandiri. Desain ini mengadaptasi gaya visual dari dashboard admin (`mitra-page.tsx`) dan pengalaman pengguna mobile-native (`mitra2`), namun disederhanakan untuk kemudahan pengisian oleh awam.

---

## 1. Tujuan & Prinsip UX

*   **Self-Service:** Mengurangi beban admin input data manual. Mitra input sendiri, admin tinggal approve/validasi.
*   **Mobile-First:** 90% mitra akan mendaftar lewat HP. Form harus besar, jelas, dan mudah di-tap.
*   **Progressive Disclosure:** Jangan tampilkan 20 field sekaligus. Pecah menjadi langkah-langkah kecil (Wizard) agar terasa ringan.
*   **Visual Feedback:** Langsung tampilkan preview bagaimana toko mereka akan terlihat di aplikasi (Card Preview).

---

## 2. Struktur Data (Mapping ke `Mitra` Schema)

Data yang diambil dari form pendaftaran vs yang di-generate sistem:

| Field | Sumber Data | Keterangan |
| :--- | :--- | :--- |
| `nama` | **Input User** | Nama Toko / Usaha |
| `deskripsi` | **Input User** | "Sedia nasi goreng..." (Opsional, ada suggestion) |
| `kategori` | **Input User** | Multi-select (Chips) |
| `type` | **Input User** | Pilihan Visual (Food/Retail/Jasa/Apotek) |
| `whatsapp` | **Input User** | Validasi format 62 |
| `lokasi` | **Input User** | Alamat singkat / Desa |
| `logo`/`cover` | **Input User** | Upload foto (bisa menyusul/skip) |
| `waktuAntar` | *System Default* | Set default "15-30 menit" (bisa diedit nanti) |
| `sedangBuka` | *System Default* | `false` (Pending Approval) |
| `rating` | *System Default* | `0` (New) |

---

## 3. User Flow (Wizard Steps)

Kita gunakan **3 Langkah Mudah** (+ Halaman Sukses):

### Step 1: Identitas Usaha (The Hook)
*   **Input:** Nama Usaha, Kategori (Pilih Icon), Tipe Usaha.
*   **UX:** Saat user mengetik nama, update "Live Preview" kartu mitra di bagian atas/bawah layar agar mereka semangat.

### Step 2: Kontak & Lokasi (The Reach)
*   **Input:** Nama Pemilik (untuk admin), No WhatsApp (Wajib), Alamat/Desa.
*   **UX:** Input WA dengan format otomatis `+62`. Lokasi pakai dropdown desa yang sudah didukung + text detail.

### Step 3: Visual & Branding (The Look)
*   **Input:** Upload Logo (opsional), Upload Foto Cover/Tempat (opsional).
*   **UX:** Berikan opsi "Pakai Gambar Default" jika mereka belum punya foto bagus, agar tidak drop-off.

### Step 4: Review & Submit
*   Ringkasan data.
*   Tombol CTA Besar: **"Daftarkan Usaha Saya"**.

---

## 4. Desain UI (Komponen & Styling)

Menggunakan style yang sama dengan `mitra-page.tsx` (Shadcn UI + Tailwind):

### A. Layout Container
*   Mirip `Dialog` atau `Card` yang terpusat di layar mobile.
*   Header: Progress bar simpel (Step 1 of 3).

### B. Komponen Form
1.  **Tipe Usaha Selector (Radio Cards):**
    *   Grid 2 kolom.
    *   Icon besar + Label (Mis: 🍔 Food, 🛒 Warung).
    *   State `selected`: Border teal-500 tebal, bg-teal-50.
2.  **Kategori Chips:**
    *   Mirip filter di `mitra-page.tsx`.
    *   Klik untuk toggle.
3.  **Image Upload (Sederhana):**
    *   Area dropzone besar dengan icon kamera.
    *   Label: "Ambil Foto Toko" (karena di HP).

### C. "Live Preview" Component
*   Menampilkan komponen `MitraCard` (dari `mitra-page.tsx` atau `mitra2`) yang datanya *reactive* terhadap input form.
*   Ini memberikan motivasi instan: *"Wah, toko saya bakal kelihatan keren gini!"*

---

## 5. Copywriting (Microcopy)

Gunakan bahasa yang merangkul, bukan bahasa teknis database.

*   `nama`: "Apa nama usaha Anda?"
*   `type`: "Jenis jualan apa yang utama?"
*   `whatsapp`: "Nomor WA untuk terima orderan"
*   `lokasi`: "Di mana kurir harus jemput barang?"

---

## 6. Skenario Pasca-Submit

Setelah tombol Submit ditekan:
1.  Simpan data ke Supabase dengan status *pending* (butuh field status/approval di table atau flag `aktif=false`).
2.  **Redirect ke WhatsApp Admin** dengan pre-filled text:
    > "Halo Admin, saya baru saja isi form pendaftaran. Nama usaha: [Nama Usaha]. Mohon di-approve ya!"
3.  Ini memastikan Admin "ngeh" ada pendaftaran baru (real-time notification via WA manual).

---

## 7. Rencana Implementasi

### File Baru
*   `app/mitra/daftar/page.tsx` (Halaman utama form)
*   `components/registration/mitra-wizard.tsx` (Client component logic)
*   `components/registration/step-identity.tsx`
*   `components/registration/step-contact.tsx`
*   `components/registration/step-visual.tsx`

### Database
*   Cek tabel `mitra` di Supabase.
*   Pastikan RLS (Row Level Security) mengizinkan `INSERT` untuk public/anon (atau buat fungsi RPC khusus `register_mitra` agar aman).

---

## Contoh Mockup (Code Snippet Idea)

```tsx
// components/registration/type-selector.tsx
<div className="grid grid-cols-2 gap-3">
  <div onClick={() => setType('food')} className={`p-4 border-2 rounded-xl cursor-pointer flex flex-col items-center gap-2 ${type === 'food' ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}>
    <Utensils className="h-8 w-8 text-teal-600" />
    <span className="font-semibold">Kuliner</span>
  </div>
  <div onClick={() => setType('retail')} className={`p-4 border-2 rounded-xl cursor-pointer flex flex-col items-center gap-2 ${type === 'retail' ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}>
    <Store className="h-8 w-8 text-teal-600" />
    <span className="font-semibold">Warung/Toko</span>
  </div>
  {/* ... lainnya */}
</div>
```

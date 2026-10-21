# Sehatin

Aplikasi klinik sederhana dengan frontend React/Vite dan backend Express yang
terhubung ke Supabase.

## Alur layanan

Admin mengelola layanan medis berupa pemeriksaan atau konsultasi. Setiap
layanan memiliki nama, kategori, tarif, foto, dan **kuota**. Pengguna hanya
melihat layanan serta kuota yang tersedia; tidak ada entitas, akun, profil,
atau jadwal dokter di aplikasi.

Untuk layanan berkategori `obat`, label kuota ditampilkan sebagai **stok**
obat di frontend. Database tetap menggunakan kolom `kuota`.

## Menjalankan aplikasi

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Buat `backend/.env` berdasarkan variabel berikut:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
```

Jalankan backend dan frontend dari terminal terpisah:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Database

Jalankan `node src/schema.js` dari folder `backend` setelah `DATABASE_URL`
tersedia, atau salin SQL yang dicetak ke Supabase SQL Editor. Schema tersebut
menambahkan kolom `services.kuota`, menghapus tabel legacy `doctors` dan
`doctor_schedules`, serta melepas kolom dokter dari appointment dan rekam
medis. Akun lama dengan role `doctor` dinormalisasi menjadi `patient`.

Seed layanan:

```bash
cd backend && node src/seed.js
```

## Endpoint utama

| Method | Endpoint | Kegunaan |
| --- | --- | --- |
| GET | `/services` atau `/api/services` | Daftar layanan dan kuota |
| GET | `/api/services/:id` | Detail layanan |
| POST | `/api/services` | Admin menambah layanan |
| PUT | `/api/services/:id` | Admin mengubah layanan dan kuota |
| DELETE | `/api/services/:id` | Admin menghapus layanan |
| POST | `/api/auth/register` | Registrasi pasien |
| POST | `/api/auth/login` | Login pasien/admin |

Endpoint dokter dan endpoint jadwal dokter sudah tidak tersedia.

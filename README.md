# Sehatin

Aplikasi klinik sederhana dengan frontend React/Vite dan backend Express yang
terhubung ke Supabase.

## Alur layanan

Admin mengelola layanan medis berupa pemeriksaan atau konsultasi. Setiap
layanan memiliki nama, kategori, tarif, foto, **deskripsi**, dan **kuota**.
Pengguna dapat mengklik setiap layanan untuk melihat detail lengkapnya (foto,
kategori, tarif, kuota/stok, dan deskripsi) melalui modal detail yang mengambil
data terbaru dari endpoint `GET /api/services/:id`. Pengguna hanya melihat
layanan serta kuota yang tersedia; tidak ada entitas, akun, profil, atau jadwal
dokter di aplikasi.

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
JWT_SECRET=...
```

```bash
# Terminal 1 - backend
cd backend
npm run dev
```

```bash
# Terminal 2 - frontend
cd frontend
npm run dev
```

Alternatif: dari folder root, `npm run dev` akan menjalankan backend dan frontend
sekaligus. Pastikan port `3000` dan `5173` belum dipakai proses lain.

## Database

Jalankan `node src/schema.js` dari folder `backend`, lalu salin SQL yang
dicetak ke Supabase SQL Editor. Backend tidak menggunakan PostgreSQL SDK untuk
menjalankan migrasi. Schema tersebut
menambahkan kolom `services.kuota`, menghapus tabel legacy `doctors` dan
`doctor_schedules`, serta melepas kolom dokter dari appointment dan rekam
medis. Akun lama dengan role `doctor` dinormalisasi menjadi `patient`.

Seed layanan:

```bash
cd backend && node src/seed.js
```

Seed akan menambahkan 8 layanan bawaan beserta deskripsinya bila tabel masih
kosong. Jika tabel sudah berisi data, seed hanya melengkapi deskripsi layanan
bawaan yang masih kosong tanpa mengubah data lain.

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

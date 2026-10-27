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

### Aturan pesanan obat

Pesanan dengan kategori layanan `obat` **tidak memerlukan tanggal & jam
kunjungan** karena bisa diambil kapan saja di kasir/apotek. Setiap pesanan obat
mendapat batas pengambilan **maksimal 2 hari sejak pemesanan** yang disimpan
pada kolom `appointments.batas_pengambilan`.

Bila obat tidak diambil sampai batas tersebut, pesanan otomatis berstatus
`expired` (**hangus**) dan **stok tidak dikembalikan**. Stok sudah terpotong
saat pesanan dibuat, sehingga pesanan hangus tidak menambah `kuota` kembali.

Alur status pesanan obat: `confirmed` (menunggu diambil) → `completed` (sudah
diambil) atau `expired` (hangus). Admin tidak dapat mengubah status pesanan obat
yang sudah hangus. Pengecekan batas pengambilan dijalankan otomatis setiap kali
daftar pesanan, struk, atau status pesanan diakses.

## Menjalankan aplikasi

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Buat `backend/.env` berdasarkan variabel berikut:

```env
# Wajib: connection string PostgreSQL (Supabase Dashboard > Project Settings > Database > Connection string > URI)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
DATABASE_SSL=true
JWT_SECRET=...
```

Catatan penting:

- Backend terhubung langsung ke PostgreSQL memakai driver `pg`. Variabel
  `SUPABASE_URL` / `SUPABASE_ANON_KEY` **tidak** dipakai backend, jadi tanpa
  `DATABASE_URL` semua endpoint data akan membalas `503 Database belum dapat
  dijangkau`.
- Host pooler harus sesuai region project. Contoh: project di region
  `ap-northeast-1` memakai
  `aws-0-ap-northeast-1.pooler.supabase.com` (port `6543` transaction pooler,
  port `5432` session pooler).
- Jika password database mengandung karakter khusus (`&`, `@`, `#`, `/`, `:`),
  encode dulu dengan `encodeURIComponent()`.
- Cek koneksi sebelum menjalankan aplikasi:

  ```bash
  cd backend && npm run db:check
  ```

  Script ini menampilkan target koneksi, kode error, saran perbaikan, dan
  daftar tabel yang belum dibuat.

- Konfigurasi cepat (menulis `DATABASE_URL` ke `.env` sekaligus menguji koneksi):

  ```bash
  cd backend
  # salin Connection string (URI) dari Supabase lebih dulu
  npm run db:setup -- --clipboard

  # atau tempel langsung
  npm run db:setup -- "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"

  # atau hanya password-nya (host & project ref diisi otomatis)
  npm run db:setup -- --password <password-database>
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
menambahkan kolom `services.kuota`, kolom `appointments.batas_pengambilan`
(batas ambil pesanan obat), menghapus tabel legacy `doctors` dan
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
| POST | `/api/appointments` | Pasien membuat pesanan (obat tanpa tanggal/jam kunjungan) |
| GET | `/api/appointments` | Daftar pesanan (pasien: miliknya, admin: semua) |
| PATCH | `/api/appointments/:id/status` | Admin mengubah status pesanan |
| GET | `/api/appointments/receipt/:code` | Admin mencari struk berdasarkan kode unik |

Endpoint dokter dan endpoint jadwal dokter sudah tidak tersedia.

Setiap pesanan baru mendapatkan `kode_unik` pada struk. Admin dapat memasukkan
kode tersebut pada bagian **Verifikasi struk** di Dashboard untuk membuka data
pesanan terkait.

# 🩺 API Design Specification — Klinik Sehatin
**Mata Kuliah:** Web Application Development (WAD)  
**Kelompok:** Kelompok 7  
**Proyek:** Sehatin — Sistem Manajemen & Reservasi Layanan Klinik Kesehatan  

---

## 📌 1. Standar Konvensi Perancangan API
1. **Gaya Arsitektur:** RESTful API berbasis JSON (*application/json*).
2. **Penamaan Resource:** Kata benda jamak (*plural noun*), contoh: `/services`, `/doctors`, `/patients`, `/appointments`.
3. **Identifikasi Resource Tunggal:** Menggunakan parameter jalur (*path parameters*), contoh: `/:id` atau `/:booking_code`.
4. **HTTP Methods Standar:**
   - `GET`: Mengambil data (koleksi atau satu entitas). Bersifat *idempotent* dan *safe*.
   - `POST`: Membuat/mendaftarkan entitas baru. Payload dikirim melalui *request body*.
   - `PUT`: Mengganti seluruh data atribut pada resource tertentu.
   - `PATCH`: Memperbarui sebagian atribut (*partial update*) pada resource tertentu.
   - `DELETE`: Menghapus data resource dari sistem.
5. **Format Respons Standar:**
   ```json
   {
     "success": true,
     "message": "Deskripsi status operasi",
     "data": {}
   }
   ```

---

## 📋 2. Daftar Endpoint API (Dikelompokkan Berdasarkan Fitur)

### 🔐 Fitur 1: Autentikasi & Pengguna (Authentication & User Profile)
Mengelola pendaftaran akun pasien, proses login petugas/pasien, serta manajemen sesi pengguna.

| HTTP Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Mendaftarkan akun pasien baru dengan email, password, dan nomor telepon. |
| `POST` | `/api/v1/auth/login` | Melakukan autentikasi kredensial pengguna dan mengembalikan JWT access token. |
| `GET` | `/api/v1/auth/me` | Mengambil data profil pengguna yang sedang login berdasarkan token autentikasi. |
| `PUT` | `/api/v1/auth/me` | Memperbarui informasi profil pengguna yang sedang login (nama, kontak, email). |
| `POST` | `/api/v1/auth/logout` | Mengakhiri sesi login pengguna dan menginvalidasi token yang aktif. |

---

### 🏥 Fitur 2: Layanan Medis Klinik (Clinic Services)
Mengelola katalog layanan kesehatan klinik (Konsultasi Umum, Pemeriksaan Gigi, Konsultasi Kulit, Medical Check-up). Endpoint `GET /services` selaras langsung dengan backend Express eksisting.

| HTTP Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/services` *(Legacy/Root)* | Mengambil daftar seluruh layanan klinik (kompatibilitas backward dengan `backend/server.js`). |
| `GET` | `/api/v1/services` | Mengambil seluruh katalog layanan klinik aktif beserta tarif harga dan gambar. |
| `GET` | `/api/v1/services/:id` | Mengambil informasi detail satu layanan klinik spesifik berdasarkan ID. |
| `POST` | `/api/v1/services` | Menambahkan layanan klinik baru ke dalam sistem katalog (khusus Admin/Staf). |
| `PUT` | `/api/v1/services/:id` | Mengganti seluruh data informasi layanan klinik (nama layanan, tarif harga, deskripsi, gambar). |
| `PATCH` | `/api/v1/services/:id` | Memperbarui sebagian atribut layanan klinik (contoh: pembaruan tarif harga atau durasi). |
| `DELETE` | `/api/v1/services/:id` | Menghapus atau menonaktifkan layanan klinik dari katalog. |

---

### 🩺 Fitur 3: Dokter & Jadwal Praktek (Doctors & Schedules)
Mengelola informasi tenaga medis, dokter spesialis, serta jadwal operasional praktek harian klinik.

| HTTP Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/doctors` | Mengambil daftar seluruh dokter aktif beserta spesialisasi dan nomor izin praktek (SIP). |
| `GET` | `/api/v1/doctors/:id` | Mengambil profil lengkap satu dokter tertentu berdasarkan ID. |
| `GET` | `/api/v1/doctors/:id/schedules` | Mengambil jadwal praktek dokter yang tersedia (hari, jam mulai/selesai, sisa kuota). |
| `POST` | `/api/v1/doctors` | Mendaftarkan data profil dokter baru ke dalam basis data klinik. |
| `PUT` | `/api/v1/doctors/:id` | Memperbarui informasi profil dokter secara keseluruhan. |
| `POST` | `/api/v1/doctors/:id/schedules` | Menambahkan jadwal slot hari dan jam praktek baru untuk dokter tertentu. |
| `DELETE` | `/api/v1/doctors/schedules/:schedule_id` | Menghapus slot jadwal praktek dokter. |
| `DELETE` | `/api/v1/doctors/:id` | Menghapus dokter dari sistem klinik. |

---

### 👤 Fitur 4: Manajemen Data Pasien (Patients Management)
Mengelola berkas identitas pasien klinik, nomor rekam medis unik, dan informasi kontak darurat.

| HTTP Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/patients` | Mengambil seluruh daftar pasien terdaftar (khusus Staf Administrasi / Dokter). |
| `GET` | `/api/v1/patients/:id` | Mengambil informasi detail data identitas pasien spesifik berdasarkan ID. |
| `POST` | `/api/v1/patients` | Mendaftarkan berkas data pasien baru lengkap dengan NIK, No. Rekam Medis, dan alamat. |
| `PUT` | `/api/v1/patients/:id` | Memperbarui seluruh data identitas pasien (alamat, kontak, tanggal lahir). |
| `DELETE` | `/api/v1/patients/:id` | Menghapus data pasien dari sistem klinik (soft delete/arsip). |

---

### 📅 Fitur 5: Janji Temu & Reservasi Kunjungan (Appointments & Booking)
Mengelola proses pemesanan tiket janji temu dokter/layanan klinik yang diakses melalui tombol "Jadwalkan Kunjungan".

| HTTP Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/appointments` | Mengambil seluruh daftar reservasi janji temu (mendukung filter status dan tanggal). |
| `GET` | `/api/v1/appointments/:id` | Mengambil informasi detail satu janji temu berdasarkan ID. |
| `GET` | `/api/v1/appointments/code/:booking_code` | Melacak status reservasi janji temu menggunakan kode booking unik pelanggan. |
| `POST` | `/api/v1/appointments` | Membuat pengajuan reservasi janji temu kunjungan dokter baru dengan keluhan awal. |
| `PATCH` | `/api/v1/appointments/:id/status` | Memperbarui status kunjungan (`pending`, `confirmed`, `in_consultation`, `completed`, `cancelled`). |
| `DELETE` | `/api/v1/appointments/:id` | Membatalkan janji temu kunjungan oleh pasien atau pihak klinik. |

---

### 📋 Fitur 6: Rekam Medis & Riwayat Pemeriksaan (Medical Records)
Mengelola catatan hasil pemeriksaan dokter, diagnosis klinis, tindakan medis, dan resep obat (*Catatan Terarah*).

| HTTP Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/medical-records` | Mengambil daftar seluruh riwayat pemeriksaan rekam medis klinik. |
| `GET` | `/api/v1/medical-records/:id` | Mengambil detail satu berkas rekam medis hasil pemeriksaan dokter. |
| `GET` | `/api/v1/patients/:id/medical-records` | Mengambil seluruh riwayat historis rekam medis milik pasien tertentu. |
| `POST` | `/api/v1/medical-records` | Menyimpan catatan diagnosa, tindakan medis, dan resep obat setelah pemeriksaan selesai. |
| `PUT` | `/api/v1/medical-records/:id` | Memperbarui koreksi catatan rekam medis oleh dokter penanggung jawab. |

---

### 💳 Fitur 7: Tagihan, Pembayaran & Tarif Layanan (Billing & Invoices)
Mengelola penagihan biaya layanan kesehatan, metode pembayaran, dan status pelunasan transaksi (*Pricing Page*).

| HTTP Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/invoices` | Mengambil seluruh daftar tagihan pembayaran transaksi klinik. |
| `GET` | `/api/v1/invoices/:id` | Mengambil rincian nota/faktur tagihan pembayaran berdasarkan ID. |
| `POST` | `/api/v1/invoices` | Menerbitkan faktur tagihan biaya pemeriksaan dan layanan medis untuk janji temu terkait. |
| `PATCH` | `/api/v1/invoices/:id/payment` | Memperbarui status pembayaran (`unpaid` -> `paid`) dan mencatat metode bayar (Tunai, QRIS, Transfer, Asuransi). |

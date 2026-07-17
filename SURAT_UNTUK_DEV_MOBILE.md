# PANDUAN LENGKAP INTEGRASI: SINKRONISASI APP MOBILE & WEB HRD

Halo Tim Developer Mobile (Android & iOS)! 👋

Dokumen ini disusun khusus untuk teman-teman developer mobile agar kita bisa menyinkronkan data antara **Aplikasi Mobile Pegawai** dan **Sistem Web HRD**. 

Belakangan ini kita menemukan beberapa kendala di lapangan:
1. Sering gagal terhubung ke server/database.
2. Data absensi dan laporan kerja dari HP pegawai tidak masuk ke web HRD.
3. Jadwal shift di aplikasi pegawai salah (misalnya selalu muncul tulisan "Kerja" padahal seharusnya "Pagi", "Siang", "Malam", atau "Libur").

Nah, supaya aplikasinya bisa berjalan mulus dan sinkron 100%, mohon baca panduan ini dan terapkan penyesuaiannya di kode (Kotlin/Swift/Flutter) kalian ya. Panduan ini dibuat sedetail mungkin dari sisi alur maupun payload API-nya.

---

## 1. PERUBAHAN DATABASE & BASE URL (SANGAT PENTING!)

Kita baru saja melakukan migrasi besar. Web HRD **tidak lagi menggunakan Firebase/Firestore**, melainkan sudah beralih ke database relasional **PostgreSQL** yang dihosting di Railway. Karena itu, cara nembak API-nya sedikit berubah menggunakan jembatan API (SQL Bridge).

### 🛠️ Tindakan yang Wajib Dilakukan:
Kalian harus mengganti `BASE_URL` di Retrofit/HTTP Client aplikasi mobile yang tadinya mengarah ke server dummy (`beta-test-absent-production` atau `10.0.2.2`) menjadi **URL Cloud Run Web HRD Produksi** yang terbaru:

👉 **`https://beta-test-absent-production.up.railway.app/api`**

Semua request (`/mobile/login`, `/sql/rpc`) **wajib** menggunakan Base URL di atas!

---

## 2. WAJIB LOGIN ULANG KARENA PERUBAHAN FORMAT ID PEGAWAI

Karena kita pindah ke PostgreSQL, format ID Pegawai (`employeeId`) ikut berubah:
- **Dulu (Firebase):** String acak biasa (contoh: `7XyZrT9QpL...`)
- **Sekarang (PostgreSQL):** Format UUID v4 standar (contoh: `4992823a-48ec-43f0-9263-dd17756788e6`)

**⚠️ Akar Masalah Absen Gagal:**
Kalau aplikasi mobile masih menggunakan ID Firebase lama (yang tersimpan di cache/SharedPreferences) untuk mengirim data absen, server PostgreSQL akan menolaknya mentah-mentah (Error 500: Foreign Key Constraint Violation) karena ID lamanya tidak terdaftar di tabel yang baru.

### 🛠️ Alur Penyelesaian di Aplikasi:
Kalian wajib menambahkan fitur pembersihan sesi / *force logout* di update APK/IPA berikutnya:
1. **Hapus Sesi Lama:** Hapus semua `SharedPreferences` / `UserDefaults` yang berisi profil user dan token lama.
2. **Arahkan Login:** Paksa user untuk kembali ke layar Login.
3. **Login Ulang:** Lakukan POST login ke `/api/mobile/login` menggunakan kredensial (nik/password) user.
   - **⚠️ PERHATIAN TENTANG NIK vs EMAIL:** Pegawai login menggunakan **NIK (Nomor Induk Karyawan)**, misalnya `GT4573`, bukan *Email*. 
   - Aplikasi mobile **tetap harus mengirim field `nik`** dalam payload JSON-nya (contoh: `{"nik": "GT4573", "password": "..."}`). Jangan ubah mapping *request payload* menjadi `email` karena tabel pegawai di PostgreSQL menggunakan NIK untuk otentikasi login pegawai. (Email hanya digunakan untuk Admin Web HRD). Server terbaru saat ini sudah kami sesuaikan untuk mentoleransi jika field yang dikirim bernama "email", namun sebaiknya aplikasi tetap menggunakan field "nik".
4. **Simpan UUID Baru:** Server akan membalas dengan data user yang ID-nya sudah berbentuk UUID. Simpan UUID tersebut dan gunakan sebagai `employeeId` untuk **semua** request setelahnya (seperti absen, laporan, dan tarik jadwal).

---

## 3. CARA MENARIK JADWAL AGAR SHIFT SESUAI

Banyak yang mengeluh jadwal shift di aplikasi pegawai cuma bertuliskan "Kerja". Ini terjadi karena aplikasi masih nyantol ke database lama. Untuk menarik data master shift dan jadwal dari PostgreSQL, kita menggunakan endpoint jembatan ini:

**Endpoint:** `POST /sql/rpc`  
**Headers:** `Content-Type: application/json`

### Langkah A: Ambil Master Tipe Shift (`shift_types`)
Tarik dulu daftar tipe shift untuk mengetahui apa saja shift yang tersedia (Pagi, Siang, Malam, Libur, beserta jam dan warnanya).
**Payload Request:**
```json
{
  "action": "getDocs",
  "collection": "shift_types"
}
```
**Tugas Dev:** Simpan respon ini di memori lokal (misal di SQLite/Room). Array balasan ini berisi data seperti `id`, `name` ("PAGI"), `startTime`, dll.

### Langkah B: Ambil Jadwal Si Pegawai (`schedules`)
Tarik jadwal pegawai berdasarkan `employeeId` (pastikan pakai UUID yang baru ya!).
**Payload Request:**
```json
{
  "action": "getDocs",
  "collection": "schedules",
  "filters": [
    { 
      "field": "employeeId", 
      "operator": "==", 
      "value": "MASUKAN_UUID_PEGAWAI_YANG_LOGIN_DISINI" 
    }
  ]
}
```
**Tugas Dev:** 
Balasan jadwal ini memiliki field `shiftTypeId`. Nah, tugas kalian adalah mencocokkan `shiftTypeId` ini dengan `id` dari array balasan `shift_types` di Langkah A. 
Jika sudah dicocokkan (di-*mapping*), tulisan "Kerja" di UI kalender pegawai akan otomatis berubah menjadi "Pagi", "Siang", atau "Malam" dengan jam yang akurat!

---

## 4. CARA MENGIRIM ABSENSI & LAPORAN (HATI-HATI UKURAN FOTO!)

Untuk melakukan Clock In / Clock Out atau mengirim laporan, gunakan endpoint jembatan yang sama: `POST /sql/rpc`.

**Payload Request Contoh (Absensi):**
```json
{
  "action": "addDoc",
  "collection": "attendances",
  "data": {
    "employeeId": "MASUKAN_UUID_PEGAWAI_DISINI",
    "attendanceDate": "2026-06-25T00:00:00.000Z",
    "status": "Hadir",
    "timeIn": "08:00",
    "locationIn": "Kordinat GPS",
    "photoIn": "<STRING_BASE64_FOTO>"
  }
}
```

**⚠️ PERINGATAN KERAS: UKURAN PAYLOAD & TIMEOUT**
Sering kali data absen gagal terkirim (nyangkut, koneksi terputus, atau muncul Error 413 Payload Too Large). 
Penyebabnya adalah **ukuran foto selfie yang terlalu besar (bergiga-giga)** saat diubah menjadi Base64! Request HTTP tidak didesain untuk mengangkat text JSON berukuran puluhan Megabytes.

### 🛠️ Wajib Lakukan Kompresi Foto:
Tolong implementasikan algoritma kompresi foto di sisi klien (Android/iOS) sebelum fotonya diubah menjadi Base64:
- Turunkan resolusinya ke 720p atau 1080p saja.
- Ubah *quality* JPEG/WebP-nya hingga ukuran file **TIDAK LEBIH DARI 500 KB - 1 MB**.
- Setelah ukuran fotonya kecil (ratusan kilobyte), barulah konversi ke Base64 dan kirim ke server. Dijamin tidak akan ada lagi masalah gagal absen!

---

## ✅ CHECKLIST FINAL SEBELUM RILIS UPDATE APLIKASI

Mohon centang daftar ini di tim kalian sebelum membagikan update aplikasinya ke para pegawai:

- [ ] **Ganti Base URL** ke `https://beta-test-absent-production.up.railway.app/api`.
- [ ] **Bikin script Force Logout** supaya user login ulang dan dapat ID UUID dari database PostgreSQL terbaru.
- [ ] Pastikan payload saat ngirim absen atau nembak jadwal **memakai UUID tersebut di field `employeeId`**.
- [ ] Lakukan pemanggilan ke `shift_types` dan `schedules` via RPC, lalu **gabungkan (mapping) datanya** agar UI jadwal nampilin nama shift dengan benar.
- [ ] **Tambahkan library/fungsi kompresi foto** agar file yang di-Base64 besarnya kurang dari 1 MB.

Jika kelima poin di atas sudah diimplementasikan ke dalam kode sumber (source code) mobile, kami yakin 100% sistem web dan aplikasi pegawai akan sinkron dengan sempurna tanpa ada data yang gagal masuk.

Terima kasih banyak atas kerjasamanya, teman-teman developer! Selamat mengoding dan semoga lancar! 🚀
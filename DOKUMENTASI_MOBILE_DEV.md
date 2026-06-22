# Dokumentasi Sinkronisasi API & SQL Backend untuk Aplikasi Mobile Pegawai

Dokumen ini ditujukan untuk **Mobile Developer (Android/iOS)** yang bertugas mengembangkan Aplikasi Pegawai agar tersinkronisasi 100% secara utuh dengan Aplikasi Web HRD BOS Panel (Admin).

> **PERHATIAN PENTING (UPDATE TERBARU JUN 2026): KITA SUDAH TIDAK PAKAI FIREBASE LAGI!**
> Aplikasi ini **TIDAK LAGI** menggunakan koneksi langsung ke Firebase Firestore SDK native. Kita telah bermigrasi dan sekarang menggunakan **PostgreSQL + Node.js (Express) Backend**. 
> Anda wajib menggunakan REST API (HTTP) yang disediakan oleh server aplikasi Web untuk seluruh operasional transaksi data.

### Solusi Error yang Sering Terjadi (Troubleshooting):
1. **Penting: Masalah HTTP 500 saat Laporan Kerja / Absen / Jadwal** 
   - PostgreSQL ini menerapkan *Strict Foreign Keys* (Relasi Antar Tabel yang Ketat). 
   - Jika Anda mengirim payload dengan `employeeId` berupa String ID lama (Firebase) atau Null, server akan menolak dan mengembalikan **HTTP 500 (Foreign Key Constraint Violation)**. 
   - **SOLUSI:** Anda wajib *Clear Data / Log Out* aplikasi Android Anda (atau Hapus Instalasi lama), lalu Login ulang melalui endpoint `/api/mobile/login`. Anda akan mendapatkan **UUID PostgreSQL terbaru** yang harus Anda pakai sebagai `employeeId` untuk semua request selanjutnya.

2. **Foto Profil Pegawai Tidak Tampil**
   - Di endpoint `/api/mobile/login`, kini kami telah melampirkan field `profilePicUrl` serta info `departmentId` & `locationId`.
   - **SOLUSI:** Tambahkan `val profilePicUrl: String = ""` di data class `EmployeeData` Anda, simpan profil URL tersebut ke SharedPref/Room saat login, dan gunakan image loader seperti Coil atau Glide (Android) untuk memuat fotonya di Dashboard.

3. **Error HTTP 500 Saat Load Jadwal**
   - Pastikan Payload RPC menggunakan huruf kecil: `{ "action": "getDocs", "collection": "schedules" }`, jangan huruf kapital.
   - Jika Anda melakukan filter field dari Android, pastikan `employeeId` Anda Valid (lihat poin no 1 tentang UUID).

## 1. Koneksi API (HTTP REST)
Base URL yang digunakan adalah domain dari aplikasi Web tempat server berjalan (didapat dari URL aplikasi saat dijalankan), ditambah parameter path sesuai route. 

Terdapat 2 jenis endpoint utama:
1. **Endpoint REST Klasik** (berada di jalur `/api/...`)
2. **Endpoint Mapped RPC** (berada di jalur `/api/sql/rpc`) yang sebelumnya difungsikan untuk adaptasi query dari Firestore ke SQL.

### Endpoint RPC Mapped (`POST /api/sql/rpc`)
Endpoint ini digunakan untuk mempermudah kueri ke berbagai tabel yang sebelumnya menggunakan collection Firebase.
Body Request berbentuk JSON dengan parameter utama:
```json
{
  "action": "getDocs" || "getDoc" || "addDoc" || "updateDoc" || "deleteDoc",
  "collection": "nama_tabel_atau_collection",
  "filters": [], // Opsional (untuk where clause)
  "docId": "id_dokumen_opsional_bila_perlu",
  "data": {} // Payload payload dikirimkan untuk update/add
}
```

---

## 2. Struktur Database & Model

Berikut adalah *Tabel Utama* (Collection name) yang dikelola di backend yang berhubungan dengan aplikasi seluler:

### A. Referensi Organisasi (`locations`, `departments`, `sub_departments`)
Penyimpanan struktur jenjang perusahaan. Berifat **Read-Only** untuk aplikasi genggam.
Dapat diakses juga via REST API:
*   `GET /api/locations`: Menyimpan data lokasi pabrik/cabang.
*   `GET /api/departments`: Menyimpan unit kerja (bagian).
*   `GET /api/subdepartments`: Menyimpan regu kerja.

### B. Pegawai & Authentication (`employees`)
*   Panggil RPC dengan `action: "getDocs"`, `collection: "employees"`.
*   Data profil dan rincian gaji (termasuk `allowances` dan `deductions`) akan dimuat lengkap dari server SQL.
*   Lakukan pencocokan array object hasil `employees` berdasarkan kredensial yang disuplai (`nik` dan `password`). Jika cocok, simpan `id` tersebut sebagai identitas user di perangkat.
*   **Penting**: `profilePicUrl` saat ini dapat menerima Base64 Data URL atau public URL jika berukuran kecil.

### C. Master Jadwal & Shift (`shift_types`, `subdept_schedule_overrides`)
Terdapat penyesuaian pemetaan. Saat ini, skema Master Jadwal menggunakan tipe shift *(`shift_types`)* yang di-*assign* ke *(`subdept_schedule_overrides`)* berdasarkan tanggal.
*   Untuk memuat jadwal shift, gunakan `getDocs` ke `subdept_schedule_overrides` lalu sinkronkan dengan `shift_types`. Pemetaan jadwal per-karyawan divalidasi juga via relasi departemen.

### D. Rekaman Absensi (`attendances`)
Collection paling krusial untuk mencatat waktu masuk dan keluar.
Kirim RPC `action: "addDoc"` atau `action: "updateDoc"` ke `collection: "attendances"` dengan form:
*   `employeeId`: ID Pegawai.
*   `date`: Tanggal absensi (objek Date atau format string yang valid "YYYY-MM-DD" bila disinkron backend).
*   `timeIn` / `timeOut`: Jam absen masuk / pulang ("HH:mm").
*   `status`: "Hadir", "Telat", dsb.
*   `photoUrlIn` / `photoUrlOut`: Dapat berupa Base64 (pastikan payload JSON Anda diset threshold yang besar) atau Link external.
*   `latitude`, `longitude`: Titik koordinat GPS device saat absen.

### E. Pengajuan Cuti / Sakit (`leave_requests`)
Kirim RPC `addDoc` ke `leave_requests`:
*   `employeeId`: ID Pegawai.
*   `type`: Kategori (contoh: "Sakit", "Izin", "Cuti Tahunan").
*   `date`: Tanggal yang diajukan (YYYY-MM-DD).
*   `reason`: Alasan lengkap karyawan.
*   `status`: Default ke **"Pending"** pada saat diajukan.

### F. Pengajuan Lembur & Absen Lembur (`overtime_requests`)
*   Kirim/Update `overtime_requests` dengan `employeeId`, `date`, `hours`, `reason`, dan `status`.
*   Untuk data kehadiran lembur, update dokumen di `attendances` (seperti saat jam kerja), ubah kolom yang relevan (seperti `overtimeIn`).

---

## 3. Flow Fungsional Lengkap (Petunjuk Implementasi Mobile)

### 3.1. Validasi Absensi Selfie + Geofencing Location
1.  **Ambil Lokasi Pegawai**: Menggunakan GPS Service HP bersangkutan.
2.  **Dapatkan Lokasi Master**: Didapat dari `locations` sesuai index pengguna.
3.  **Kalkulasi Jarak**: Gunakan haversine di dalam perangkat. Jika lebih besar dari `radius` lokasi master, tolak absen.
4.  **Simpan Foto & Data**: Ambil swafoto secara live, konversi menggunakan Data URL (Base64 JPEG kompres - harap perkecil ke ~200kb), lalu lampirkan JSON dan kirim HTTP POST ke backend REST.

### 3.2. Listener Interval / Realtime
Mengingat aplikasi bukan lagi terhubung secara real-time ke Socket Firebase:
Disarankan melakukan **Polling / Tarikan Data Berkala** ke endpoint `/api/sql/rpc` dengan interval waktu (contoh: 5-10 detik) saat user menatap langsung halaman "Riwayat Permintaan Saya" guna mendapatkan update otomatis status (seperti perizinan Disetujui/Ditolak) yang sudah diposes di sisi Web Admin, atau menyediakan tombol "Refresh".

---
Semua interaksi yang sebelumnya menempel erat pada Firebase Class Functions harus direfaktor dengan *Fetch/Axios HTTP Call JSON Base* ke server Node.js. Silakan periksa struktur endpoint secara konstan dan samakan skema dengan backend PostgreSQL yang telah dimigrasi. Selamat Bekerja!

## 3. Daftar Fitur Wajib Aplikasi Mobile

Sesuai dengan sinkronisasi ke Web Panel, pastikan aplikasi mobile yang Anda bangun mencakup seluruh fitur di bawah ini:
1.  **Sistem Login**: Menggunakan form NIK dan Password (tanpa register, karena akun dibuatkan oleh Admin Web).
2.  **Beranda (Dashboard)**: Info profil ringkas, sapaan nama, tanggal hari ini, jam real-time, dan menu-menu pintasan (Absensi, Izin, Lembur, Jadwal, Profil).
    *   **Catatan Penting UI Profile**: Di sebelah tulisan "Halo 👋 [Nama]", ambil dan tampilkan foto profil dari URL field `profilePicUrl` (berasal dari dokumen `employees` milik user yang sedang aktif). Jika string kosong/null, baru gunakan ikon garis default / inisial nama.
3.  **Absensi Geofencing & Selfie (Clock In / Clock Out)**: 
    *   Mendeteksi keberadaan pegawai dalam radius lokasi cabang (Geofencing).
    *   Mewajibkan mengambil foto Selfie sebagai bukti kehadiran (menggunakan Kamera secara langsung, bukan dari galeri).
    *   Sistem validasi keterlambatan.
    *   **Fitur Ketua Regu (Group Attendance):** Jika role pegawai (dari response login) adalah "Ketua Regu" atau mengandung "Ketua", wajib ada opsi **Absen Anggota**. Lakukan request `action: getDocs` ke `employees` dengan filter `subDepartmentId` milik ketua. Ketua dapat melakukan Clock In/Out untuk anggotanya (cukup kirimkan `employeeId` anggota ke endpoint absen, tidak perlu ubah endpoint backend).
4.  **Pengajuan Izin & Cuti**: 
    *   Form pengajuan jenis Izin/Sakit/Cuti. 
    *   Input Upload Foto/Attachment (khusus Sakit wajib ada memo/surat dokter).
    *   Status Live Tracker (Menunggu, Disetujui, Ditolak).
5.  **Pengajuan Lembur**: 
    *   Mekanisme request jam lembur.
    *   Status persetujuan lembur.
    *   **Penting**: Jika disetujui, tombol **Clock-In Lembur** dan **Clock-Out Lembur** akan aktif pada hari tersebut, untuk merekam kehadiran lembur terpisah dari absen reguler.
6.  **Jadwal Kerja Pegawai**: 
    *   Tampilan kalender atau daftar shift pegawai pada bulan berjalan. Menampilkan Jam Masuk & Jam Keluar berdasarkan Shift Pattern dari Admin.
7.  **Profil Saya**: 
    *   Menampilkan detil data struktural (Nama Lengkap, NIK, Jabatan, Lokasi Cabang, Nama Departemen, Nama Regu).
    *   Menampilkan data besaran gaji / tunjangan (Bisa disembunyikan / Toggle blur "Lihat Slip").

## 4. Referensi UI/UX (Panduan Desain)

Agar senada dengan aplikasi Web HRD BOS Panel, ikuti pedoman *styling* berikut:
1.  **Vibe (Nuansa)**: Professional, Clean, Modern, dominasi "Dark/Slate" Tone (Sesuai dengan desain tema web saat ini).
2.  **Skema Warna**: 
    *   **Background Utama**: `Slate-900` atau `Gray-900` (#0F172A).
    *   **Komponen / Panel (Cards)**: `Slate-800` (#1E293B) dengan garis tepi yang tipis (border `Slate-700`).
    *   **Accent Color (Warna Utama/Tombol)**: `Teal-500` (#14B8A6) untuk tombol masuk absensi atau persetujuan. `Rose-500`/Merah untuk aksi penolakan atau Clock Out. `Sky/Blue` untuk elemen informasi pendukung lainnya.
    *   **Color Teks**: Putih / Terang (#F8FAFC) untuk teks utama. Teks sekunder dan label menggunakan abu-abu terang (#94A3B8).
3.  **Bentuk Geometri**: 
    *   Sudut melengkung yang mulus / Rounded corners (Radian rata-rata `12dp` atau `16dp` pada tombol dan Card panel).
    *   Penggunaan icon garis (Line Icons) sangat dianjurkan agar konsisten (seperti Lucide/Feather icons di Web).
4.  **Tipografi**: Menggunakan font sans-serif modern (seperti Inter, Roboto) yang jelas terbaca.
5.  **Status Warna yang Konsisten**:
    *   Hadir / Disetujui: Warna Hijau (`Emerald/Green`).
    *   Menunggu / Peringatan: Warna Kuning (`Amber/Yellow`).
    *   Terlambat / Ditolak / Pulang: Warna Merah (`Rose/Red`).
    *   Tombol aksi absen masuk dan absen lembur dibuat sangat menonjol di beranda atau laman absensi.

**Silakan jadikan salinan dokumen ini sebagai pedoman referensi Anda. Selamat Bekerja!**

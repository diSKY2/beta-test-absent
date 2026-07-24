# Panduan Struktur Presentasi & Penggunaan Aplikasi (Slide-by-Slide)
Dokumen ini dibuat untuk mempermudah Anda dalam menyusun slide presentasi PowerPoint (PPT) atau Google Slides untuk sistem manajemen absensi dan pegawai ini. 

Setiap bagian di bawah ini mewakili satu slide, lengkap dengan **Rekomendasi Gambar/Screenshot** yang perlu Anda ambil dari aplikasi aktif, **Poin Utama**, dan **Catatan Presenter (Narasi)**.

---

## Slide 1: Judul Presentasi
* **Judul:** Sistem Manajemen Kepegawaian & Absensi Berbasis Web & Mobile Portal
* **Sub-judul:** Solusi Efisien, Transparan, dan Terintegrasi untuk Manajemen SDM, Shift Kerja, dan Payroll
* **Rekomendasi Visual:** Logo Perusahaan Anda atau Screenshot halaman awal (Landing Page) aplikasi yang bersih dan profesional.
* **Poin Utama:**
  * Pengenalan sistem terpadu untuk admin dan pegawai.
  * Solusi otomatisasi absensi, shift, izin, dan penggajian.
  * Keamanan data tingkat tinggi berbasis Cloud/VPS.
* **Catatan Presenter (Narasi):**
  > *"Selamat pagi/siang rekan-rekan sekalian. Hari ini saya akan mempresentasikan sistem manajemen kepegawaian baru kita. Sistem ini dirancang untuk menyatukan manajemen administratif (oleh HR/Admin) dan aktivitas harian pegawai secara real-time, fleksibel, serta sangat mudah digunakan baik melalui komputer maupun smartphone."*

---

## Slide 2: Gambaran Umum Arsitektur Sistem
* **Judul:** Arsitektur & Keamanan Sistem
* **Rekomendasi Visual:** Diagram sederhana yang menghubungkan **Aplikasi Pegawai (Mobile/Web)** $\rightarrow$ **Server & Database (VPS)** $\leftarrow$ **Portal Admin (Web)**.
* **Poin Utama:**
  * **Portal Admin (Web Desktop):** Untuk HRD, Supervisor, dan Manajemen mengelola data strategis.
  * **Portal Pegawai (Responsive Mobile Web/APK):** Untuk absensi selfie, pelaporan tugas, dan pengajuan izin.
  * **Database Terpusat:** Sinkronisasi real-time dengan efisiensi tinggi (konsumsi data minimal).
* **Catatan Presenter (Narasi):**
  > *"Sistem kita memiliki dua gerbang utama: Portal Admin untuk manajemen pusat dan Portal Pegawai yang sangat ringan dan responsif di smartphone. Semua data tersinkronisasi secara real-time ke VPS kita, sehingga tidak ada lagi jeda waktu atau rekap manual di akhir bulan."*

---

## Slide 3: Portal Pegawai - Login Praktis
* **Judul:** Portal Pegawai: Login & Akses Cepat
* **Cara Mengambil Screenshot:**
  1. Buka halaman utama (Landing Page).
  2. Klik tombol **Masuk Portal Admin** atau akses halaman `/login` di perangkat mobile/browser.
  3. Ambil screenshot halaman login yang bersih dan modern tanpa teks demo.
* **Poin Utama:**
  * Antarmuka login yang aman dan minimalis.
  * Cukup menggunakan Email dan Sandi yang telah didaftarkan oleh Admin.
  * Deteksi otomatis jenis akun (Pegawai atau Administrator) untuk diarahkan ke portal yang sesuai.
* **Catatan Presenter (Narasi):**
  > *"Untuk masuk ke sistem, pegawai maupun admin cukup mengakses satu halaman login yang sama. Sistem akan otomatis mendeteksi peran akun tersebut secara cerdas dan mengarahkan mereka ke dasbor masing-masing secara instan."*

---

## Slide 4: Portal Pegawai - Dasbor Utama & Informasi Shift
* **Judul:** Portal Pegawai: Dasbor & Status Kerja Hari Ini
* **Cara Mengambil Screenshot:**
  1. Login menggunakan akun pegawai.
  2. Ambil screenshot halaman utama portal pegawai yang menampilkan informasi shift hari ini, sisa cuti, dan tombol aksi cepat.
* **Poin Utama:**
  * Informasi instan mengenai jadwal kerja, jam masuk, dan jam pulang hari ini.
  * Kartu status kehadiran yang interaktif (Sudah Absen/Belum Absen).
  * Pengumuman interaktif dari manajemen langsung di halaman utama.
* **Catatan Presenter (Narasi):**
  > *"Begitu pegawai berhasil masuk, mereka akan disambut oleh dasbor personal yang sangat informatif. Mereka dapat langsung melihat jam berapa mereka harus mulai bekerja hari ini, melihat pengumuman penting, serta memantau ringkasan kehadiran bulanan mereka secara sekilas."*

---

## Slide 5: Portal Pegawai - Absensi Selfie dengan Kompresi Cerdas
* **Judul:** Portal Pegawai: Absensi Selfie & Lokasi GPS
* **Cara Mengambil Screenshot:**
  1. Di Portal Pegawai, klik tombol **Absen Masuk** atau **Absen Pulang**.
  2. Izinkan akses kamera dan lokasi pada browser/perangkat Anda.
  3. Ambil screenshot saat kamera aktif dan menampilkan deteksi lokasi GPS sebelum menekan tombol kirim.
* **Poin Utama:**
  * Absensi wajib menggunakan kamera (selfie) untuk menghindari kecurangan/titip absen.
  * Pencatatan koordinat GPS yang akurat untuk memastikan pegawai berada di area kerja.
  * **Teknologi Kompresi Gambar Cerdas:** Gambar dikompres otomatis hingga $\approx$ 30-50 KB sebelum diunggah, menghemat penyimpanan VPS hingga 90% tanpa mengurangi kejelasan verifikasi wajah.
* **Catatan Presenter (Narasi):**
  > *"Fitur unggulan untuk pegawai adalah Absen Selfie dengan koordinat lokasi GPS. Untuk mencegah manipulasi, pegawai wajib mengambil foto wajah secara langsung. Menariknya, sistem kami memiliki optimasi gambar otomatis di sisi klien yang mengecilkan ukuran foto menjadi sangat kecil namun tetap tajam, sehingga server kami tetap berjalan kencang dan hemat penyimpanan."*

---

## Slide 6: Portal Pegawai - Pengajuan Izin, Cuti & Dinas
* **Judul:** Portal Pegawai: Pengajuan Cuti, Sakit, & Dinas (Izin)
* **Cara Mengambil Screenshot:**
  1. Masuk ke menu **Pengajuan Izin / Cuti** di Portal Pegawai.
  2. Ambil screenshot formulir pengajuan izin yang berisi pilihan tanggal, jenis izin, alasan, dan kolom unggah dokumen pendukung (seperti surat dokter).
* **Poin Utama:**
  * Pengajuan mandiri (self-service) secara online dari smartphone.
  * Kategori lengkap: Cuti Tahunan, Sakit, Izin Penting, Dinas Luar Kota, dll.
  * Fitur unggah bukti fisik (foto surat dokter atau surat tugas).
  * Pemantauan status persetujuan secara real-time (Menunggu / Disetujui / Ditolak).
* **Catatan Presenter (Narasi):**
  > *"Pegawai tidak perlu lagi menulis surat fisik atau mengirim pesan WhatsApp manual jika ingin mengajukan izin atau cuti. Melalui menu pengajuan ini, mereka dapat mengisi tanggal, memilih tipe izin, menulis alasan, bahkan memfoto surat dokter mereka. Status persetujuannya dapat dipantau langsung dari dasbor mereka."*

---

## Slide 7: Portal Admin - Dasbor Utama & Monitoring Real-Time
* **Judul:** Portal Admin: Pusat Kontrol & Monitoring Real-Time
* **Cara Mengambil Screenshot:**
  1. Login sebagai Administrator (`admin@perusahaan.com` / `admin123`).
  2. Masuk ke dasbor utama admin atau menu **Monitoring**.
  3. Ambil screenshot grafik kehadiran hari ini, peta sebaran pegawai, atau daftar pegawai aktif yang sedang bertugas.
* **Poin Utama:**
  * Grafik visual tingkat kehadiran pegawai secara real-time hari ini.
  * Panel kontrol cepat untuk melihat siapa saja yang terlambat, sedang izin, atau belum absen.
  * Pengawasan lokasi tugas lapangan melalui log absensi masuk.
* **Catatan Presenter (Narasi):**
  > *"Sekarang kita berpindah ke sisi Administrator. Ini adalah pusat kendali HR. Admin disuguhkan grafik persentase kehadiran hari ini secara real-time. Admin langsung tahu detik ini juga berapa banyak pegawai yang sudah berada di kantor, siapa saja yang terlambat, dan siapa saja yang sedang cuti tanpa harus menunggu laporan rekap sore hari."*

---

## Slide 8: Portal Admin - Manajemen Penjadwalan & Rostering Shift
* **Judul:** Portal Admin: Manajemen Shift & Rostering Otomatis
* **Cara Mengambil Screenshot:**
  1. Buka menu **Rostering / Jadwal Shift** di Portal Admin.
  2. Ambil screenshot kalender jadwal bulanan, konfigurasi shift harian, atau tombol pembuatan jadwal otomatis per regu/sub-departemen.
* **Poin Utama:**
  * Pembuatan pola shift kerja yang sangat fleksibel (24 jam, rotasi 3-shift, atau non-shift).
  * Distribusi jadwal bulanan masal hanya dengan satu klik ke seluruh pegawai di regu tertentu.
  * Fitur override (pengecualian) jadwal untuk menukar hari libur atau tugas mendadak per individu.
* **Catatan Presenter (Narasi):**
  > *"Mengatur shift untuk ratusan pegawai seringkali memusingkan. Di menu Rostering ini, admin dapat membuat pola kerja mingguan atau bulanan, lalu membagikannya sekaligus ke seluruh anggota regu atau divisi dalam satu kali klik. Jika ada pegawai yang bertukar jadwal di hari tertentu, admin dapat melakukan override jadwal spesifik pegawai tersebut dengan mudah."*

---

## Slide 9: Portal Admin - Persetujuan Izin & Cuti yang Terintegrasi
* **Judul:** Portal Admin: Verifikasi & Persetujuan Dokumen Izin
* **Cara Mengambil Screenshot:**
  1. Masuk ke menu **Persetujuan / Approvals** di Portal Admin.
  2. Ambil screenshot daftar pengajuan izin pegawai yang menampilkan detail tanggal, alasan, foto surat dokter, dan tombol hijau "Setujui" serta tombol merah "Tolak".
* **Poin Utama:**
  * Sistem verifikasi satu atap untuk semua pengajuan pegawai.
  * Preview langsung surat dokter atau lampiran bukti tanpa perlu mengunduh file terlebih dahulu.
  * **Sinkronisasi Absensi Otomatis:** Ketika izin disetujui, sistem akan otomatis mencatatkan status "Izin" atau "Sakit" pada kalender absensi harian pegawai tersebut tanpa perlu diinput manual ulang.
* **Catatan Presenter (Narasi):**
  > *"Ketika pegawai mengajukan izin dari HP mereka, pengajuan tersebut akan muncul di panel Persetujuan admin. Di sini admin bisa melihat alasan, mengecek lampiran foto surat dokter secara instan, lalu memutuskan untuk menyetujui atau menolaknya. Hebatnya, saat disetujui, sistem otomatis memperbarui kalender absensi pegawai bersangkutan menjadi 'Izin' atau 'Sakit' secara otomatis."*

---

## Slide 10: Portal Admin - Payroll & Rekap Excel Instan
* **Judul:** Portal Admin: Laporan Kehadiran & Penggajian (Payroll)
* **Cara Mengambil Screenshot:**
  1. Masuka ke menu **Payroll / Laporan Kerja** di Portal Admin.
  2. Ambil screenshot tabel rekapitulasi gaji, komponen potongan keterlambatan, tunjangan, dan tombol ekspor data.
* **Poin Utama:**
  * Rekapitulasi otomatis jam kerja efektif, keterlambatan, dan ketidakhadiran dalam sebulan.
  * Perhitungan potongan gaji atau insentif berdasarkan kehadiran real-time secara transparan.
  * Fitur ekspor laporan lengkap langsung ke format Microsoft Excel (.xlsx) untuk laporan ke manajemen.
* **Catatan Presenter (Narasi):**
  > *"Slide terakhir dari portal admin adalah penggajian dan pelaporan. Seluruh data absensi, keterlambatan, dan izin sepanjang bulan diakumulasikan secara otomatis menjadi nilai nominal gaji bersih setelah potongan dan tunjangan. Admin dapat mengunduh seluruh data kehadiran dan payroll ini langsung menjadi file Excel siap cetak hanya dalam hitungan detik."*

---

## Slide 11: Penutup & Tanya Jawab
* **Judul:** Implementasi & Masa Depan Kepegawaian yang Efisien
* **Rekomendasi Visual:** Logo Perusahaan, Kontak Support HR, atau Tampilan Aplikasi di Desktop & Handphone bersisian.
* **Poin Utama:**
  * Peningkatan kedisiplinan pegawai hingga 95% melalui absensi GPS & Selfie.
  * Penghematan waktu rekap HRD dari beberapa hari menjadi hitungan detik.
  * Efisiensi infrastruktur: berjalan sangat stabil di VPS standar dan hemat penyimpanan.
* **Catatan Presenter (Narasi):**
  > *"Dengan diterapkannya sistem ini, kita tidak hanya mempermudah pekerjaan rekan-rekan HRD dalam merekap data, tetapi juga membangun budaya kerja yang lebih transparan dan disiplin bagi seluruh pegawai kita. Terima kasih atas perhatiannya, saya persilakan jika ada pertanyaan dari rekan-rekan sekalian."*

---
*Dokumen ini dapat Anda cetak atau simpan di komputer Anda sebagai panduan penyusunan slide presentasi Anda.*

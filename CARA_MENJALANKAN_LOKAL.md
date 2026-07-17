# Panduan Menjalankan Sistem HRIS Secara Lokal (Localhost)

Dokumen ini menjelaskan langkah-langkah untuk menjalankan portal web **PT. GARUDA TRISULA PERKASA** di komputer lokal Anda untuk keperluan pengujian mandiri maupun demonstrasi kepada klien.

---

## 📋 Persyaratan Sistem

Sebelum memulai, pastikan komputer Anda telah terpasang:
1. **Node.js** (Sangat disarankan versi **v18** atau **v20**).
2. **PostgreSQL Database** (Sangat disarankan versi **14, 15, atau 16**. Bisa menggunakan PostgreSQL Lokal, Docker, atau database cloud gratis seperti [Neon.tech](https://neon.tech) atau [Supabase](https://supabase.com)).
3. **Koneksi Internet** (Untuk sinkronisasi real-time dengan Firebase Firestore yang digunakan oleh aplikasi mobile pegawai).

---

## 🛠️ Langkah-Langkah Instalasi

### 0. Persiapan Database PostgreSQL
Jika Anda belum memiliki PostgreSQL, ikuti langkah berikut untuk menginstalnya di komputer Windows Anda:
1. Unduh installer PostgreSQL dari situs resminya: [EnterpriseDB PostgreSQL Download](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads). (Pilih versi 14, 15, atau 16 untuk Windows).
2. Jalankan installer yang sudah diunduh. Lakukan instalasi standar (Next terus).
3. **PENTING:** Saat diminta memasukkan **Password** untuk *superuser* `postgres`, masukkan kata sandi yang mudah Anda ingat (contoh: `admin123` atau `password_anda`). Catat password ini!
4. Biarkan Port *default* di `5432`. Selesaikan instalasi.
5. Buka program **pgAdmin 4** (sudah terinstal bersama PostgreSQL).
6. Login menggunakan password yang Anda buat di langkah 3.
7. Di sebelah kiri, buka **Servers** -> **PostgreSQL XX** -> Klik kanan pada **Databases** -> Pilih **Create** -> **Database...**
8. Beri nama database: `hris_gtp` lalu klik **Save**.
Database Anda sekarang siap digunakan!

### 1. Ekstrak Berkas ZIP Proyek
Pastikan semua folder seperti `src`, `api`, `public`, `package.json`, dan file konfigurasi Firebase `firebase-applet-config.json` berada dalam satu direktori kerja Anda.

### 2. Pasang Dependensi Node.js
Buka Terminal / Command Prompt pada folder proyek tersebut, lalu jalankan perintah:
```bash
npm install
```

### 3. Konfigurasi Environment (`.env`)
Buat sebuah file baru bernama `.env` di root folder proyek (sejajar dengan `package.json`). Masukkan konfigurasi berikut:

```env
# Koneksi Database PostgreSQL Anda
# Format: postgres://username:password@host:port/database_name
DATABASE_URL="postgres://postgres:password_anda@localhost:5432/hris_gtp"

# (Opsional) Jika menggunakan API AI Gemini
GEMINI_API_KEY="masukkan_api_key_gemini_jika_ada"

# Port Default Aplikasi
PORT=3000
```
> **Tips:** Jika Anda menggunakan Neon.tech atau Supabase, Anda tinggal menyalin *Connection String* yang diberikan ke variabel `DATABASE_URL` di atas.

### 4. Push Skema Database (Drizzle ORM)
Untuk membuat tabel-tabel database secara otomatis di PostgreSQL Anda sesuai skema sistem, jalankan perintah:
```bash
npm run db:push
```
Perintah ini akan secara otomatis mendeteksi skema pada `src/db/schema.ts` dan menyinkronkannya dengan PostgreSQL Anda tanpa memerlukan konfigurasi SQL manual.

### 5. Lakukan Seeding Akun Admin Default
Untuk membuat akun administrator HRD awal agar Anda bisa masuk ke Dashboard Admin, jalankan perintah:
```bash
npm run db:seed
```
Ini akan membuat akun administrator default dengan kredensial:
*   **Email:** `admin@perusahaan.com`
*   **Kata Sandi:** `admin123`

---

## 🚀 Menjalankan Server Lokal

Setelah instalasi selesai, Anda siap menjalankan aplikasi dengan perintah:
```bash
npm run dev
```

Server Anda sekarang berjalan di:
👉 **`http://localhost:3000`**

Buka tautan di atas menggunakan peramban (browser) Anda. Anda akan melihat **Portal Korporat PT. Garuda Trisula Perkasa** yang baru didekorasi. Anda bisa klik tombol **HRD Portal** di sudut kanan atas untuk masuk ke Dashboard Admin menggunakan akun demo di atas.

---

## 📱 Menguji Koneksi dengan Aplikasi Mobile (Untuk Client)

Untuk mengizinkan pengembang mobile atau klien menguji aplikasi di perangkat Android mereka yang tersambung ke server localhost Anda, Anda memiliki dua cara mudah:

### Opsi A: Menggunakan Alamat IP Lokal (Satu Jaringan Wi-Fi)
1. Pastikan PC Anda dan HP Android klien berada dalam **satu jaringan Wi-Fi yang sama**.
2. Cari IP lokal PC Anda (di Windows: ketik `ipconfig` di cmd, cari `IPv4 Address` contoh: `192.168.1.15`).
3. Pada kode base URL aplikasi mobile, arahkan ke: `http://192.168.1.15:3000`.

### Opsi B: Menggunakan Ngrok Tunneling (Sangat Direkomendasikan)
Jika klien berada di tempat yang jauh atau menggunakan jaringan internet berbeda, Anda dapat membuat server lokal Anda dapat diakses secara global (online) secara gratis menggunakan Ngrok:
1. Unduh dan pasang **[ngrok](https://ngrok.com)**.
2. Jalankan perintah di Terminal:
   ```bash
   ngrok http 3000
   ```
3. Ngrok akan memberikan URL publik acak yang aman seperti:
   `https://a1b2-34-56-78.ngrok-free.app`
4. Berikan tautan tersebut kepada pengembang mobile atau klien Anda untuk langsung dicoba secara instan di HP mereka!

### Opsi C: Menjalankan di PC Server Pribadi (IP Publik / VPS)
Jika Anda memiliki PC Server yang sudah mengantongi IP Publik (atau VPS), Anda bisa menjadikannya host agar bisa diakses langsung lewat IP Anda dari mana saja di internet:

1. **Pindahkan Source Code**: Bawa semua file source code web ini (yang sudah diekstrak) ke dalam PC Server tersebut.
2. **Instalasi Dasar**: Pastikan PC Server sudah terinstall **Node.js** dan database **PostgreSQL**.
3. **Konfigurasi Lingkungan**:
   - Jalankan `npm install` di dalam folder server.
   - Buat file `.env` dan atur `DATABASE_URL` ke database PostgreSQL yang ada di server tersebut.
   - Jalankan `npm run db:push` untuk memigrasi tabel database ke dalam server.
4. **Buka Port Firewall**:
   - Di PC Server (misal menggunakan OS Windows), pastikan **Windows Defender Firewall** sudah membuka *Inbound Rules* untuk **Port 3000** (atau port lain yang Anda tetapkan di `.env`).
   - Jika OS Linux, gunakan perintah: `sudo ufw allow 3000`.
5. **Jalankan Aplikasi Mode Produksi**:
   - Walaupun menggunakan `npm run dev` bisa, lebih baik jalankan proses build dengan perintah:
     ```bash
     npm run build
     npm start
     ```
   - **(Opsional tapi Sangat Disarankan) Menggunakan PM2**: Agar aplikasi tetap hidup di latar belakang dan otomatis menyala kembali jika server *restart*, gunakan Process Manager (PM2).
     - Instal PM2: `npm install -g pm2`
     - Jalankan aplikasi: `pm2 start npm --name "hris-web" -- start`
     - Simpan pengaturan: `pm2 save` dan `pm2 startup`
6. **Akses dari Luar**: Klien Anda (aplikasi mobile / browser) kini cukup diarahkan langsung menggunakan IP publik dari server Anda, contohnya: **`http://103.xxx.xx.xx:3000`**.

> **💡 Catatan Tambahan (Apakah butuh aplikasi lain?)**
> Secara inti, Anda **TIDAK BUTUH** aplikasi lain selain **Node.js** dan **PostgreSQL**. Layanan pihak ketiga seperti **Firebase** digunakan lewat internet (Cloud), jadi tidak perlu diinstal di server Anda.
> Namun, jika Anda ingin menggunakan nama domain (seperti `hris.perusahaan.com`) dan menghilangkan port `:3000` di belakang URL, Anda bisa menginstal **Nginx** sebagai *Reverse Proxy*.

### Opsi D: Menggunakan IP Publik Lewat VPN Tunneling (WireGuard)
Sangat bisa dan tidak masalah! Jika PC Server lokal Anda berada di balik ISP yang tidak memberikan IP Publik statis (seperti Indihome/Biznet rumahan), menggunakan **WireGuard** untuk melakukan *tunneling* dari VPS ber-IP Publik ke PC lokal Anda adalah solusi yang sangat cerdas dan aman.

**Hal yang perlu diperhatikan jika menggunakan WireGuard:**
1. **Binding Address Server:** Pastikan server Node.js Anda berjalan (listen) di IP `0.0.0.0` (bukan hanya `localhost` atau `127.0.0.1`), agar aplikasi mau menerima trafik yang datang dari *interface* WireGuard (misal: `wg0`). (Secara bawaan script `npm run dev` atau build di sistem ini sudah menggunakan host `0.0.0.0`).
2. **Port Forwarding (iptables):** Di sisi VPS (yang memiliki IP Publik), pastikan Anda sudah mengatur *routing* atau `iptables` IP Forwarding. Contoh, trafik yang masuk ke `IP_PUBLIK_VPS:3000` harus diteruskan (forward) ke IP lokal WireGuard PC Anda (misal `10.8.0.2:3000`).
3. **Kinerja:** WireGuard sangat ringan dan memiliki latensi rendah. Trafik absensi geofence atau tarik data CMS tidak akan terhambat selama koneksi PC lokal ke VPS stabil.

### Opsi E: Menggunakan Cloudflare Tunnel (Sangat Direkomendasikan! ⭐)
Jika Anda ingin menggunakan **domain kustom** (seperti `hris.perusahaan.com`) secara gratis tanpa memerlukan IP publik statis, tanpa VPN tambahan, dan **tidak perlu membuka port pada router/firewall PC Server Anda**, maka **Cloudflare Tunnel (`cloudflared`)** adalah metode terbaik, paling aman, dan paling praktis.

#### Kenapa Cloudflare Tunnel sangat cocok untuk aplikasi ini?
1. **Otomatis HTTPS (SSL Gratis):** Fitur kamera dan deteksi lokasi (*geolocation* / GPS) pada browser HP modern **wajib menggunakan koneksi aman (HTTPS)**. Jika Anda menggunakan HTTP biasa, browser HP karyawan akan memblokir fitur absensi GPS & kamera. Cloudflare otomatis memberikan sertifikat SSL resmi sehingga HTTPS langsung aktif!
2. **Keamanan Maksimal (Tanpa IP Publik):** PC Server lokal Anda terlindungi sepenuhnya karena tidak perlu mengekspos IP publik atau membuka port router ke internet. Trafik dilewatkan secara aman melalui koneksi tunnel keluar (*outbound*).
3. **Gratis:** Layanan Zero Trust Tunnel dari Cloudflare ini 100% gratis.

#### Langkah-langkah Setup Cloudflare Tunnel:
1. **Persiapan Domain:** Pastikan Anda memiliki domain yang DNS-nya sudah dihubungkan ke akun **[Cloudflare](https://dash.cloudflare.com/)** Anda (misalnya `perusahaan.com`).
2. **Masuk ke Dashboard Zero Trust:**
   - Buka Cloudflare Dashboard, lalu pilih menu **Zero Trust** di bilah sisi kiri.
   - Pilih menu **Networks** -> **Tunnels** -> klik **Create a Tunnel**.
   - Pilih **Cloudflared** lalu klik *Next*.
   - Beri nama tunnel Anda (contoh: `hris-gtp-server`) lalu klik *Save tunnel*.
3. **Install Connector (`cloudflared`) di PC Server Anda:**
   - Cloudflare akan memberikan instruksi perintah instalasi (*command*) sesuai sistem operasi PC Server Anda (Windows / Linux / macOS).
   - *Contoh untuk Windows:* Unduh file `.exe` yang disediakan, lalu jalankan perintah instalasi layanan (*service*) melalui Command Prompt (Admin) sesuai script yang dicantumkan di halaman Cloudflare tersebut.
   - Setelah terinstal dan berjalan, status connector di dashboard Cloudflare akan berubah menjadi **Active (Online)**. Klik *Next*.
4. **Hubungkan ke Aplikasi Web Lokal:**
   - Di bagian **Route Traffic**, masukkan subdomain dan domain yang ingin Anda gunakan:
     - Subdomain: `hris`
     - Domain: `perusahaan.com` (sehingga alamatnya menjadi `hris.perusahaan.com`)
   - Di kolom **Service**, pilih:
     - Type: `HTTP`
     - URL: `localhost:3000` (atau IP lokal PC Server Anda jika diakses lewat komputer lain di jaringan).
   - Klik **Save Tunnel**.
5. **Selesai!**
   - Jalankan server HRIS Anda di PC lokal dengan `npm start` setelah di-build.
   - Sekarang, buka **`https://hris.perusahaan.com`** di HP atau browser luar. Aplikasi web korporat Anda sudah aktif, terlindungi dengan HTTPS, dan siap digunakan untuk absen GPS/Kamera oleh seluruh karyawan di lapangan!


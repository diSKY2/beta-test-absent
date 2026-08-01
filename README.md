# Enterprise Portal - PT. Garuda Trisula Perkasa

Selamat datang di repositori Enterprise Portal PT. Garuda Trisula Perkasa. Proyek ini adalah aplikasi web dan mobile terintegrasi (Full-Stack) untuk manajemen presensi, cuti, lembur, rostering, dan pemantauan HR/Admin.

## 🚀 Teknologi yang Digunakan

*   **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React (Ikon), Recharts (Grafik).
*   **Backend**: Node.js, Express.js.
*   **Database**: PostgreSQL dengan Drizzle ORM.
*   **Mobile App Wrapper**: Capacitor (Android/iOS).
*   **Bahasa**: TypeScript di seluruh ekosistem (Frontend & Backend).

## 📁 Struktur Direktori Utama

*   `src/pages/` - Berisi semua halaman React (Employee Portal, Admin Dashboard, Landing Page, dll).
*   `src/components/` - (Opsional) Komponen UI yang dapat digunakan kembali.
*   `src/db/` - Konfigurasi database, skema Drizzle ORM (`schema.ts`), dan file setup lainnya.
*   `server/` - Berisi file backend, seperti `api.ts` tempat semua rute API Express (REST) dideklarasikan.
*   `server.ts` - Entry point server Node.js / Express untuk production.
*   `android/` - Proyek native Android yang di-generate menggunakan Capacitor.
*   `vite.config.ts` - Konfigurasi build Vite.

## 🛠 Panduan Pengembangan (Untuk Developer)

Agar aplikasi tidak rusak saat dikembangkan, perhatikan panduan berikut:

### 1. Menambahkan Fitur API Baru
Jika Anda perlu menambahkan endpoint backend baru, tambahkan di dalam file `server/api.ts`.
Pastikan Anda mematuhi struktur yang sudah ada (menggunakan `apiRouter` dari express) dan menggunakan `db` dari `drizzle-orm` untuk query ke database.

### 2. Mengubah Struktur Database
Aplikasi ini menggunakan **Drizzle ORM**.
*   **JANGAN** mengubah database secara manual melalui SQL client (kecuali keadaan darurat).
*   Lakukan perubahan skema di `src/db/schema.ts`.
*   Terapkan perubahan ke database dengan menjalankan perintah:
    ```bash
    npm run db:push
    ```

### 3. Mengembangkan Halaman UI (Frontend)
Halaman utama dibagi menjadi `EmployeePortal.tsx` (untuk pegawai) dan folder `admin/` (untuk HRD/Admin).
*   Pastikan tidak menghapus variabel state penting terkait autentikasi (seperti `useAuth`).
*   Untuk styling, gunakan utility classes **Tailwind CSS**. Hindari menambahkan file CSS kustom baru (`.css`) kecuali untuk variabel global di `index.css`.

### 4. Build ke Aplikasi Android (Mobile)
Aplikasi ini menggunakan Capacitor. Untuk mengupdate aplikasi Android (misal mengubah versi atau icon):
1.  Pastikan build web frontend berhasil: `npm run build`
2.  Sinkronisasikan file build web ke proyek Android: `npx cap sync`
3.  Untuk mengubah versi aplikasi Android, ubah `versionCode` dan `versionName` di `android/app/build.gradle`.
4.  Buka Android Studio untuk build APK: `npx cap open android`

## 📜 Skrip NPM yang Tersedia

*   `npm run dev` - Menjalankan environment development (TSX untuk backend & Vite middleware untuk frontend).
*   `npm run build` - Build production (mem-bundle frontend dengan Vite, dan backend dengan esbuild).
*   `npm start` - Menjalankan hasil build production (Node.js).
*   `npm run db:push` - Mendorong update skema dari `schema.ts` ke database PostgreSQL.
*   `npm run db:studio` - Membuka GUI Drizzle Studio untuk mengelola isi database secara visual.

## ⚠️ Perhatian Khusus

*   **Autentikasi & Otorisasi**: Terdapat fungsi proteksi route di frontend (`ProtectedRoute`) dan backend tidak menggunakan JWT kompleks tapi memverifikasi berdasarkan struktur database yang ada. Pastikan logic user/admin ini tidak dirusak saat menambahkan halaman baru.
*   **State Management Lokal**: Beberapa komponen besar (seperti `EmployeePortal.tsx`) memiliki manajemen state yang kompleks menggunakan Hooks (`useState`, `useEffect`). Pahami flow data fetch-nya sebelum melakukan modifikasi.

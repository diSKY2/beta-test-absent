# Instruksi Tambahan untuk AI Agent (AGENTS.md)

Hai AI Assistant! Saat Anda diminta untuk mengembangkan, memodifikasi, atau melakukan perbaikan pada aplikasi **PT. Garuda Trisula Perkasa** ini, HARAP patuhi aturan ketat berikut agar tidak merusak fungsionalitas yang sudah ada:

## 1. Arsitektur Full-Stack (Vite + Express)
*   **Aplikasi ini BUKAN sekadar SPA biasa**. Aplikasi ini memiliki custom server backend Express di `server.ts` dan logic API-nya terpusat di `server/api.ts`.
*   Semua pengambilan data (`fetch`) di frontend HARUS mengarah ke endpoint yang didefinisikan di `server/api.ts` atau endpoint eksternal yang sah.
*   **PENTING**: Saat melakukan modifikasi backend (`server/api.ts`), pastikan untuk melakukan tes integrasi. Selalu kembalikan respons berupa `res.json(...)`. Jangan rusak format JSON API karena akan mematahkan frontend.

## 2. Penggunaan Database (Drizzle ORM & PostgreSQL)
*   Aplikasi ini menggunakan **PostgreSQL** dan **Drizzle ORM**.
*   **JANGAN PERNAH** merubah skema atau melakukan kueri SQL mentah untuk mengubah struktur tabel. Semua skema harus direfleksikan di `src/db/schema.ts`.
*   Bila ada penambahan/perubahan skema, Anda harus menambahkan di `src/db/schema.ts` dan jalankan command `npm run db:push`.

## 3. UI/UX Frontend & Tailwind
*   Bila user meminta update UI, jaga *strictness* pada style **Tailwind CSS**. 
*   **Jangan memecah komponen besar secara sembarangan** jika hanya untuk menambah satu text atau merubah layout kecil (misalnya di `EmployeePortal.tsx` yang mengelola banyak state sekaligus). 
*   Pastikan menjaga layout "Mobile-First" karena aplikasi ini dikonversi ke APK via Capacitor.

## 4. Sistem Presensi dan Shift
*   Perhatikan bahwa logic **"Tukar Jadwal" (Shift Exchanges)** dan **"Schedules"** saling terhubung kuat di backend. (lihat endpoint `/api/schedules/employee/:id` di `server/api.ts`). Modifikasi pada bagian tersebut harus dilakukan dengan hati-hati.

## 5. Mobile / Capacitor
*   Jika diminta mengubah versi aplikasi Android, ubah `versionCode` dan `versionName` hanya di dalam file `android/app/build.gradle`.

Terima kasih karena telah menjadi asisten koding yang teliti dan selalu menggunakan mode *Read-Before-Write* (`view_file` atau `grep`) sebelum mengedit file!

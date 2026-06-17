# Panduan Migrasi Aplikasi dari Firebase ke MySQL + Express Backend

Aplikasi HRD BOS Panel ini saat ini dibangun menggunakan arsitektur **Serverless** penuh, dengan **Firebase (Firestore + Authentication)** sebagai sistem database utama yang langsung berkomunikasi dengan Frontend berbasis React (Vite).

Untuk beralih menggunakan pangkalan data **MySQL**, Anda perlu membangun jembatan (Backend Server) sebab arsitektur aplikasi berbasis peramban (frontend) **TIDAK BOLEH** terkoneksi ke MySQL secara langsung demi alasan keamanan.

Berikut adalah panduan lengkap apa saja yang dibutuhkan dan cara setup untuk memigrasikannya.

## 1. Setup Database MySQL

1. Buka database management (phpMyAdmin, DBeaver, TablePlus, atau CLI MySQL).
2. Buat database baru bernama `hrdbospanel` (atau nama lain):
   ```sql
   CREATE DATABASE hrdbospanel;
   USE hrdbospanel;
   ```
3. Eksekusi script SQL yang disediakan pada file `mysql-schema.sql` (buka file tersebut di editor, salin semua, lalu eksekusi di database management anda). Ini akan membuat skema tabel secara lengkap, termasuk berelasi.

## 2. Membuat Backend / API (Express.js)

Karena kode sekarang (Frontend React) menggunakan Firebase, kita harus menyediakan Backend Node.js dengan framework `Express` dan Library ORM (misalnya `Prisma`, `Sequelize`, atau kueri `mysql2` biasa) sebagai pengganti Firestore.

1. Inisialisasi Backend:
   ```bash
   mkdir backend && cd backend
   npm init -y
   npm install express cors dotenv mysql2
   ```

2. Buat file `server.js` untuk menyediakan Endpoint. Semua proses membaca, menambah, mengubah, dan menghapus (CRUD) akan di-handle oleh route di file ini. Contoh:

   ```javascript
   require('dotenv').config();
   const express = require('express');
   const cors = require('cors');
   const mysql = require('mysql2/promise');

   const app = express();
   app.use(cors());
   app.use(express.json());

   // Konfigurasi Database
   const pool = mysql.createPool({
     host: process.env.DB_HOST || 'localhost',
     user: process.env.DB_USER || 'root',
     password: process.env.DB_PASSWORD || '',
     database: process.env.DB_NAME || 'hrdbospanel'
   });

   // Contoh Endpoint Ambil Data Pegawai
   app.get('/api/employees', async (req, res) => {
     try {
       const [rows] = await pool.query('SELECT * FROM employees');
       res.json(rows);
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });

   // Contoh Endpoint Hapus Data Pegawai
   app.delete('/api/employees/:id', async (req, res) => {
     try {
       await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
       res.json({ message: 'Deleted successfully' });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });

   app.listen(3000, () => console.log('Server runs on port 3000'));
   ```

## 3. Apa yang perlu diubah di Kode Export React?

Kode sumber frontend React di folder `src/pages/admin/` saat ini penuh dengan implementasi Firebase. Anda perlu membuangnya dan menggantinya dengan panggilan `fetch()` atau `axios` ke backend lokal (biasanya mengarah ke `http://localhost:3000/api/...`).

### A. Hapus dependensi Firebase dari komponen
Contoh di `src/pages/admin/OrgStructure.tsx`:

*Sebelum (Firebase):*
```javascript
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const fetchEmployees = async () => {
   const qs = await getDocs(collection(db, 'employees'));
   const data = qs.docs.map(d => ({ id: d.id, ...d.data() }));
   setEmployees(data);
};
```

*Sesudah (API Fetch MySQL Backend):*
```javascript
const fetchEmployees = async () => {
   const res = await fetch('http://localhost:3000/api/employees');
   const data = await res.json();
   setEmployees(data);
};
```

### B. Setup Authentication
Saat ini otentikasi login diproses melalui `firebase/auth`. Anda butuh mengubah pendaftaran dan konfirmasi kata sandi ke sistem **JWT (JSON Web Token)** di Express Backend, dikombinasikan dengan hashing dari token sandi menggunakan fungsi `bcrypt`.

## Ringkasan Langkah Penerapan Migrasi:
1. Pastikan Anda sudah menginstall Database MySQL Server dan mengisinya dengan kerangka dari `mysql-schema.sql`.
2. Buat Backend (Express.js) menggunakan contoh di atas dan buat route yang bersesuaian untuk setiap interaksi data: Pengumuman, Galeri, Geofencing, Organisasi (Cabang/Regu/Pegawai), Approvals (Izin/Lembur/Kehadiran), dan Rostering (Jadwal).
3. Hapus Firebase configuration (`src/lib/firebase.ts`) setelah backend siap.
4. Ganti seluruh fungsi `onSnapshot`, `setDoc`, `addDoc`, `deleteDoc`, `query`, dari library `firebase/firestore` dan panggil endpoint API menggunakan `fetch` di Frontend. Silakan lihat **`MIGRASI_EXAMPLE_OrgStructure.tsx`** yang ada di direktori root project untuk melihat contoh nyata hasil perubahan kodenya.

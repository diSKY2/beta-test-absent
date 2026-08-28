const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/CMS.tsx', 'utf8');

const target = `<p className="text-xs text-slate-600 mt-1 mb-6">Unggah versi terbaru dari aplikasi Android (.apk) agar pegawai dapat mengunduhnya langsung dari dalam aplikasi tanpa melalui web.</p>`;

const replacement = `<p className="text-xs text-slate-600 mt-1 mb-2">Unggah versi terbaru dari aplikasi Android (.apk) agar pegawai dapat mengunduhnya langsung dari dalam aplikasi tanpa melalui web.</p>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
               <h4 className="text-xs font-bold text-blue-900 mb-1">🍎 Info untuk Pengguna iOS (iPhone/iPad):</h4>
               <p className="text-[11px] text-blue-800">Untuk perangkat Apple, bagikan link portal ini ke pegawai. Minta mereka membukanya di <b>Safari</b>, lalu tekan <b>Share &gt; Add to Home Screen</b>. Aplikasi akan otomatis selalu menggunakan versi web terbaru (PWA) tanpa perlu update APK.</p>
            </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/admin/CMS.tsx', content);

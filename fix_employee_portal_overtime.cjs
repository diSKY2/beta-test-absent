const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf-8');

const regexOvertime = /const res = await fetch\(API_BASE_URL \+ '\/api\/sql\/rpc', \{\n\s*method: 'POST',\n\s*headers: \{ 'Content-Type': 'application\/json' \},\n\s*body: JSON\.stringify\(payload\)\n\s*\}\);/;

const replacementOvertime = `const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
         // Auto approve overtime behavior requested
         // Wait, the previous sed might have already covered this or we just updated the status to Approved?
         // Ah, wait. The user asked "pengajuan lembur dan izin otomatis di approve sekarang, tapi hrd bisa menolak izin atau lemburnya jadi pegawai bisa dibatalkan jadwal libur karena izin sama lemburnya"
      }`;

// Wait, earlier I did sed to replace status: 'Pending' with 'Approved'. Let's verify that.

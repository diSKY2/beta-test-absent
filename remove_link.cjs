const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');
code = code.replace(/<div className="mt-5 text-center">\s*<a href="\/register" className="text-xs font-semibold text-\[#0C2461\] hover:text-blue-800 underline decoration-\[#0C2461\]\/30 underline-offset-4">\s*Belum punya akun\? Daftar Pegawai Baru\s*<\/a>\s*<\/div>/, '');
fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

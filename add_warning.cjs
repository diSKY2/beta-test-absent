const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(
  /\<div className="space-y-2"\>\s*\{getAttendanceButtonState\(\)\.isEnabled \? \(/g,
  `<div className="space-y-2">\n                          {todayAttendance?.status === 'Ditolak' && (\n                            <div className="w-full bg-rose-50 text-rose-600 py-3 px-4 rounded-xl text-xs font-bold border border-rose-200 mb-2 flex flex-col items-center justify-center text-center">\n                              <span>Absen sebelumnya ditolak.</span>\n                              <span className="font-normal text-[10px]">Silakan melakukan absen masuk kembali.</span>\n                            </div>\n                          )}\n                          {getAttendanceButtonState().isEnabled ? (`
);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

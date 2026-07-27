const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(
  /\) : \!todayAttendance \? \(/g,
  `) : (!todayAttendance || todayAttendance.status === 'Ditolak') ? (`
);

code = code.replace(
  /\) : \!todayAttendance\.timeOut \? \(/g,
  `) : (!todayAttendance.timeOut && todayAttendance.status !== 'Ditolak') ? (`
);

code = code.replace(
  /handleOpenAttendanceModal\(\!todayAttendance \? 'masuk' : 'pulang'\);/g,
  `handleOpenAttendanceModal(!todayAttendance || todayAttendance.status === 'Ditolak' ? 'masuk' : 'pulang');`
);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

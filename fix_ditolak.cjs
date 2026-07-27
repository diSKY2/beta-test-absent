const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// 1. Show the "Masuk Shift" button if attendance is 'Ditolak'
code = code.replace(
  /\} else if \(!todayAttendance\) \{/,
  `} else if (!todayAttendance || todayAttendance.status === 'Ditolak') {`
);

code = code.replace(
  /\} else if \(!todayAttendance.timeOut\) \{/,
  `} else if (!todayAttendance.timeOut && todayAttendance.status !== 'Ditolak') {`
);

code = code.replace(
  /handleOpenAttendanceModal\(!todayAttendance \? 'masuk' : 'pulang'\);/,
  `handleOpenAttendanceModal(!todayAttendance || todayAttendance.status === 'Ditolak' ? 'masuk' : 'pulang');`
);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

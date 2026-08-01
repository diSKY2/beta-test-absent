const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

// Fix pie chart and summary stats to only look at dateFrom
code = code.replace(
  `const visibleAttendances = attendances.filter(isAttendanceInSelectedLocation);`,
  `const visibleAttendances = attendances.filter(isAttendanceInSelectedLocation).filter(a => a.date === dateFrom);`
);

code = code.replace(
  `const expectedTotal = filteredEmployees.length * activeDaysCount;`,
  `const expectedTotal = filteredEmployees.length;`
);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

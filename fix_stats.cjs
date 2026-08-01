const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

const oldStats = `  const recorded = hadir + izin + sakit;
  const expectedTotal = filteredEmployees.length;
  let calculatedAlpa = expectedTotal - recorded;
  if (calculatedAlpa < 0 || expectedTotal === 0) calculatedAlpa = 0;`;

const newStats = `  let offDaysCount = 0;
  filteredEmployees.forEach(emp => {
    const hasAtt = visibleAttendances.some(a => a.employeeId === emp.id);
    if (!hasAtt) {
      const sched = schedules.find(s => s.employeeId === emp.id && s.dateFormatted === dateFrom);
      if (sched && sched.isOffDay) {
        offDaysCount++;
      }
    }
  });

  const recorded = hadir + izin + sakit + offDaysCount;
  const expectedTotal = filteredEmployees.length;
  let calculatedAlpa = expectedTotal - recorded;
  if (calculatedAlpa < 0 || expectedTotal === 0) calculatedAlpa = 0;`;

code = code.replace(oldStats, newStats);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

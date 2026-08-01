const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

const oldLocStats = `            const locBelumAbsen = Math.max(0, locEmployees.length - (locHadir + locIzinSakit));`;
const newLocStats = `            let locOffCount = 0;
            locEmployees.forEach(emp => {
              const hasAtt = locAttendances.some(a => a.employeeId === emp.id);
              if (!hasAtt) {
                const sched = schedules.find(s => s.employeeId === emp.id && s.dateFormatted === dateFrom);
                if (sched && sched.isOffDay) locOffCount++;
              }
            });
            const locBelumAbsen = Math.max(0, locEmployees.length - (locHadir + locIzinSakit + locOffCount));`;

code = code.replace(oldLocStats, newLocStats);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

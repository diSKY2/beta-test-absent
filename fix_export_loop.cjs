const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

const oldLoop = `          dates.forEach(d => {
              const att = allAttendances.find(a => (a.employeeId === emp.id || a.employeeId === emp.name) && a.date === d);
              
              if (att) {
                  row.push(att.timeIn || '');
                  row.push(att.timeOut || '');
                  row.push(''); // lembur masuk
                  row.push(''); // lembur pulang
                  row.push(att.status || 'Hadir');
                  const statusStr = (att.status || '').toLowerCase();
                  if (statusStr === 'hadir') masuk++;
                  if (att.isLate) telat++;
                  if (statusStr === 'izin' || statusStr === 'sakit') izinCount++;
                  if (statusStr === 'alpa') alpaCount++;
              } else {
                  row.push('', '', '', '', '');
                  alpaCount++;
              }
          });`;

const newLoop = `          dates.forEach(d => {
              const att = allAttendances.find(a => (a.employeeId === emp.id || a.employeeId === emp.name) && a.date === d);
              const sched = schedules.find(s => s.employeeId === emp.id && s.dateFormatted === d);
              
              if (att) {
                  row.push(att.timeIn || '');
                  row.push(att.timeOut || '');
                  row.push(''); // lembur masuk
                  row.push(''); // lembur pulang
                  row.push(att.status || 'Hadir');
                  const statusStr = (att.status || '').toLowerCase();
                  if (statusStr === 'hadir') masuk++;
                  if (att.isLate) telat++;
                  if (statusStr === 'izin' || statusStr === 'sakit') izinCount++;
                  if (statusStr === 'alpa') alpaCount++;
              } else if (sched && sched.isOffDay) {
                  row.push('', '', '', '', 'Libur');
              } else {
                  row.push('', '', '', '', 'Tanpa Keterangan (Alpa)');
                  alpaCount++;
              }
          });`;

code = code.replace(oldLoop, newLoop);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

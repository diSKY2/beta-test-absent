const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

const oldFallback = `                                               const a = attendances.find(attn => attn.date === dateFrom && attn.employeeId === emp.id) || {
                                                 status: 'Belum Absen',
                                                 employeeId: emp.id,
                                                 date: dateFrom
                                               };`;
                                               
const newFallback = `                                               let defaultStatus = 'Belum Absen';
                                               const sched = schedules.find(s => s.employeeId === emp.id && s.dateFormatted === dateFrom);
                                               if (sched && sched.isOffDay) defaultStatus = 'Libur / Off';
                                               
                                               const a = attendances.find(attn => attn.date === dateFrom && attn.employeeId === emp.id) || {
                                                 status: defaultStatus,
                                                 employeeId: emp.id,
                                                 date: dateFrom
                                               };`;

code = code.replace(oldFallback, newFallback);
fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

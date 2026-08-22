const http = require('http');

const payload = {
  action: 'addDoc',
  collection: 'attendances',
  data: {
    employeeId: 'emp-1',
    attendanceDate: new Date('2026-08-01T10:00:00Z').toISOString(),
    status: 'Hadir',
    timeIn: '08:00',
    timeOut: '17:00'
  }
};

const req = http.request('http://127.0.0.1:3000/api/sql/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': JSON.stringify(payload).length }
}, (res) => {
  res.on('data', () => {});
  res.on('end', () => console.log('Seeded'));
});
req.write(JSON.stringify(payload));
req.end();

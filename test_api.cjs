const http = require('http');

const data = JSON.stringify({
  dateFrom: '2026-08-01',
  dateTo: '2026-08-18'
});

const req = http.request('http://127.0.0.1:3000/api/admin/monitoring-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const json = JSON.parse(body);
    console.log('Attendances count:', json.attendances ? json.attendances.length : 0);
    if(json.attendances && json.attendances.length > 0) {
       console.log('First:', json.attendances[0].attendanceDate, 'Last:', json.attendances[json.attendances.length-1].attendanceDate);
    }
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();

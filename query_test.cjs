const http = require('http');

const payload = {
  dateFrom: '2026-08-01',
  dateTo: '2026-08-18'
};

const req = http.request('http://127.0.0.1:3000/api/admin/monitoring-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': JSON.stringify(payload).length }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
req.write(JSON.stringify(payload));
req.end();

const http = require('http');
const data = JSON.stringify({ dateFrom: '2000-01-01', dateTo: '2099-12-31' });
const req = http.request('http://127.0.0.1:3000/api/admin/monitoring-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('All attendances count:', JSON.parse(body).attendances?.length));
});
req.write(data);
req.end();

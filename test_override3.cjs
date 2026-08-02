const http = require('http');

const data = JSON.stringify({
  action: 'setDoc',
  collection: 'subdept_schedule_overrides',
  docId: 'sub1_2026-08-01',
  data: {
    subDepartmentId: 'sub1',
    overrideDate: '2026-08-01',
    shiftTypeId: 'shift1',
    updatedAt: Date.now()
  }
});

const req = http.request('http://127.0.0.1:3000/api/sql/rpc', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();

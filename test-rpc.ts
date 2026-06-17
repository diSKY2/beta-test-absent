import http from 'http';

const data = JSON.stringify({
  action: 'getDocs',
  collection: 'locations'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/sql/rpc',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let chunks = '';
  res.on('data', d => chunks += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', chunks));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();

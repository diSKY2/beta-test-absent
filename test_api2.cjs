async function test() {
  const { fetch } = await import('node-fetch');
  const res = await fetch('http://127.0.0.1:3000/api/admin/monitoring-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateFrom: '2026-08-01',
      dateTo: '2026-08-01'
    })
  });
  console.log(await res.text());
}
test();

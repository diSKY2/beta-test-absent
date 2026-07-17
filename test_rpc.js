import fetch from 'node-fetch';

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/sql/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getDocs', collection: 'employees' })
    });
    const text = await res.text();
    console.log("Status:", res.status, "Body:", text);
  } catch (e) {
    console.log("Error:", e);
  }
}
run();

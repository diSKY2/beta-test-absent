const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Approvals.tsx', 'utf8');
code = code.replace(
  `fetch(import.meta.env.VITE_API_BASE_URL + '/api/shift-exchanges/pending-danru')`,
  `fetch((import.meta.env.VITE_API_BASE_URL || "") + '/api/shift-exchanges/pending-danru')`
);
code = code.replace(
  `const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/shift-exchanges/' + id + '/status', {`,
  `const res = await fetch((import.meta.env.VITE_API_BASE_URL || "") + '/api/shift-exchanges/' + id + '/status', {`
);
code = code.replace(
  `await fetch(import.meta.env.VITE_API_BASE_URL + '/api/sql/rpc', {`,
  `await fetch((import.meta.env.VITE_API_BASE_URL || "") + '/api/sql/rpc', {`
);
fs.writeFileSync('src/pages/admin/Approvals.tsx', code);

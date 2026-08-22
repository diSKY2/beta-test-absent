const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

code = code.replace(
  `const last = new Date(dateTo >= dateFrom ? dateTo : dateFrom + 'T00:00:00');`,
  `const last = new Date((dateTo >= dateFrom ? dateTo : dateFrom) + 'T00:00:00');`
);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

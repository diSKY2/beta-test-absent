const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

code = code.replace(/new Date\(dateFrom \+ 'T12:00:00Z'\)/g, "new Date(dateFrom + 'T00:00:00')");
code = code.replace(/new Date\(dateTo \+ 'T12:00:00Z'\)/g, "new Date(dateTo >= dateFrom ? dateTo : dateFrom + 'T00:00:00')"); // Wait, dateTo in handleExport
code = code.replace(/new Date\(startStr \+ 'T12:00:00Z'\)/g, "new Date(startStr + 'T00:00:00')");
code = code.replace(/new Date\(endStr \+ 'T12:00:00Z'\)/g, "new Date(endStr + 'T00:00:00')");

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

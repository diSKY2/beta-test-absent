const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');
code = code.replace(
  `const { dateFrom, dateTo } = req.body;`,
  `const { dateFrom, dateTo } = req.body;
    
    // Konversi string YYYY-MM-DD ke Date
    const fromDate = dateFrom ? new Date(dateFrom + 'T00:00:00.000Z') : new Date();
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59.999Z') : new Date();`
);
code = code.replace(
  `gte(attendances.attendanceDate, dateFrom),`,
  `gte(attendances.attendanceDate, fromDate),`
);
code = code.replace(
  `lte(attendances.attendanceDate, dateTo)`,
  `lte(attendances.attendanceDate, toDate)`
);
fs.writeFileSync('server/api.ts', code);

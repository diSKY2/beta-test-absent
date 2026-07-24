const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(/employee\.id/g, 'currentEmployee.id');
code = code.replace(/employee\?/g, 'currentEmployee?');
code = code.replace(/employee\./g, 'currentEmployee.');

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf-8');

code = code.replace(/status: 'Pending'/g, "status: 'Approved'");

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log('Done');

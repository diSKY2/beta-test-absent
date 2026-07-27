const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(/export default EmployeePortal;\n?$/, '');
fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// I inserted \n literally as text. Let's find "\nimport" and replace with actual newline.
code = code.replace(/\\n/g, '\n');

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

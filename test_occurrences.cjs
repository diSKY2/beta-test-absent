const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');
const occurrences = code.split(`      </div>\n    </div>\n  );\n}`).length - 1;
console.log('Occurrences:', occurrences);

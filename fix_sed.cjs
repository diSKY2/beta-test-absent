const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(/<Search, ArrowRight, X/g, '<Search');
code = code.replace(/memberSearch, ArrowRight, XQuery/g, 'memberSearchQuery');
code = code.replace(/setMemberSearch, ArrowRight, XQuery/g, 'setMemberSearchQuery');
code = code.replace(/import \{ Search, ArrowRight, X /g, 'import { Search, ArrowRight, X '); // this is fine if it matched the import line
code = code.replace(/Search, ArrowRight, X/g, 'Search');

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

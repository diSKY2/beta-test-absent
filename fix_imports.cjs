const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(/import \{([^\}]+)\} from 'lucide-react';/, "import { $1, ArrowRight, X } from 'lucide-react';");

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

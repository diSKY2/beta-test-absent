const fs = require('fs');

// 1. Fix EmployeePortal.tsx
let emp = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf-8');
const isDanruPanelRegex = /\{isDanru && allSubDeptEmployees\.length > 0 && \(/;
const isDanruPanelReplacement = `{(currentEmployee?.role && (currentEmployee.role.toLowerCase().includes('ketua') || currentEmployee.role.toLowerCase().includes('leader') || currentEmployee.role.toLowerCase().includes('danru') || currentEmployee.role.toLowerCase().includes('chief') || currentEmployee.role.toLowerCase().includes('waka'))) && allSubDeptEmployees.length > 0 && (`;
emp = emp.replace(isDanruPanelRegex, isDanruPanelReplacement);
fs.writeFileSync('src/pages/EmployeePortal.tsx', emp);

// 2. Fix Rostering.tsx
let rostering = fs.readFileSync('src/pages/admin/Rostering.tsx', 'utf-8');
if (!rostering.includes('CheckCircle2')) {
    rostering = rostering.replace(/import \{ (.*) \} from 'lucide-react';/, (match, p1) => {
        return `import { ${p1}, CheckCircle2 } from 'lucide-react';`;
    });
} else {
    // If it includes it but maybe in JSX and not in import
    const importMatch = rostering.match(/import \{ (.*) \} from 'lucide-react';/);
    if (importMatch && !importMatch[1].includes('CheckCircle2')) {
        rostering = rostering.replace(/import \{ (.*) \} from 'lucide-react';/, (match, p1) => {
            return `import { ${p1}, CheckCircle2 } from 'lucide-react';`;
        });
    }
}
fs.writeFileSync('src/pages/admin/Rostering.tsx', rostering);

console.log('Done');

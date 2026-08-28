const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const target = `        // 3. Resolve active/today attendance
        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');`;
const replacement = `        // 3. Resolve active/today attendance
        const todayStr = format(now, 'yyyy-MM-dd');`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
console.log('Fixed now successfully');

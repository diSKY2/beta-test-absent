const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const target = `const isIncompleteRecent = !a.timeOut && a.status !== 'Ditolak' && (now.getTime() - aDate.getTime()) <= 36 * 60 * 60 * 1000;`;
const replacement = `const isIncompleteRecent = !a.timeOut && a.status !== 'Ditolak';`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
console.log('Fixed activeTeam successfully');

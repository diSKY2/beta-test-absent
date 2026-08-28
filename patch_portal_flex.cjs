const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// Replace Jam Tugas logic for Flexible shift
content = content.replace(
  `Jam Tugas: {sch.shiftStart || '08:00'} s/d {sch.shiftEnd || '16:00'} WIB`,
  `Jam Tugas: {sch.isFlexible ? 'Bebas (Flexible Time)' : \`\${sch.shiftStart || '08:00'} s/d \${sch.shiftEnd || '16:00'} WIB\`}`
);

// We should also check the header banner. There is usually a place that says:
// scheduleDetails.shiftName ...
// Let's search for "Jam Tugas" globally in the file to catch others.

fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
console.log('Patched EmployeePortal.tsx');

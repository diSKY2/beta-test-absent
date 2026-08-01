const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf-8');

const regexLeave = /const res = await fetch\(API_BASE_URL \+ '\/api\/sql\/rpc', \{\n\s*method: 'POST',\n\s*headers: \{ 'Content-Type': 'application\/json' \},\n\s*body: JSON\.stringify\(payload\)\n\s*\}\);/;

const replacementLeave = `const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
         const datePart = new Date(leaveDate).toISOString().split('T')[0];
         const attId = \`\${currentEmployee.id}_\${datePart}\`;
         await fetch(API_BASE_URL + '/api/sql/rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               action: 'setDoc',
               collection: 'attendances',
               docId: attId,
               data: {
                  employeeId: currentEmployee.id,
                  attendanceDate: new Date(leaveDate),
                  status: leaveType,
                  type: 'Leave',
                  reason: leaveReason
               },
               options: { merge: true }
            })
         });
      }`;

code = code.replace(regexLeave, replacementLeave);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log('Done');

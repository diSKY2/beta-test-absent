const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf-8');

const regex = /const exchanges = await db\.select\(\)\.from\(shiftExchanges\)[\s\S]*?\.where\(and\(eq\(shiftExchanges\.status, 'Approved'\), or\(eq\(shiftExchanges\.requesterId, id\), eq\(shiftExchanges\.replacerId, id\)\)\)\);/;

const replacement = `
    const exchanges = await db.select().from(shiftExchanges)
      .where(and(eq(shiftExchanges.status, 'Approved'), or(eq(shiftExchanges.requesterId, id), eq(shiftExchanges.replacerId, id))));

    const leaves = await db.select().from(leaveRequests)
      .where(and(eq(leaveRequests.employeeId, id), eq(leaveRequests.status, 'Approved')));
      
    const overtimes = await db.select().from(overtimeRequests)
      .where(and(eq(overtimeRequests.employeeId, id), eq(overtimeRequests.status, 'Approved')));
`;

code = code.replace(regex, replacement);

const loopRegex = /const activeShift = await getRawShiftForSubDept\(emp\.subDepartmentId, targetDate, dateStr\);\n\s*if \(activeShift\) \{/;

const loopReplacement = `
      const isLeave = leaves.find(l => new Date(l.requestDate).toISOString().split('T')[0] === dateStr);
      if (isLeave) {
        computed.push({
          id: 'leave-' + dateStr,
          date: targetDate.toISOString(),
          shiftName: isLeave.type || 'Cuti/Izin',
          isOffDay: true
        });
        continue;
      }
      
      const isOvertime = overtimes.find(o => new Date(o.requestDate).toISOString().split('T')[0] === dateStr);
      
      const activeShift = await getRawShiftForSubDept(emp.subDepartmentId, targetDate, dateStr);
      if (activeShift) {
        if (isOvertime && activeShift.isOffDay) {
          computed.push({
            id: 'ot-' + dateStr,
            date: targetDate.toISOString(),
            shiftName: 'Lembur',
            shiftStart: '08:00', // default, could be dynamic based on overtime duration but we just need them to clock in
            shiftEnd: '17:00',
            isOffDay: false
          });
          continue;
        }
`;

code = code.replace(loopRegex, loopReplacement);
fs.writeFileSync('server/api.ts', code);
console.log('Done');

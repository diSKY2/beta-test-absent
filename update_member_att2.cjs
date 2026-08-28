const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const oldFuncStart = `  const getMemberTodayAttendance = (memberId: string) => {`;
const oldFuncEnd = `return recentIncomplete || undefined;
  };`;

const regex = new RegExp('const getMemberTodayAttendance = \\(memberId: string\\) => \\{[\\s\\S]*?return recentIncomplete \\|\\| undefined;\\n  \\};');
const match = content.match(regex);

if (match) {
  const replacement = `const getMemberTodayAttendance = (memberId: string) => {
    const memberAtts = teamAttendances.filter(a => a.employeeId === memberId);
    
    // Find latest incomplete
    const incomplete = memberAtts
      .filter(a => a.timeIn && !a.timeOut && a.status !== 'Ditolak')
      .sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime())[0];
      
    if (incomplete) {
       return incomplete;
    }

    // Otherwise, today's attendance
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return memberAtts.find(a => {
      const aDateStr = typeof a.attendanceDate === 'string' ? a.attendanceDate.split('T')[0] : new Date(a.attendanceDate).toISOString().split('T')[0];
      return aDateStr === todayStr;
    }) || undefined;
  };`;
  
  content = content.replace(match[0], replacement);
  fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
  console.log('Replaced getMemberTodayAttendance successfully');
} else {
  console.log('Could not find match for getMemberTodayAttendance');
}

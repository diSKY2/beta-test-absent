const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const regex = new RegExp('const getMemberTodayAttendance = \\(memberId: string\\) => \\{[\\s\\S]*?return recentAtt \\? recentAtt : null;\\n  \\};');
const match = content.match(regex);

if (match) {
  const replacement = `const getMemberTodayAttendance = (memberId: string) => {
    const memberAtts = teamAttendances.filter(a => a.employeeId === memberId);
    
    // Find latest incomplete
    const incomplete = memberAtts
      .filter(a => a.timeIn && !a.timeOut && a.status !== 'Ditolak')
      .sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime())[0];
      
    if (incomplete) {
       // We can just return it. For Danru view, we don't need complex holiday drop logic, 
       // but we'll apply a similar 48h limit or just return it.
       const diffDays = Math.floor((new Date(format(new Date(), 'yyyy-MM-dd')).getTime() - new Date(format(new Date(incomplete.attendanceDate), 'yyyy-MM-dd')).getTime()) / (1000 * 3600 * 24));
       if (diffDays < 2) return incomplete;
    }

    // Otherwise, today's attendance
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return memberAtts.find(a => {
      const aDateStr = typeof a.attendanceDate === 'string' ? a.attendanceDate.split('T')[0] : new Date(a.attendanceDate).toISOString().split('T')[0];
      return aDateStr === todayStr;
    }) || null;
  };`;
  
  content = content.replace(match[0], replacement);
  fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
  console.log('Replaced getMemberTodayAttendance successfully');
} else {
  console.log('Could not find match for getMemberTodayAttendance');
}

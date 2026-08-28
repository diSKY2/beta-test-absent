const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const regex = new RegExp('hasClockedOut: todayAttendance\\?\\.timeOut !== null && todayAttendance\\?\\.timeOut !== undefined,');
const match = content.match(regex);

if (match) {
  const replacement = `hasClockedOut: (() => {
        if (!todayAttendance || !todayAttendance.timeOut) return false;
        const attDateStr = typeof todayAttendance.attendanceDate === 'string' 
            ? todayAttendance.attendanceDate.split('T')[0] 
            : new Date(todayAttendance.attendanceDate).toISOString().split('T')[0];
        return attDateStr === todayStr;
      })(),`;
  
  content = content.replace(match[0], replacement);
  fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
  console.log('Replaced hasClockedOut successfully');
} else {
  console.log('Could not find match for hasClockedOut');
}

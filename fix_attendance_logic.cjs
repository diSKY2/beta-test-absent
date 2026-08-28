const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const oldLogicStart = `        let targetAtt = attData.find((a: any) => {`;
const oldLogicEnd = `        } else {
          setTodayAttendance(null);
        }`;

// We need to replace everything from oldLogicStart to oldLogicEnd with the new logic.
const regex = new RegExp('let targetAtt = attData\\.find\\(\\(a: any\\) => \\{[\\s\\S]*?setTodayAttendance\\(null\\);\\n        \\}');
const match = content.match(regex);
if (match) {
  const replacement = `// 3. Resolve active/today attendance
        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');
        const schedData = data.schedules || [];
        const todaySchedule = schedData.find((sch: any) => sch.date === todayStr);
        const isTodayOffDay = todaySchedule?.isOffDay === true;

        const latestIncomplete = attData
          .filter((a: any) => a.timeIn && !a.timeOut && a.status !== 'Ditolak')
          .sort((a: any, b: any) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime())[0];

        let targetAtt = null;

        if (latestIncomplete) {
          const aDate = new Date(latestIncomplete.attendanceDate);
          const diffCalendarDays = Math.floor((new Date(todayStr).getTime() - new Date(format(aDate, 'yyyy-MM-dd')).getTime()) / (1000 * 3600 * 24));
          
          if (isTodayOffDay && diffCalendarDays >= 2) {
             // Drop it, it's the second day of holiday
             targetAtt = null;
          } else {
             targetAtt = latestIncomplete;
          }
        }

        if (!targetAtt) {
           targetAtt = attData.find((a: any) => {
              const aDateStr = typeof a.attendanceDate === 'string' ? a.attendanceDate.split('T')[0] : new Date(a.attendanceDate).toISOString().split('T')[0];
              return aDateStr === todayStr;
           });
        }

        setTodayAttendance(targetAtt || null);`;
        
  content = content.replace(match[0], replacement);
  fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Could not find match');
}

const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const targetOptimisticHistory = `        setAttendancesHistory(prev => prev.map(a => 
          a.employeeId === targetEmployeeId && new Date(a.attendanceDate).toISOString().split('T')[0] === todayStr
            ? { ...a, timeOut: currentTimeStr, photoUrl: selfiePreview || a.photoUrl }
            : a
        ));`;

const targetOptimisticTeam = `        setTeamAttendances(prev => prev.map(a => 
          a.employeeId === targetEmployeeId && new Date(a.attendanceDate).toISOString().split('T')[0] === todayStr
            ? { ...a, timeOut: currentTimeStr, photoUrl: selfiePreview || a.photoUrl }
            : a
        ));`;

const replacerOptimisticHistory = `        setAttendancesHistory(prev => prev.map(a => 
          a.employeeId === targetEmployeeId && !a.timeOut
            ? { ...a, timeOut: currentTimeStr, photoUrl: selfiePreview || a.photoUrl }
            : a
        ));`;

const replacerOptimisticTeam = `        setTeamAttendances(prev => prev.map(a => 
          a.employeeId === targetEmployeeId && !a.timeOut
            ? { ...a, timeOut: currentTimeStr, photoUrl: selfiePreview || a.photoUrl }
            : a
        ));`;

code = code.replace(targetOptimisticHistory, replacerOptimisticHistory);
code = code.replace(targetOptimisticTeam, replacerOptimisticTeam);

const targetBackgroundSync = `              const memberToday = history.find((a: any) => new Date(a.attendanceDate).toISOString().split('T')[0] === todayStr);
              targetAttId = memberToday?.id;`;

const replacerBackgroundSync = `              let memberToday = history.find((a: any) => new Date(a.attendanceDate).toISOString().split('T')[0] === todayStr);
              
              if (!memberToday) {
                 const now = new Date();
                 const yesterday = new Date(now);
                 yesterday.setDate(yesterday.getDate() - 1);
                 const yy = yesterday.getFullYear();
                 const ym = yesterday.getMonth();
                 const yd = yesterday.getDate();
                 const memberYesterday = history.find((a: any) => {
                   const aDate = new Date(a.attendanceDate);
                   return aDate.getFullYear() === yy && aDate.getMonth() === ym && aDate.getDate() === yd;
                 });
                 if (memberYesterday && !memberYesterday.timeOut) {
                   memberToday = memberYesterday;
                 }
              }
              
              targetAttId = memberToday?.id;`;

code = code.replace(targetBackgroundSync, replacerBackgroundSync);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const oldLogic = `        const todayAtt = attData.find((a: any) => {
          const aDate = new Date(a.attendanceDate);
          return aDate.getFullYear() === y && aDate.getMonth() === m && aDate.getDate() === d;
        });
        if (todayAtt) {
          setTodayAttendance(todayAtt);
        }`;

const newLogic = `        let targetAtt = attData.find((a: any) => {
          const aDate = new Date(a.attendanceDate);
          return aDate.getFullYear() === y && aDate.getMonth() === m && aDate.getDate() === d;
        });

        if (!targetAtt) {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yy = yesterday.getFullYear();
          const ym = yesterday.getMonth();
          const yd = yesterday.getDate();
          const yesterdayAtt = attData.find((a: any) => {
            const aDate = new Date(a.attendanceDate);
            return aDate.getFullYear() === yy && aDate.getMonth() === ym && aDate.getDate() === yd;
          });
          if (yesterdayAtt && !yesterdayAtt.timeOut) {
            targetAtt = yesterdayAtt;
          }
        }

        if (targetAtt) {
          setTodayAttendance(targetAtt);
        } else {
          setTodayAttendance(null);
        }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

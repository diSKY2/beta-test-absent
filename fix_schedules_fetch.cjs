const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// Replace the generation block with fetch
const startGen = `// 2. Compute dynamic 7-day schedule`;
const endGen = `// 3. Fetch today's attendance state`;

const lines = code.split('\\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(startGen)) {
    newLines.push(startGen);
    newLines.push(`
      if (shouldFetchStatic) {
         try {
           const schRes = await fetch(API_BASE_URL + '/api/schedules/employee/' + currentEmployee.id);
           if (schRes.ok) {
              const computedSchedules = await schRes.json();
              // Only show next 7 days in the dashboard
              const today = new Date();
              today.setHours(0,0,0,0);
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);
              
              const dashboardSchedules = computedSchedules.filter((s: any) => {
                 const sDate = new Date(s.date);
                 return sDate >= today && sDate < nextWeek;
              });
              setSchedulesList(dashboardSchedules);
              
              // For myFutureSchedules used in Tukar Jadwal, we can store all 30 days
              const futureSchedules = computedSchedules.filter((s: any) => {
                 const sDate = new Date(s.date);
                 return sDate >= today && !s.isOffDay;
              });
              setMyFutureSchedules(futureSchedules);
           }
         } catch(e) { console.error(e); }
      }
    `);
    skip = true;
  }
  
  if (lines[i].includes(endGen)) {
    skip = false;
  }
  
  if (!skip) {
    newLines.push(lines[i]);
  }
}

code = newLines.join('\\n');

// Since we setMyFutureSchedules here, we can remove the useEffect that does it
code = code.replace(`
  useEffect(() => {
    if (schedulesList.length > 0) {
      const future = schedulesList.filter(s => new Date(s.date) >= new Date() && !s.isOffDay);
      setMyFutureSchedules(future);
    }
  }, [schedulesList]);
`, '');

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

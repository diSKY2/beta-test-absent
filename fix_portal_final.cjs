const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// 1. Remove lines 1-28 (which is everything before "import { format }")
code = code.substring(code.indexOf("import { format } from 'date-fns';"));

// 2. Find the start and end of the old schedule generation
const startGen = "// 2. Compute dynamic 7-day schedule";
const endGen = "// 3. Fetch today's attendance state";

const startIndex = code.indexOf(startGen);
const endIndex = code.indexOf(endGen);

if (startIndex !== -1 && endIndex !== -1) {
  const codeBefore = code.substring(0, startIndex);
  const codeAfter = code.substring(endIndex);
  
  const replacement = `// 2. Compute dynamic 7-day schedule
      if (shouldFetchStatic) {
         try {
           const schRes = await fetch(API_BASE_URL + '/api/schedules/employee/' + currentEmployee.id);
           if (schRes.ok) {
              const computedSchedules = await schRes.json();
              const today = new Date();
              today.setHours(0,0,0,0);
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);
              
              const dashboardSchedules = computedSchedules.filter((s: any) => {
                 const sDate = new Date(s.date);
                 return sDate >= today && sDate < nextWeek;
              });
              setSchedulesList(dashboardSchedules);
              
              const futureSchedules = computedSchedules.filter((s: any) => {
                 const sDate = new Date(s.date);
                 return sDate >= today && !s.isOffDay;
              });
              setMyFutureSchedules(futureSchedules);
           }
         } catch(e) { console.error(e); }
      }

      `;
      
  code = codeBefore + replacement + codeAfter;
}

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

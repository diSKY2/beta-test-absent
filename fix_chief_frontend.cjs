const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf-8');

const isLeaderRegex = /const isLeader = !!\(currentEmployee\.role && \(currentEmployee\.role\.toLowerCase\(\)\.includes\('ketua'\) \|\| currentEmployee\.role\.toLowerCase\(\)\.includes\('leader'\) \|\| currentEmployee\.role\.toLowerCase\(\)\.includes\('danru'\)\)\);/g;
const isLeaderReplacement = `const isLeader = !!(currentEmployee.role && (currentEmployee.role.toLowerCase().includes('ketua') || currentEmployee.role.toLowerCase().includes('leader') || currentEmployee.role.toLowerCase().includes('danru') || currentEmployee.role.toLowerCase().includes('chief') || currentEmployee.role.toLowerCase().includes('waka')));`;
code = code.replace(isLeaderRegex, isLeaderReplacement);

const isDanruRegex = /const isDanru = currentEmployee\.role && \(currentEmployee\.role\.toLowerCase\(\)\.includes\('ketua'\) \|\| currentEmployee\.role\.toLowerCase\(\)\.includes\('leader'\) \|\| currentEmployee\.role\.toLowerCase\(\)\.includes\('danru'\)\);/g;
const isDanruReplacement = `const isDanru = currentEmployee.role && (currentEmployee.role.toLowerCase().includes('ketua') || currentEmployee.role.toLowerCase().includes('leader') || currentEmployee.role.toLowerCase().includes('danru') || currentEmployee.role.toLowerCase().includes('chief') || currentEmployee.role.toLowerCase().includes('waka'));`;
code = code.replace(isDanruRegex, isDanruReplacement);

const isDanruOptionalRegex = /const isDanru = currentEmployee\?\.role && \(currentEmployee\.role\.toLowerCase\(\)\.includes\('ketua'\) \|\| currentEmployee\.role\.toLowerCase\(\)\.includes\('leader'\) \|\| currentEmployee\.role\.toLowerCase\(\)\.includes\('danru'\)\);/g;
const isDanruOptionalReplacement = `const isDanru = currentEmployee?.role && (currentEmployee.role.toLowerCase().includes('ketua') || currentEmployee.role.toLowerCase().includes('leader') || currentEmployee.role.toLowerCase().includes('danru') || currentEmployee.role.toLowerCase().includes('chief') || currentEmployee.role.toLowerCase().includes('waka'));`;
code = code.replace(isDanruOptionalRegex, isDanruOptionalReplacement);

const fetchDanruRegex = /if \(isDanru && currentEmployee\.subDepartmentId\) \{\n\s*fetchPromises\.push\(\n\s*fetch\(API_BASE_URL \+ '\/api\/shift-exchanges\/danru\/' \+ currentEmployee\.subDepartmentId\)\.then\(res => res\.ok \? res\.json\(\) : \[\]\)\n\s*\);\n\s*\}/;
const fetchDanruReplacement = `if (isDanru) {
        const isChief = currentEmployee.role.toLowerCase().includes('chief') || currentEmployee.role.toLowerCase().includes('waka');
        if (isChief && currentEmployee.locationId) {
          fetchPromises.push(
            fetch(API_BASE_URL + '/api/shift-exchanges/chief/' + currentEmployee.locationId).then(res => res.ok ? res.json() : [])
          );
        } else if (currentEmployee.subDepartmentId) {
          fetchPromises.push(
            fetch(API_BASE_URL + '/api/shift-exchanges/danru/' + currentEmployee.subDepartmentId).then(res => res.ok ? res.json() : [])
          );
        } else {
           fetchPromises.push(Promise.resolve([]));
        }
      }`;
code = code.replace(fetchDanruRegex, fetchDanruReplacement);

// Panel Title replacement (so it doesn't just say DANRU / KETUA REGU)
const panelTitleRegex = /\{\/\* PANEL KOMANDO REGU \(DANRU \/ KETUA REGU ONLY\) \*\/\}\n\s*\{currentEmployee\?\.role && \(currentEmployee\.role\.toLowerCase\(\)\.includes\('ketua'\) \|\| currentEmployee\.role\.toLowerCase\(\)\.includes\('leader'\) \|\| currentEmployee\.role\.toLowerCase\(\)\.includes\('danru'\)\) && allSubDeptEmployees\.length > 0 && \(/;
const panelTitleReplacement = `{/* PANEL KOMANDO REGU (DANRU / KETUA REGU / CHIEF ONLY) */}
                  {isDanru && allSubDeptEmployees.length > 0 && (`;
code = code.replace(panelTitleRegex, panelTitleReplacement);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log('Done');

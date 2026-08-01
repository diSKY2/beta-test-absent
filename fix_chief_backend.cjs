const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf-8');

// 1. Dashboard data endpoint modifications
const dashboardRegex = /if \(isLeader\) \{\n\s*queries\.push\(db\.select\(\)\.from\(employees\)\.where\(eq\(employees\.subDepartmentId, subDepartmentId\)\)\);\n\s*\} else \{\n\s*queries\.push\(Promise\.resolve\(\[\]\)\);\n\s*\}/;
const dashboardReplacement = `if (isLeader) {
        const isChief = empUser.role && (empUser.role.toLowerCase().includes('chief') || empUser.role.toLowerCase().includes('waka'));
        if (isChief) {
           queries.push(db.select().from(employees).where(eq(employees.locationId, empUser.locationId)));
        } else {
           queries.push(db.select().from(employees).where(eq(employees.subDepartmentId, subDepartmentId)));
        }
      } else {
        queries.push(Promise.resolve([]));
      }`;
code = code.replace(dashboardRegex, dashboardReplacement);

// 2. Add chief shift exchanges endpoint
const danruExchangeRegex = /apiRouter\.get\('\/shift-exchanges\/danru\/:subDepartmentId', async \(req, res\) => \{[\s\S]*?\}\);/;
const danruExchangeMatch = code.match(danruExchangeRegex)[0];

const chiefExchangeEndpoint = `
apiRouter.get('/shift-exchanges/chief/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const allExchanges = await db.select().from(shiftExchanges).where(eq(shiftExchanges.status, 'Pending_Danru'));
    
    const emps = await db.select().from(employees).where(eq(employees.locationId, locationId));
    const empIds = emps.map(e => e.id);
    const empMap = {};
    emps.forEach(e => empMap[e.id] = e.name);
    
    const allEmps = await db.select().from(employees);
    const allEmpMap = {};
    allEmps.forEach(e => allEmpMap[e.id] = e.name);

    const filtered = allExchanges.filter(ex => empIds.includes(ex.requesterId) || empIds.includes(ex.replacerId));
    
    const enhanced = filtered.map(ex => ({
      ...ex,
      requesterName: allEmpMap[ex.requesterId] || ex.requesterId,
      replacerName: allEmpMap[ex.replacerId] || ex.replacerId
    }));
    
    res.json(enhanced);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
`;

code = code.replace(danruExchangeRegex, chiefExchangeEndpoint + "\n" + danruExchangeMatch);

fs.writeFileSync('server/api.ts', code);
console.log('Done');

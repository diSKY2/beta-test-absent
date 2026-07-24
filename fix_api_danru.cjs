const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');

code = code.replace("apiRouter.get('/shift-exchanges/danru/:subDepartmentId'", `apiRouter.get('/shift-exchanges/pending-danru', async (req, res) => {
  try {
    const allExchanges = await db.select().from(shiftExchanges).where(eq(shiftExchanges.status, 'Pending_Danru'));
    const allEmps = await db.select().from(employees);
    const allEmpMap = {};
    allEmps.forEach(e => allEmpMap[e.id] = e.name);

    const formatted = allExchanges.map(d => ({
      ...d,
      requesterName: allEmpMap[d.requesterId],
      replacerName: allEmpMap[d.replacerId]
    }));
    
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/shift-exchanges/danru/:subDepartmentId_old'`);

fs.writeFileSync('server/api.ts', code);

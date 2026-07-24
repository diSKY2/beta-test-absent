const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');

code = code.replace(
  "import { locations, departments, subDepartments, employees, employeeAllowances, employeeDeductions, admins, employeeRegistrations } from '../src/db/schema';",
  "import { locations, departments, subDepartments, employees, employeeAllowances, employeeDeductions, admins, employeeRegistrations, shiftExchanges, schedules } from '../src/db/schema';"
);

// We need an "or" from drizzle-orm
if (!code.includes("import { eq, or, and } from 'drizzle-orm';")) {
    code = code.replace("import { eq } from 'drizzle-orm';", "import { eq, or, and } from 'drizzle-orm';");
}

const shiftExchangeRoutes = `

// Shift Exchanges
apiRouter.get('/shift-exchanges/me/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const data = await db.select({
      id: shiftExchanges.id,
      requesterId: shiftExchanges.requesterId,
      replacerId: shiftExchanges.replacerId,
      dateToReplace: shiftExchanges.dateToReplace,
      dateToPayback: shiftExchanges.dateToPayback,
      status: shiftExchanges.status,
      reason: shiftExchanges.reason,
      createdAt: shiftExchanges.createdAt,
      requesterName: employees.name,
      // need aliases for self joins if needed, but we can just query separately or use basic join 
    }).from(shiftExchanges)
      .leftJoin(employees, eq(shiftExchanges.requesterId, employees.id))
      .where(or(eq(shiftExchanges.requesterId, employeeId), eq(shiftExchanges.replacerId, employeeId)))
      .orderBy(shiftExchanges.createdAt); // Need to order later
      
    // Fetch replacer names manually to avoid complex aliasing here
    const replacers = await db.select({ id: employees.id, name: employees.name }).from(employees);
    const replacerMap = {};
    replacers.forEach(r => replacerMap[r.id] = r.name);
    
    const formatted = data.map(d => ({
      ...d,
      replacerName: replacerMap[d.replacerId]
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/shift-exchanges/danru/:subDepartmentId', async (req, res) => {
  try {
    const { subDepartmentId } = req.params;
    // Get all shift exchanges where requester or replacer is in the subdepartment and status is Pending_Danru
    const allExchanges = await db.select().from(shiftExchanges).where(eq(shiftExchanges.status, 'Pending_Danru'));
    
    const emps = await db.select().from(employees).where(eq(employees.subDepartmentId, subDepartmentId));
    const empIds = emps.map(e => e.id);
    const empMap = {};
    emps.forEach(e => empMap[e.id] = e.name);
    
    // Also fetch all employees to map names if the other party is outside
    const allEmps = await db.select().from(employees);
    const allEmpMap = {};
    allEmps.forEach(e => allEmpMap[e.id] = e.name);

    const filtered = allExchanges.filter(ex => empIds.includes(ex.requesterId) || empIds.includes(ex.replacerId));
    
    const formatted = filtered.map(d => ({
      ...d,
      requesterName: allEmpMap[d.requesterId],
      replacerName: allEmpMap[d.replacerId]
    }));
    
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/shift-exchanges', async (req, res) => {
  try {
    const { requesterId, replacerId, dateToReplace, dateToPayback, reason } = req.body;
    const newEx = {
      id: uuidv4(),
      requesterId,
      replacerId,
      dateToReplace: new Date(dateToReplace),
      dateToPayback: new Date(dateToPayback),
      reason,
      status: 'Pending_Replacer'
    };
    await db.insert(shiftExchanges).values(newEx);
    res.json({ success: true, id: newEx.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/shift-exchanges/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.update(shiftExchanges).set({ status }).where(eq(shiftExchanges.id, id));
    
    // If approved, swap the schedules!
    if (status === 'Approved') {
      const exRecord = await db.select().from(shiftExchanges).where(eq(shiftExchanges.id, id));
      if (exRecord.length > 0) {
        const ex = exRecord[0];
        
        // Find schedule for requester on dateToReplace
        const reqSchedulesToReplace = await db.select().from(schedules).where(and(
          eq(schedules.employeeId, ex.requesterId),
          eq(schedules.date, ex.dateToReplace)
        ));
        
        // Find schedule for replacer on dateToPayback
        const repSchedulesToPayback = await db.select().from(schedules).where(and(
          eq(schedules.employeeId, ex.replacerId),
          eq(schedules.date, ex.dateToPayback)
        ));
        
        if (reqSchedulesToReplace.length > 0) {
           await db.update(schedules).set({ employeeId: ex.replacerId }).where(eq(schedules.id, reqSchedulesToReplace[0].id));
        }
        
        if (repSchedulesToPayback.length > 0) {
           await db.update(schedules).set({ employeeId: ex.requesterId }).where(eq(schedules.id, repSchedulesToPayback[0].id));
        }
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

`;

code = code + shiftExchangeRoutes;
fs.writeFileSync('server/api.ts', code);

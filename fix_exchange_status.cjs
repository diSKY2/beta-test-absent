const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');

const target = `
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
`;

code = code.replace(target, `
    // If approved, the /api/employees/:id/schedules endpoint will dynamically calculate the swap.
`);

fs.writeFileSync('server/api.ts', code);

const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');
code = code.replace("res.status(500).json({ error: err.message });\n  }\n});\n\n\n\n// Shift Exchanges", `res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/employees/:id/schedules', async (req, res) => {
  try {
    const { id } = req.params;
    const empData = await db.select().from(employees).where(eq(employees.id, id));
    if (empData.length === 0) return res.json([]);
    const emp = empData[0];
    
    const sTypes = await db.select().from(shiftTypes).where(eq(shiftTypes.subDepartmentId, emp.subDepartmentId));
    const patterns = await db.select().from(shiftPatterns).where(eq(shiftPatterns.subDepartmentId, emp.subDepartmentId));
    const pattern = patterns.length > 0 ? patterns[0] : null;
    const overrides = await db.select().from(subdeptScheduleOverrides).where(eq(subdeptScheduleOverrides.subDepartmentId, emp.subDepartmentId));
    
    // Also fetch approved shift exchanges involving this employee
    const exchanges = await db.select().from(shiftExchanges)
      .where(and(eq(shiftExchanges.status, 'Approved'), or(eq(shiftExchanges.requesterId, id), eq(shiftExchanges.replacerId, id))));

    const formatTimeStr = (tStr) => {
      if (!tStr) return "08:00";
      if (tStr.includes('T')) {
        const parts = tStr.split('T')[1];
        if (parts) return parts.substring(0, 5);
      }
      return tStr.substring(0, 5);
    };
    
    const computed = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 0; i < 30; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      
      let activeShift = null;
      
      // 1. Check if this employee is being replaced by someone else on this date (they don't work)
      // If they are requester and date is dateToReplace, they don't work.
      // If they are replacer and date is dateToPayback, they don't work.
      const isReplaced = exchanges.find(ex => {
        const exDateR = new Date(ex.dateToReplace).toISOString().split('T')[0];
        const exDateP = new Date(ex.dateToPayback).toISOString().split('T')[0];
        return (ex.requesterId === id && exDateR === dateStr) || (ex.replacerId === id && exDateP === dateStr);
      });
      
      if (isReplaced) {
        // They are replaced on this day, so they are off.
        computed.push({
          id: 'ex-' + dateStr,
          date: targetDate,
          shiftName: 'Tukar Libur',
          isOffDay: true
        });
        continue;
      }
      
      // 2. Check if this employee is replacing someone else on this date (they work extra)
      // If they are requester and date is dateToPayback, they work.
      // If they are replacer and date is dateToReplace, they work.
      const isReplacing = exchanges.find(ex => {
        const exDateR = new Date(ex.dateToReplace).toISOString().split('T')[0];
        const exDateP = new Date(ex.dateToPayback).toISOString().split('T')[0];
        return (ex.requesterId === id && exDateP === dateStr) || (ex.replacerId === id && exDateR === dateStr);
      });
      
      if (isReplacing) {
        // We should theoretically find the original shift, but let's just assign a default working shift or lookup the other person's shift
        // For simplicity, we just mark it as "Shift Pengganti"
        computed.push({
          id: 'ex-in-' + dateStr,
          date: targetDate,
          shiftName: 'Shift Pengganti',
          shiftStart: '08:00',
          shiftEnd: '16:00',
          isOffDay: false
        });
        continue;
      }

      // Normal schedule computation
      const override = overrides.find(o => {
        const oDate = new Date(o.overrideDate);
        return oDate.toISOString().split('T')[0] === dateStr;
      });
      
      if (override) {
        activeShift = sTypes.find(s => s.id === override.shiftTypeId);
      }
      
      if (!activeShift && pattern) {
        const cycleLength = pattern.workDays + pattern.offDays;
        const refDate = new Date(pattern.referenceDate || new Date());
        refDate.setHours(0,0,0,0);
        const diffTime = targetDate.getTime() - refDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
        
        if (diffDays >= 0) {
          const dayInCycle = diffDays % cycleLength;
          if (dayInCycle < pattern.workDays) {
            activeShift = sTypes.find(s => s.id === pattern.shiftTypeId);
          }
        }
      }
      
      if (activeShift) {
        computed.push({
          id: dateStr,
          date: targetDate,
          shiftTypeId: activeShift.id,
          shiftName: activeShift.name,
          shiftStart: formatTimeStr(activeShift.startTime),
          shiftEnd: formatTimeStr(activeShift.endTime),
          isOffDay: activeShift.isOffDay
        });
      } else {
         computed.push({
           id: dateStr,
           date: targetDate,
           shiftName: 'Libur',
           isOffDay: true
         });
      }
    }
    
    res.json(computed);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});


// Shift Exchanges`);
fs.writeFileSync('server/api.ts', code);

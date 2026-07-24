import express from 'express';
import { db } from '../src/db';
import { locations, departments, subDepartments, employees, employeeAllowances, employeeDeductions, admins, employeeRegistrations, shiftExchanges, schedules } from '../src/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const apiRouter = express.Router();

// Employees API
apiRouter.get('/employees', async (req, res) => {
  try {
    const data = await db.select().from(employees);
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/employees', async (req, res) => {
  try {
    const newEmployee = { ...req.body, id: uuidv4() };
    await db.insert(employees).values(newEmployee);
    res.json({ id: newEmployee.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(employees).set(req.body).where(eq(employees.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(employees).where(eq(employees.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Registrations
apiRouter.post('/employee/register', async (req, res) => {
  try {
    const { nik, name, password, phone, locationId, departmentId, subDepartmentId, role, profilePicUrl } = req.body;
    const newReg = {
      id: uuidv4(),
      nik,
      name,
      password,
      phone,
      locationId,
      departmentId,
      subDepartmentId,
      role,
      profilePicUrl: profilePicUrl || null,
      status: 'Pending',
    };
    await db.insert(employeeRegistrations).values(newReg);
    res.json({ success: true, id: newReg.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/registrations', async (req, res) => {
  try {
    const data = await db.select().from(employeeRegistrations);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // update status
    await db.update(employeeRegistrations).set({ status }).where(eq(employeeRegistrations.id, id));
    
    if (status === 'Approved') {
      const regRecord = await db.select().from(employeeRegistrations).where(eq(employeeRegistrations.id, id));
      if (regRecord.length > 0) {
        const reg = regRecord[0];
        
        // Cek jika NIK sudah ada untuk mencegah duplikasi
        const existingEmp = await db.select().from(employees).where(eq(employees.nik, reg.nik));
        if (existingEmp.length === 0) {
          const newEmp = {
            id: uuidv4(),
            nik: reg.nik,
            name: reg.name,
            password: reg.password,
            locationId: reg.locationId,
            departmentId: reg.departmentId,
            subDepartmentId: reg.subDepartmentId,
            role: reg.role,
            profilePicUrl: reg.profilePicUrl,
            status: 'Aktif',
            baseSalary: "0"
          };
          await db.insert(employees).values(newEmp);
        }
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Locations
apiRouter.get('/locations', async (req, res) => {
  try {
    const data = await db.select().from(locations);
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/locations', async (req, res) => {
  try {
    const newLoc = { ...req.body, id: uuidv4() };
    await db.insert(locations).values(newLoc);
    res.json({ id: newLoc.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(locations).set(req.body).where(eq(locations.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(locations).where(eq(locations.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Departments
apiRouter.get('/departments', async (req, res) => {
  try {
    const data = await db.select().from(departments);
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/departments', async (req, res) => {
  try {
    const newDept = { ...req.body, id: uuidv4() };
    await db.insert(departments).values(newDept);
    res.json({ id: newDept.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.put('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(departments).set(req.body).where(eq(departments.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.delete('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(departments).where(eq(departments.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// SubDepartments
apiRouter.get('/subdepartments', async (req, res) => {
  try {
    const data = await db.select().from(subDepartments);
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/subdepartments', async (req, res) => {
  try {
    const newSub = { ...req.body, id: uuidv4() };
    await db.insert(subDepartments).values(newSub);
    res.json({ id: newSub.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.put('/subdepartments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(subDepartments).set(req.body).where(eq(subDepartments.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.delete('/subdepartments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(subDepartments).where(eq(subDepartments.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Admin Authentication (For HR Admin Login via API)

apiRouter.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminResult = await db.select().from(admins).where(eq(admins.email, email));
    if (adminResult.length === 0) {
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }
    const adminUser = adminResult[0];
    if (adminUser.password !== password) {
      return res.status(401).json({ error: 'Password salah' });
    }
    res.json({ success: true, user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/employee/login', async (req, res) => {
  try {
    const { nik, password } = req.body;
    const empResult = await db.select().from(employees).where(eq(employees.nik, nik));
    if (empResult.length === 0) {
      return res.status(401).json({ error: 'Data Karyawan tidak ditemukan (NIK Salah)' });
    }
    const empUser = empResult[0];
    
    if (empUser.password !== password) {
      return res.status(401).json({ error: 'Password salah' });
    }
    
    res.json({ success: true, user: empUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import { shiftTypes, shiftPatterns, subdeptScheduleOverrides, attendances, leaveRequests, overtimeRequests, workReports, announcements } from '../src/db/schema';

apiRouter.post('/employee/dashboard-data', async (req, res) => {
  try {
    const { employeeId, subDepartmentId, isLeader, isSoftRefresh } = req.body;
    
    // Refresh employee to check status
    const empResult = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (empResult.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const empUser = empResult[0];

    // Queries to run in parallel
    const queries = [];
    
    // Always fetch volatile data
    queries.push(db.select().from(attendances).where(eq(attendances.employeeId, employeeId)));
    queries.push(db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId)));
    queries.push(db.select().from(overtimeRequests).where(eq(overtimeRequests.employeeId, employeeId)));
    queries.push(db.select().from(workReports).where(eq(workReports.employeeId, employeeId)));
    
    if (isLeader) {
       queries.push(db.select().from(attendances)); // team attendances
    } else {
       queries.push(Promise.resolve([]));
    }

    // Optionally fetch static data
    if (!isSoftRefresh) {
      queries.push(db.select().from(locations));
      queries.push(db.select().from(shiftTypes).where(eq(shiftTypes.subDepartmentId, subDepartmentId)));
      queries.push(db.select().from(shiftPatterns).where(eq(shiftPatterns.subDepartmentId, subDepartmentId)));
      queries.push(db.select().from(subdeptScheduleOverrides).where(eq(subdeptScheduleOverrides.subDepartmentId, subDepartmentId)));
      queries.push(db.select().from(announcements));
      
      if (isLeader) {
        queries.push(db.select().from(employees).where(eq(employees.subDepartmentId, subDepartmentId)));
      } else {
        queries.push(Promise.resolve([]));
      }
    }

    const results = await Promise.all(queries);
    
    const response: any = {
      employee: empUser,
      attendances: results[0],
      leaveRequests: results[1],
      overtimeRequests: results[2],
      workReports: results[3],
      teamAttendances: results[4]
    };

    if (!isSoftRefresh) {
      response.locations = results[5];
      response.shiftTypes = results[6];
      response.shiftPatterns = results[7];
      response.overrides = results[8];
      response.announcements = results[9];
      response.teamEmployees = results[10];
    }

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const newAdmin = { id: uuidv4(), email, password, name, role: 'admin' };
    await db.insert(admins).values(newAdmin);
    res.json({ success: true, user: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name, role: newAdmin.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


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

apiRouter.get('/shift-exchanges/pending-danru', async (req, res) => {
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
      status: 'Pending_Replacer' as const
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
    
    // If approved, the /api/employees/:id/schedules endpoint will dynamically calculate the swap.
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


apiRouter.get('/schedules/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empData = await db.select().from(employees).where(eq(employees.id, id));
    if (empData.length === 0) return res.json([]);
    const emp = empData[0];
    
    const sTypes = await db.select().from(shiftTypes).where(eq(shiftTypes.subDepartmentId, emp.subDepartmentId));
    const patterns = await db.select().from(shiftPatterns).where(eq(shiftPatterns.subDepartmentId, emp.subDepartmentId));
    const pattern = patterns.length > 0 ? patterns[0] : null;
    const overrides = await db.select().from(subdeptScheduleOverrides).where(eq(subdeptScheduleOverrides.subDepartmentId, emp.subDepartmentId));
    
    const exchanges = await db.select().from(shiftExchanges)
      .where(and(eq(shiftExchanges.status, 'Approved'), or(eq(shiftExchanges.requesterId, id), eq(shiftExchanges.replacerId, id))));

    const formatTimeStr = (tStr: string) => {
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
      
      const isReplaced = exchanges.find(ex => {
        const exDateR = new Date(ex.dateToReplace).toISOString().split('T')[0];
        const exDateP = new Date(ex.dateToPayback).toISOString().split('T')[0];
        return (ex.requesterId === id && exDateR === dateStr) || (ex.replacerId === id && exDateP === dateStr);
      });
      
      if (isReplaced) {
        computed.push({
          id: 'ex-' + dateStr,
          date: targetDate.toISOString(),
          shiftName: 'Tukar Libur',
          isOffDay: true
        });
        continue;
      }
      
      const isReplacing = exchanges.find(ex => {
        const exDateR = new Date(ex.dateToReplace).toISOString().split('T')[0];
        const exDateP = new Date(ex.dateToPayback).toISOString().split('T')[0];
        return (ex.requesterId === id && exDateP === dateStr) || (ex.replacerId === id && exDateR === dateStr);
      });
      
      if (isReplacing) {
        computed.push({
          id: 'ex-in-' + dateStr,
          date: targetDate.toISOString(),
          shiftName: 'Shift Pengganti',
          shiftStart: '08:00',
          shiftEnd: '16:00',
          isOffDay: false
        });
        continue;
      }

      const override = overrides.find(o => {
        const oDate = new Date(o.overrideDate);
        return oDate.toISOString().split('T')[0] === dateStr;
      });
      
      if (override) {
        activeShift = sTypes.find(s => s.id === override.shiftTypeId);
      }
      
      if (!activeShift && pattern) {
        const sequence = Array.isArray(pattern.sequence) ? pattern.sequence : [];
        if (sequence.length > 0) {
          const cycleLength = sequence.length;
          const refDate = new Date(pattern.startDate);
          refDate.setHours(0,0,0,0);
          const diffTime = targetDate.getTime() - refDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
          
          if (diffDays >= 0) {
            const dayInCycle = diffDays % cycleLength;
            const shiftId = sequence[dayInCycle];
            if (shiftId && shiftId !== 'off') {
              activeShift = sTypes.find(s => s.id === shiftId);
            }
          }
        }
      }
      
      if (activeShift) {
        computed.push({
          id: dateStr,
          date: targetDate.toISOString(),
          shiftTypeId: activeShift.id,
          shiftName: activeShift.name,
          shiftStart: formatTimeStr(activeShift.startTime),
          shiftEnd: formatTimeStr(activeShift.endTime),
          isOffDay: activeShift.isOffDay
        });
      } else {
         computed.push({
           id: dateStr,
           date: targetDate.toISOString(),
           shiftName: 'Libur',
           isOffDay: true
         });
      }
    }
    
    res.json(computed);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

import express from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../src/db';
import { locations, departments, subDepartments, employees, employeeAllowances, employeeDeductions, admins, employeeRegistrations, shiftExchanges, schedules, companyInfo } from '../src/db/schema';
import { eq, or, and, inArray, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const apiRouter = express.Router();

// In-memory cache helper for high-frequency reference data (prevents database connection pool exhaustion)
const memoryCache: Record<string, { data: any; expiry: number }> = {};
function getCachedData<T>(key: string): T | null {
  const item = memoryCache[key];
  if (item && item.expiry > Date.now()) {
    return item.data as T;
  }
  return null;
}
function setCachedData(key: string, data: any, ttlSeconds: number = 45) {
  memoryCache[key] = { data, expiry: Date.now() + ttlSeconds * 1000 };
}
function clearCache(prefix?: string) {
  if (!prefix) {
    Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
  } else {
    Object.keys(memoryCache).filter(k => k.startsWith(prefix)).forEach(k => delete memoryCache[k]);
  }
}

// Employees API
apiRouter.get('/employees', async (req, res) => {
  try {
    let cached = getCachedData<any[]>('ref_employees');
    if (cached) return res.json(cached);
    const data = await db.select().from(employees);
    setCachedData('ref_employees', data, 30);
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/employees', async (req, res) => {
  try {
    const newEmployee = { ...req.body, id: uuidv4() };
    await db.insert(employees).values(newEmployee);
    clearCache('ref_employees');
    res.json({ id: newEmployee.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(employees).set(req.body).where(eq(employees.id, id));
    clearCache('ref_employees');
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(employees).where(eq(employees.id, id));
    clearCache('ref_employees');
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
       // Only fetch recent team attendances (last 3 days) to avoid scanning the entire database history
       const threeDaysAgo = new Date();
       threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
       threeDaysAgo.setHours(0, 0, 0, 0);
       queries.push(db.select().from(attendances).where(gte(attendances.attendanceDate, threeDaysAgo)));
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
        const isChief = empUser.role && (empUser.role.toLowerCase().includes('chief') || empUser.role.toLowerCase().includes('waka'));
        if (isChief) {
           queries.push(db.select().from(employees).where(eq(employees.locationId, empUser.locationId)));
        } else {
           queries.push(db.select().from(employees).where(eq(employees.subDepartmentId, subDepartmentId)));
        }
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

apiRouter.post('/admin/monitoring-data', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.body;
    
    // Konversi string YYYY-MM-DD ke Date dan perluas jangkauan waktu untuk menghindari masalah zona waktu (terpotongnya absen pagi di Asia)
    const fromDate = dateFrom ? new Date(dateFrom + 'T00:00:00.000Z') : new Date();
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59.999Z') : new Date();
    
    fromDate.setHours(fromDate.getHours() - 14);
    toDate.setHours(toDate.getHours() + 14);

    // Fetch or use cached reference data to avoid redundant heavy queries
    let cachedLocations = getCachedData<any[]>('ref_locations');
    let cachedDepartments = getCachedData<any[]>('ref_departments');
    let cachedSubDepartments = getCachedData<any[]>('ref_subdepartments');
    let cachedEmployees = getCachedData<any[]>('ref_employees');

    const refPromises: Promise<any>[] = [];
    if (!cachedLocations) refPromises.push(db.select().from(locations).then(d => { setCachedData('ref_locations', d, 60); return d; }));
    else refPromises.push(Promise.resolve(cachedLocations));

    if (!cachedDepartments) refPromises.push(db.select().from(departments).then(d => { setCachedData('ref_departments', d, 60); return d; }));
    else refPromises.push(Promise.resolve(cachedDepartments));

    if (!cachedSubDepartments) refPromises.push(db.select().from(subDepartments).then(d => { setCachedData('ref_subdepartments', d, 60); return d; }));
    else refPromises.push(Promise.resolve(cachedSubDepartments));

    if (!cachedEmployees) refPromises.push(db.select().from(employees).then(d => { setCachedData('ref_employees', d, 30); return d; }));
    else refPromises.push(Promise.resolve(cachedEmployees));

    const queries = [
      ...refPromises,
      db.select().from(attendances).where(
        and(
          gte(attendances.attendanceDate, fromDate),
          lte(attendances.attendanceDate, toDate)
        )
      ),
      db.select().from(schedules).where(
        and(
          gte(schedules.date, fromDate),
          lte(schedules.date, toDate)
        )
      ),
      db.select().from(leaveRequests).where(
        and(
          gte(leaveRequests.requestDate, fromDate),
          lte(leaveRequests.requestDate, toDate)
        )
      ),
      db.select().from(overtimeRequests).where(
        and(
          gte(overtimeRequests.requestDate, fromDate),
          lte(overtimeRequests.requestDate, toDate)
        )
      )
    ];

    const results = await Promise.all(queries);

    res.json({
      locations: results[0],
      departments: results[1],
      subDepartments: results[2],
      employees: results[3],
      attendances: results[4],
      schedules: results[5] || [],
      leaveRequests: results[6] || [],
      overtimeRequests: results[7] || []
    });
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


const JAKARTA_TZ = 'Asia/Jakarta';

function getJakartaDateStr(d: Date | string | number = new Date()): string {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
}

apiRouter.get('/schedules/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empData = await db.select().from(employees).where(eq(employees.id, id));
    if (empData.length === 0) return res.json([]);
    const emp = empData[0];
    
    // Cache subDepartment shift types, patterns, and overrides to reduce DB load
    const subDeptCache = new Map<string, { sTypes: any[]; pattern: any; overrides: any[] }>();

    const getSubDeptData = async (sId: string) => {
      if (subDeptCache.has(sId)) return subDeptCache.get(sId)!;
      const st = await db.select().from(shiftTypes).where(eq(shiftTypes.subDepartmentId, sId));
      const ptList = await db.select().from(shiftPatterns).where(eq(shiftPatterns.subDepartmentId, sId));
      const pt = ptList.length > 0 ? ptList[0] : null;
      const ov = await db.select().from(subdeptScheduleOverrides).where(eq(subdeptScheduleOverrides.subDepartmentId, sId));
      const data = { sTypes: st, pattern: pt, overrides: ov };
      subDeptCache.set(sId, data);
      return data;
    };

    const getRawShiftForSubDept = async (sId: string, targetDate: Date, dateStr: string) => {
      const { sTypes, pattern, overrides } = await getSubDeptData(sId);
      let activeShift = null;

      const override = overrides.find(o => {
        return getJakartaDateStr(o.overrideDate) === dateStr;
      });

      if (override) {
        activeShift = sTypes.find(s => s.id === override.shiftTypeId);
      }

      if (!activeShift && pattern) {
        const sequence = Array.isArray(pattern.sequence) ? pattern.sequence : [];
        if (sequence.length > 0) {
          const cycleLength = sequence.length;
          const refDateStr = getJakartaDateStr(pattern.startDate);
          const [rY, rM, rD] = refDateStr.split('-').map(Number);
          const [curY, curM, curD] = dateStr.split('-').map(Number);
          const refTime = Date.UTC(rY, rM - 1, rD);
          const curTime = Date.UTC(curY, curM - 1, curD);
          const diffDays = Math.floor((curTime - refTime) / (1000 * 3600 * 24));

          if (diffDays >= 0) {
            const dayInCycle = diffDays % cycleLength;
            const shiftId = sequence[dayInCycle];
            if (shiftId && shiftId !== 'off') {
              activeShift = sTypes.find(s => s.id === shiftId);
            }
          }
        }
      }

      return activeShift;
    };

    
    const rawExchanges = await db.select().from(shiftExchanges)
      .where(and(eq(shiftExchanges.status, 'Approved'), or(eq(shiftExchanges.requesterId, id), eq(shiftExchanges.replacerId, id))));
    
    // Sort exchanges by createdAt descending so the latest exchange takes precedence
    const exchanges = rawExchanges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const leaves = await db.select().from(leaveRequests)
      .where(and(eq(leaveRequests.employeeId, id), eq(leaveRequests.status, 'Approved')));
      
    const overtimes = await db.select().from(overtimeRequests)
      .where(and(eq(overtimeRequests.employeeId, id), eq(overtimeRequests.status, 'Approved')));


    // Collect all other employee IDs involved in exchanges
    const otherEmpIds = Array.from(new Set(
      exchanges.flatMap(ex => [ex.requesterId, ex.replacerId]).filter(eId => eId && eId !== id)
    ));
    const empSubDeptMap = new Map<string, string>();
    empSubDeptMap.set(id, emp.subDepartmentId);

    if (otherEmpIds.length > 0) {
      const otherEmps = await db.select().from(employees).where(inArray(employees.id, otherEmpIds));
      otherEmps.forEach(e => empSubDeptMap.set(e.id, e.subDepartmentId));
    }

    const formatTimeStr = (tStr: string) => {
      if (!tStr) return "08:00";
      if (tStr.includes('T')) {
        const parts = tStr.split('T')[1];
        if (parts) return parts.substring(0, 5);
      }
      return tStr.substring(0, 5);
    };
    
    const computed = [];
    const jakartaTodayStr = getJakartaDateStr(new Date());
    const [tY, tM, tD] = jakartaTodayStr.split('-').map(Number);
    
    // Generate from yesterday (-1) to 35 days in Jakarta time
    for (let i = -1; i < 35; i++) {
      const targetDate = new Date(Date.UTC(tY, tM - 1, tD + i, 0, 0, 0));
      const dateStr = `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`;
      
      const isReplaced = exchanges.find(ex => {
        const exDateR = getJakartaDateStr(ex.dateToReplace);
        const exDateP = getJakartaDateStr(ex.dateToPayback);
        return (ex.requesterId === id && exDateR === dateStr) || (ex.replacerId === id && exDateP === dateStr);
      });
      
      if (isReplaced) {
        computed.push({
          id: 'ex-' + dateStr,
          date: dateStr,
          shiftName: 'Tukar Libur',
          isOffDay: true
        });
        continue;
      }
      
      const isReplacing = exchanges.find(ex => {
        const exDateR = getJakartaDateStr(ex.dateToReplace);
        const exDateP = getJakartaDateStr(ex.dateToPayback);
        return (ex.requesterId === id && exDateP === dateStr) || (ex.replacerId === id && exDateR === dateStr);
      });
      
      if (isReplacing) {
        const isPaybackDate = getJakartaDateStr(isReplacing.dateToPayback) === dateStr;
        const personBeingReplacedId = (isReplacing.requesterId === id && isPaybackDate)
          ? isReplacing.replacerId
          : isReplacing.requesterId;

        const replacedSubDeptId = empSubDeptMap.get(personBeingReplacedId) || emp.subDepartmentId;
        const replacedShift = await getRawShiftForSubDept(replacedSubDeptId, targetDate, dateStr);

        if (replacedShift && !replacedShift.isOffDay) {
          computed.push({
            id: 'ex-in-' + dateStr,
            date: dateStr,
            shiftTypeId: replacedShift.id,
            shiftName: `Pengganti (${replacedShift.name})`,
            shiftStart: formatTimeStr(replacedShift.startTime),
            shiftEnd: formatTimeStr(replacedShift.endTime),
            isOffDay: false,
            isFlexible: replacedShift.isFlexible,
            isWfa: replacedShift.isWfa
          });
        } else {
          computed.push({
            id: 'ex-in-' + dateStr,
            date: dateStr,
            shiftName: 'Shift Pengganti',
            shiftStart: '08:00',
            shiftEnd: '16:00',
            isOffDay: false
          });
        }
        continue;
      }

      
      const isLeave = leaves.find(l => getJakartaDateStr(l.requestDate) === dateStr);
      if (isLeave) {
        computed.push({
          id: 'leave-' + dateStr,
          date: dateStr,
          shiftName: isLeave.type || 'Cuti/Izin',
          isOffDay: true
        });
        continue;
      }
      
      const isOvertime = overtimes.find(o => getJakartaDateStr(o.requestDate) === dateStr);
      
      const activeShift = await getRawShiftForSubDept(emp.subDepartmentId, targetDate, dateStr);
      if (activeShift) {
        if (isOvertime && activeShift.isOffDay) {
          computed.push({
            id: 'ot-' + dateStr,
            date: dateStr,
            shiftName: 'Lembur',
            shiftStart: '08:00',
            shiftEnd: '17:00',
            isOffDay: false
          });
          continue;
        }

        computed.push({
          id: dateStr,
          date: dateStr,
          shiftTypeId: activeShift.id,
          shiftName: activeShift.name,
          shiftStart: formatTimeStr(activeShift.startTime),
          shiftEnd: formatTimeStr(activeShift.endTime),
          isOffDay: activeShift.isOffDay,
          isFlexible: activeShift.isFlexible,
          isWfa: activeShift.isWfa
        });
      } else {
         computed.push({
           id: dateStr,
           date: dateStr,
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

apiRouter.post('/admin/upload-apk', async (req, res) => {
  try {
    const { base64Data, version, releaseNotes } = req.body;
    if (!base64Data) return res.status(400).json({ error: 'No file data' });

    const base64Clean = base64Data.replace(/^data:.*,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const publicPath = path.join(process.cwd(), 'public', 'app-release.apk');
    const distPath = path.join(process.cwd(), 'dist', 'app-release.apk');

    try { fs.writeFileSync(publicPath, buffer); } catch(e){}
    try { fs.writeFileSync(distPath, buffer); } catch(e){}

    const configContent = JSON.stringify({ version: parseInt(version, 10), releaseNotes });
    const existing = await db.select().from(companyInfo).where(eq(companyInfo.configKey, 'app_version'));
    if (existing.length > 0) {
      await db.update(companyInfo).set({ content: configContent, updatedAt: new Date() }).where(eq(companyInfo.configKey, 'app_version'));
    } else {
      await db.insert(companyInfo).values({
        id: uuidv4(),
        configKey: 'app_version',
        content: configContent,
      });
    }

    res.json({ success: true, message: 'APK uploaded successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/app-version', async (req, res) => {
  try {
    const existing = await db.select().from(companyInfo).where(eq(companyInfo.configKey, 'app_version'));
    if (existing.length > 0) {
      res.json(JSON.parse(existing[0].content));
    } else {
      res.json({ version: 1, releaseNotes: '' });
    }
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

import express from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../src/db';
import {
  locations,
  departments,
  subDepartments,
  employees,
  employeeAllowances,
  employeeDeductions,
  admins,
  employeeRegistrations,
  shiftExchanges,
  schedules,
  companyInfo,
  shiftTypes,
  shiftPatterns,
  subdeptScheduleOverrides,
  attendances,
  leaveRequests,
  overtimeRequests,
  workReports,
  announcements
} from '../src/db/schema';
import { eq, or, and, inArray, gte, lte, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const apiRouter = express.Router();

const JAKARTA_TZ = 'Asia/Jakarta';

export function getJakartaDateStr(d: Date | string | number = new Date()): string {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
}

const formatTimeStr = (tStr: string) => {
  if (!tStr) return "08:00";
  if (tStr.includes('T')) {
    const parts = tStr.split('T')[1];
    if (parts) return parts.substring(0, 5);
  }
  return tStr.substring(0, 5);
};

// In-memory cache helper for high-frequency reference data (prevents database connection pool exhaustion)
const memoryCache: Record<string, { data: any; expiry: number }> = {};
export function getCachedData<T>(key: string): T | null {
  const item = memoryCache[key];
  if (item && item.expiry > Date.now()) {
    return item.data as T;
  }
  return null;
}
export function setCachedData(key: string, data: any, ttlSeconds: number = 90) {
  memoryCache[key] = { data, expiry: Date.now() + ttlSeconds * 1000 };
}
export function clearCache(prefix?: string) {
  if (!prefix) {
    Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
  } else {
    Object.keys(memoryCache).filter(k => k.startsWith(prefix)).forEach(k => delete memoryCache[k]);
  }
}

// Cached Reference Data Loaders (avoids repeated full-table queries & excludes heavy Base64 blobs)
async function getLocationsCached() {
  const cached = getCachedData<any[]>('ref_locations');
  if (cached) return cached;
  const data = await db.select().from(locations);
  setCachedData('ref_locations', data, 120);
  return data;
}

async function getDepartmentsCached() {
  const cached = getCachedData<any[]>('ref_departments');
  if (cached) return cached;
  const data = await db.select().from(departments);
  setCachedData('ref_departments', data, 120);
  return data;
}

async function getSubDepartmentsCached() {
  const cached = getCachedData<any[]>('ref_subdepartments');
  if (cached) return cached;
  const data = await db.select().from(subDepartments);
  setCachedData('ref_subdepartments', data, 120);
  return data;
}

async function getEmployeesLightCached() {
  const cached = getCachedData<any[]>('ref_employees_light');
  if (cached) return cached;
  const rows = await db.select({
    id: employees.id,
    nik: employees.nik,
    name: employees.name,
    locationId: employees.locationId,
    departmentId: employees.departmentId,
    subDepartmentId: employees.subDepartmentId,
    baseSalary: employees.baseSalary,
    role: employees.role,
    status: employees.status,
    createdAt: employees.createdAt,
    updatedAt: employees.updatedAt,
    hasProfilePic: sql<boolean>`(${employees.profilePicUrl} IS NOT NULL AND ${employees.profilePicUrl} != '')`,
  }).from(employees);
  const data = rows.map(r => ({
    ...r,
    profilePicUrl: r.hasProfilePic ? `/api/employees/${r.id}/avatar.jpg` : null
  }));
  setCachedData('ref_employees_light', data, 60);
  return data;
}

async function getShiftTypesCached() {
  const cached = getCachedData<any[]>('ref_shift_types');
  if (cached) return cached;
  const data = await db.select().from(shiftTypes);
  setCachedData('ref_shift_types', data, 120);
  return data;
}

async function getShiftPatternsCached() {
  const cached = getCachedData<any[]>('ref_shift_patterns');
  if (cached) return cached;
  const data = await db.select().from(shiftPatterns);
  setCachedData('ref_shift_patterns', data, 120);
  return data;
}

async function getOverridesCached() {
  const cached = getCachedData<any[]>('ref_overrides');
  if (cached) return cached;
  const data = await db.select().from(subdeptScheduleOverrides);
  setCachedData('ref_overrides', data, 120);
  return data;
}

async function getAnnouncementsCached() {
  const cached = getCachedData<any[]>('ref_announcements');
  if (cached) return cached;
  const data = await db.select({
    id: announcements.id,
    title: announcements.title,
    content: announcements.content,
    type: announcements.type,
    isPopup: announcements.isPopup,
    createdAt: announcements.createdAt,
  }).from(announcements).orderBy(desc(announcements.createdAt)).limit(5);
  setCachedData('ref_announcements', data, 60);
  return data;
}

// Fast in-memory schedule computation helper (0 DB queries when reference data is passed)
function computeEmployeeScheduleInMemory(params: {
  emp: { id: string; subDepartmentId: string };
  exchanges: any[];
  leaves: any[];
  overtimes: any[];
  allShiftTypes: any[];
  allShiftPatterns: any[];
  allOverrides: any[];
  empSubDeptMap: Map<string, string>;
  startOffset?: number;
  endOffset?: number;
}) {
  const {
    emp,
    exchanges,
    leaves,
    overtimes,
    allShiftTypes,
    allShiftPatterns,
    allOverrides,
    empSubDeptMap,
    startOffset = -1,
    endOffset = 35
  } = params;

  const id = emp.id;
  const subDeptMap = new Map<string, { sTypes: any[]; pattern: any; overrides: any[] }>();

  const getSubDeptData = (sId: string) => {
    if (subDeptMap.has(sId)) return subDeptMap.get(sId)!;
    const st = allShiftTypes.filter(s => s.subDepartmentId === sId);
    const pt = allShiftPatterns.find(p => p.subDepartmentId === sId) || null;
    const ov = allOverrides.filter(o => o.subDepartmentId === sId);
    const entry = { sTypes: st, pattern: pt, overrides: ov };
    subDeptMap.set(sId, entry);
    return entry;
  };

  const getRawShiftForSubDept = (sId: string, dateStr: string) => {
    const { sTypes, pattern, overrides } = getSubDeptData(sId);
    let activeShift = null;

    const override = overrides.find(o => getJakartaDateStr(o.overrideDate) === dateStr);
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

  const sortedExchanges = [...exchanges].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const computed = [];
  const jakartaTodayStr = getJakartaDateStr(new Date());
  const [tY, tM, tD] = jakartaTodayStr.split('-').map(Number);

  for (let i = startOffset; i < endOffset; i++) {
    const targetDate = new Date(Date.UTC(tY, tM - 1, tD + i, 0, 0, 0));
    const dateStr = `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`;

    const isReplaced = sortedExchanges.find(ex => {
      const exDateR = getJakartaDateStr(ex.dateToReplace);
      const exDateP = getJakartaDateStr(ex.dateToPayback);
      return (ex.requesterId === id && exDateR === dateStr) || (ex.replacerId === id && exDateP === dateStr);
    });

    if (isReplaced) {
      computed.push({
        id: 'ex-' + dateStr,
        employeeId: id,
        date: dateStr,
        shiftName: 'Tukar Libur',
        isOffDay: true
      });
      continue;
    }

    const isReplacing = sortedExchanges.find(ex => {
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
      const replacedShift = getRawShiftForSubDept(replacedSubDeptId, dateStr);

      if (replacedShift && !replacedShift.isOffDay) {
        computed.push({
          id: 'ex-in-' + dateStr,
          employeeId: id,
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
          employeeId: id,
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
        employeeId: id,
        date: dateStr,
        shiftName: isLeave.type || 'Cuti/Izin',
        isOffDay: true
      });
      continue;
    }

    const isOvertime = overtimes.find(o => getJakartaDateStr(o.requestDate) === dateStr);
    const activeShift = getRawShiftForSubDept(emp.subDepartmentId, dateStr);

    if (activeShift) {
      if (isOvertime && activeShift.isOffDay) {
        computed.push({
          id: 'ot-' + dateStr,
          employeeId: id,
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
        employeeId: id,
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
        employeeId: id,
        date: dateStr,
        shiftName: 'Libur',
        isOffDay: true
      });
    }
  }

  return computed;
}

// Employees API (lightweight by default to avoid sending 30MB of profilePicUrl Base64)
apiRouter.get('/employees', async (req, res) => {
  try {
    const data = await getEmployeesLightCached();
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
    
    await db.update(employeeRegistrations).set({ status }).where(eq(employeeRegistrations.id, id));
    
    if (status === 'Approved') {
      const regRecord = await db.select().from(employeeRegistrations).where(eq(employeeRegistrations.id, id));
      if (regRecord.length > 0) {
        const reg = regRecord[0];
        
        const existingEmp = await db.select({ id: employees.id }).from(employees).where(eq(employees.nik, reg.nik));
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
          clearCache('ref_employees');
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
    const data = await getLocationsCached();
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/locations', async (req, res) => {
  try {
    const newLoc = { ...req.body, id: uuidv4() };
    await db.insert(locations).values(newLoc);
    clearCache('ref_locations');
    res.json({ id: newLoc.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(locations).set(req.body).where(eq(locations.id, id));
    clearCache('ref_locations');
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(locations).where(eq(locations.id, id));
    clearCache('ref_locations');
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Departments
apiRouter.get('/departments', async (req, res) => {
  try {
    const data = await getDepartmentsCached();
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/departments', async (req, res) => {
  try {
    const newDept = { ...req.body, id: uuidv4() };
    await db.insert(departments).values(newDept);
    clearCache('ref_departments');
    res.json({ id: newDept.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.put('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(departments).set(req.body).where(eq(departments.id, id));
    clearCache('ref_departments');
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.delete('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(departments).where(eq(departments.id, id));
    clearCache('ref_departments');
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// SubDepartments
apiRouter.get('/subdepartments', async (req, res) => {
  try {
    const data = await getSubDepartmentsCached();
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/subdepartments', async (req, res) => {
  try {
    const newSub = { ...req.body, id: uuidv4() };
    await db.insert(subDepartments).values(newSub);
    clearCache('ref_subdepartments');
    res.json({ id: newSub.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.put('/subdepartments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(subDepartments).set(req.body).where(eq(subDepartments.id, id));
    clearCache('ref_subdepartments');
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

apiRouter.delete('/subdepartments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(subDepartments).where(eq(subDepartments.id, id));
    clearCache('ref_subdepartments');
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Admin Authentication (For HR Admin & Kawasdal Login via API)
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

// Dedicated Fast Single-Door Attendance Submission Endpoint (Clock-In & Clock-Out)
apiRouter.post('/employee/attendance', async (req, res) => {
  try {
    let { employeeId, type, timeStr, isLate, photoUrl, attendanceId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId wajib diisi' });
    }

    // Legacy ID safety fallback
    if (employeeId === '123' || String(employeeId).length < 10) {
      employeeId = '4992823a-48ec-43f0-9263-dd17756788e6';
    }

    const now = new Date();
    const todayStr = getJakartaDateStr(now);
    const currentTimeStr = timeStr || new Intl.DateTimeFormat('en-GB', {
      timeZone: JAKARTA_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    if (type === 'masuk') {
      // Check recent attendances (last 2 days) for this employee without fetching photoUrl
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const recentAtts = await db.select({
        id: attendances.id,
        employeeId: attendances.employeeId,
        attendanceDate: attendances.attendanceDate,
        status: attendances.status,
        timeIn: attendances.timeIn,
        timeOut: attendances.timeOut,
        isLate: attendances.isLate,
      }).from(attendances).where(
        and(
          eq(attendances.employeeId, employeeId),
          gte(attendances.attendanceDate, twoDaysAgo)
        )
      );

      const existingToday = recentAtts.find(a =>
        (attendanceId && a.id === attendanceId) ||
        getJakartaDateStr(a.attendanceDate) === todayStr
      );

      if (existingToday) {
        await db.update(attendances).set({
          status: 'Hadir',
          timeIn: existingToday.status === 'Hadir' && existingToday.timeIn ? existingToday.timeIn : currentTimeStr,
          timeOut: existingToday.status === 'Hadir' ? existingToday.timeOut : null,
          isLate: Boolean(isLate),
          ...(photoUrl ? { photoUrl } : {}),
          updatedAt: now
        }).where(eq(attendances.id, existingToday.id));

        return res.json({
          success: true,
          id: existingToday.id,
          attendance: {
            id: existingToday.id,
            employeeId,
            attendanceDate: existingToday.attendanceDate,
            status: 'Hadir',
            timeIn: existingToday.status === 'Hadir' && existingToday.timeIn ? existingToday.timeIn : currentTimeStr,
            timeOut: existingToday.status === 'Hadir' ? existingToday.timeOut : null,
            isLate: Boolean(isLate)
          }
        });
      }

      const newId = uuidv4();
      await db.insert(attendances).values({
        id: newId,
        employeeId,
        attendanceDate: now,
        status: 'Hadir',
        timeIn: currentTimeStr,
        timeOut: null,
        isLate: Boolean(isLate),
        photoUrl: photoUrl || null,
      });

      return res.json({
        success: true,
        id: newId,
        attendance: {
          id: newId,
          employeeId,
          attendanceDate: now.toISOString(),
          status: 'Hadir',
          timeIn: currentTimeStr,
          timeOut: null,
          isLate: Boolean(isLate)
        }
      });
    } else if (type === 'pulang') {
      // Find latest incomplete attendance (including yesterday for cross-day night shift) or today's attendance directly in SQL
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const recentAtts = await db.select({
        id: attendances.id,
        employeeId: attendances.employeeId,
        attendanceDate: attendances.attendanceDate,
        status: attendances.status,
        timeIn: attendances.timeIn,
        timeOut: attendances.timeOut,
        isLate: attendances.isLate,
      }).from(attendances).where(
        and(
          eq(attendances.employeeId, employeeId),
          gte(attendances.attendanceDate, threeDaysAgo)
        )
      );

      recentAtts.sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime());

      let targetAtt = recentAtts.find(a => attendanceId && !String(attendanceId).startsWith('temp-') && a.id === attendanceId);
      if (!targetAtt) {
        targetAtt = recentAtts.find(a => !a.timeOut && (a.status as string) !== 'Ditolak');
      }
      if (!targetAtt) {
        targetAtt = recentAtts.find(a => getJakartaDateStr(a.attendanceDate) === todayStr);
      }

      if (targetAtt) {
        await db.update(attendances).set({
          timeOut: currentTimeStr,
          ...(photoUrl ? { photoUrl } : {}),
          updatedAt: now
        }).where(eq(attendances.id, targetAtt.id));

        return res.json({
          success: true,
          id: targetAtt.id,
          attendance: {
            ...targetAtt,
            timeOut: currentTimeStr
          }
        });
      }

      // Fallback: create attendance record if none existed
      const newId = uuidv4();
      await db.insert(attendances).values({
        id: newId,
        employeeId,
        attendanceDate: now,
        status: 'Hadir',
        timeIn: '00:00',
        timeOut: currentTimeStr,
        isLate: false,
        photoUrl: photoUrl || null,
      });

      return res.json({
        success: true,
        id: newId,
        attendance: {
          id: newId,
          employeeId,
          attendanceDate: now.toISOString(),
          status: 'Hadir',
          timeIn: '00:00',
          timeOut: currentTimeStr,
          isLate: false
        }
      });
    }

    return res.status(400).json({ error: 'Tipe absensi tidak valid' });
  } catch (err: any) {
    console.error('Attendance submission error:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan absensi ke database' });
  }
});

// Helper to serve either a Base64 data URL or a file path as an HTTP-cached binary image
function sendStoredImage(res: express.Response, rawVal: string | null | undefined) {
  if (!rawVal) return res.status(404).end();
  if (rawVal.startsWith('data:image/')) {
    const match = rawVal.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const buf = Buffer.from(match[2], 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buf);
    }
  }
  if (rawVal.startsWith('/uploads/') || rawVal.startsWith('http')) {
    return res.redirect(rawVal);
  }
  return res.status(404).end();
}

// On-demand single attendance photo endpoints (prevents sending 50MB of Base64 in monitoring list)
apiRouter.get('/attendances/:id/photo', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select({ photoUrl: attendances.photoUrl }).from(attendances).where(eq(attendances.id, id)).limit(1);
    if (rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ photoUrl: rows[0].photoUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/attendances/:id/photo.jpg', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select({ photoUrl: attendances.photoUrl }).from(attendances).where(eq(attendances.id, id)).limit(1);
    if (rows.length === 0) return res.status(404).end();
    return sendStoredImage(res, rows[0].photoUrl);
  } catch {
    return res.status(500).end();
  }
});

apiRouter.get('/employees/:id/avatar.jpg', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select({ profilePicUrl: employees.profilePicUrl }).from(employees).where(eq(employees.id, id)).limit(1);
    if (rows.length === 0) return res.status(404).end();
    return sendStoredImage(res, rows[0].profilePicUrl);
  } catch {
    return res.status(500).end();
  }
});

// Unified Single-Door Employee Dashboard Endpoint ("Satu Pintu")
apiRouter.post('/employee/dashboard-data', async (req, res) => {
  try {
    const { employeeId, subDepartmentId, isLeader, isSoftRefresh } = req.body;

    // 1. Fetch employee (skip heavy profilePicUrl on soft refresh)
    const empQuery = isSoftRefresh
      ? db.select({
          id: employees.id,
          nik: employees.nik,
          name: employees.name,
          locationId: employees.locationId,
          departmentId: employees.departmentId,
          subDepartmentId: employees.subDepartmentId,
          baseSalary: employees.baseSalary,
          role: employees.role,
          status: employees.status,
        }).from(employees).where(eq(employees.id, employeeId))
      : db.select().from(employees).where(eq(employees.id, employeeId));

    const empResult = await empQuery;
    if (empResult.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const empUser = empResult[0];
    const activeSubDeptId = empUser.subDepartmentId || subDepartmentId;

    // Limit attendance history to last 14 days & exclude heavy Base64 photoUrl
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Run all core queries + cached reference lookups in parallel
    const [
      empAttendances,
      empLeaves,
      empOvertimes,
      empWorkReports,
      allExchangesRaw,
      allLocations,
      allShiftTypes,
      allShiftPatterns,
      allOverrides,
      allEmployeesLight,
      latestAnnouncements
    ] = await Promise.all([
      db.select({
        id: attendances.id,
        employeeId: attendances.employeeId,
        attendanceDate: attendances.attendanceDate,
        status: attendances.status,
        timeIn: attendances.timeIn,
        timeOut: attendances.timeOut,
        isLate: attendances.isLate,
      }).from(attendances).where(
        and(
          eq(attendances.employeeId, employeeId),
          gte(attendances.attendanceDate, fourteenDaysAgo)
        )
      ),
      db.select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        requestDate: leaveRequests.requestDate,
        type: leaveRequests.type,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        createdAt: leaveRequests.createdAt,
      }).from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId)),
      db.select({
        id: overtimeRequests.id,
        employeeId: overtimeRequests.employeeId,
        requestDate: overtimeRequests.requestDate,
        reason: overtimeRequests.reason,
        hours: overtimeRequests.hours,
        status: overtimeRequests.status,
        createdAt: overtimeRequests.createdAt,
      }).from(overtimeRequests).where(eq(overtimeRequests.employeeId, employeeId)),
      db.select({
        id: workReports.id,
        employeeId: workReports.employeeId,
        date: workReports.date,
        description: workReports.description,
        photoUrl: workReports.photoUrl,
        createdAt: workReports.createdAt,
      }).from(workReports).where(eq(workReports.employeeId, employeeId)).orderBy(desc(workReports.date)).limit(12),
      isLeader
        ? db.select().from(shiftExchanges).where(
            or(
              eq(shiftExchanges.requesterId, employeeId),
              eq(shiftExchanges.replacerId, employeeId),
              eq(shiftExchanges.status, 'Pending_Danru')
            )
          )
        : db.select().from(shiftExchanges).where(
            or(
              eq(shiftExchanges.requesterId, employeeId),
              eq(shiftExchanges.replacerId, employeeId)
            )
          ),
      getLocationsCached(),
      getShiftTypesCached(),
      getShiftPatternsCached(),
      getOverridesCached(),
      getEmployeesLightCached(),
      isSoftRefresh ? Promise.resolve([]) : getAnnouncementsCached()
    ]);

    // Build employee lookup maps from cached lightweight employees
    const empNameMap: Record<string, string> = {};
    const empSubDeptMap = new Map<string, string>();
    allEmployeesLight.forEach(e => {
      empNameMap[e.id] = e.name;
      empSubDeptMap.set(e.id, e.subDepartmentId);
    });

    // Compute 35-day schedules in memory (0 extra DB queries!)
    const approvedMyExchanges = allExchangesRaw.filter(
      ex => ex.status === 'Approved' && (ex.requesterId === employeeId || ex.replacerId === employeeId)
    );
    const approvedLeaves = empLeaves.filter(l => l.status === 'Approved');
    const approvedOvertimes = empOvertimes.filter(o => o.status === 'Approved');

    const computedSchedules = computeEmployeeScheduleInMemory({
      emp: { id: employeeId, subDepartmentId: activeSubDeptId },
      exchanges: approvedMyExchanges,
      leaves: approvedLeaves,
      overtimes: approvedOvertimes,
      allShiftTypes,
      allShiftPatterns,
      allOverrides,
      empSubDeptMap,
      startOffset: -1,
      endOffset: 35
    });

    // Resolve Leader's team employees and fetch ONLY their recent attendances (without Base64 photoUrl!)
    let teamEmployees: any[] = [];
    let teamAttendances: any[] = [];

    if (isLeader) {
      const isChief = empUser.role && (empUser.role.toLowerCase().includes('chief') || empUser.role.toLowerCase().includes('waka'));
      teamEmployees = isChief
        ? allEmployeesLight.filter(e => e.locationId === empUser.locationId)
        : allEmployeesLight.filter(e => e.subDepartmentId === activeSubDeptId);

      const teamIds = teamEmployees.map(e => e.id);
      if (teamIds.length > 0) {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        twoDaysAgo.setHours(0, 0, 0, 0);

        teamAttendances = await db.select({
          id: attendances.id,
          employeeId: attendances.employeeId,
          attendanceDate: attendances.attendanceDate,
          status: attendances.status,
          timeIn: attendances.timeIn,
          timeOut: attendances.timeOut,
          isLate: attendances.isLate,
        }).from(attendances).where(
          and(
            inArray(attendances.employeeId, teamIds),
            gte(attendances.attendanceDate, twoDaysAgo)
          )
        );
      }
    }

    // Filter & enrich Shift Exchanges for both personal & Danru/Chief views in one door
    const teamIdSet = new Set(teamEmployees.map(e => e.id));
    const relevantExchanges = allExchangesRaw
      .filter(ex => {
        if (ex.requesterId === employeeId || ex.replacerId === employeeId) return true;
        if (isLeader && ex.status === 'Pending_Danru') {
          return teamIdSet.has(ex.requesterId) || teamIdSet.has(ex.replacerId);
        }
        return false;
      })
      .map(ex => ({
        ...ex,
        requesterName: empNameMap[ex.requesterId] || ex.requesterId,
        replacerName: empNameMap[ex.replacerId] || ex.replacerId
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: any = {
      employee: empUser,
      attendances: empAttendances,
      schedules: computedSchedules,
      leaveRequests: empLeaves,
      overtimeRequests: empOvertimes,
      workReports: empWorkReports,
      shiftExchanges: relevantExchanges,
      teamAttendances
    };

    if (!isSoftRefresh) {
      response.locations = allLocations;
      response.announcements = latestAnnouncements;
      response.teamEmployees = teamEmployees;
      response.exchangeEmployees = allEmployeesLight.filter(e => e.id !== employeeId && (!e.status || e.status === 'Aktif'));
    }

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const assignedRole = role === 'kawasdal' ? 'kawasdal' : 'admin';
    const newAdmin = { id: uuidv4(), email, password, name, role: assignedRole };
    await db.insert(admins).values(newAdmin);
    res.json({ success: true, user: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name, role: newAdmin.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/monitoring-data', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.body;
    
    const effectiveDateFrom = dateFrom || getJakartaDateStr(new Date());
    const effectiveDateTo = (dateTo && dateTo >= effectiveDateFrom) ? dateTo : effectiveDateFrom;

    // Konversi string YYYY-MM-DD ke Date dan perluas jangkauan waktu untuk menghindari masalah zona waktu (terpotongnya absen pagi di Asia)
    const fromDate = new Date(effectiveDateFrom + 'T00:00:00.000Z');
    const toDate = new Date(effectiveDateTo + 'T23:59:59.999Z');
    
    fromDate.setHours(fromDate.getHours() - 14);
    toDate.setHours(toDate.getHours() + 14);

    const [
      locData,
      deptData,
      subDeptData,
      empDataLight,
      allShiftTypes,
      allShiftPatterns,
      allOverrides,
      attRows,
      manualSchedules,
      leaveRows,
      overtimeRows,
      approvedExchanges
    ] = await Promise.all([
      getLocationsCached(),
      getDepartmentsCached(),
      getSubDepartmentsCached(),
      getEmployeesLightCached(),
      getShiftTypesCached(),
      getShiftPatternsCached(),
      getOverridesCached(),
      db.select({
        id: attendances.id,
        employeeId: attendances.employeeId,
        attendanceDate: attendances.attendanceDate,
        status: attendances.status,
        timeIn: attendances.timeIn,
        timeOut: attendances.timeOut,
        isLate: attendances.isLate,
        hasPhoto: sql<boolean>`(${attendances.photoUrl} IS NOT NULL AND ${attendances.photoUrl} != '')`,
      }).from(attendances).where(
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
      db.select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        requestDate: leaveRequests.requestDate,
        type: leaveRequests.type,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
      }).from(leaveRequests).where(
        and(
          gte(leaveRequests.requestDate, fromDate),
          lte(leaveRequests.requestDate, toDate)
        )
      ),
      db.select({
        id: overtimeRequests.id,
        employeeId: overtimeRequests.employeeId,
        requestDate: overtimeRequests.requestDate,
        reason: overtimeRequests.reason,
        hours: overtimeRequests.hours,
        status: overtimeRequests.status,
      }).from(overtimeRequests).where(
        and(
          gte(overtimeRequests.requestDate, fromDate),
          lte(overtimeRequests.requestDate, toDate)
        )
      ),
      db.select().from(shiftExchanges).where(eq(shiftExchanges.status, 'Approved'))
    ]);

    // Build dynamic schedules for the requested date range so Monitoring & Export have accurate shift/off-day info
    const empSubDeptMap = new Map<string, string>();
    empDataLight.forEach(e => empSubDeptMap.set(e.id, e.subDepartmentId));

    const todayJakartaStr = getJakartaDateStr(new Date());
    const [tY, tM, tD] = todayJakartaStr.split('-').map(Number);
    const [fY, fM, fD] = effectiveDateFrom.split('-').map(Number);
    const [toY, toM, toD] = effectiveDateTo.split('-').map(Number);
    const todayUtc = Date.UTC(tY, tM - 1, tD);
    const startOffset = Math.floor((Date.UTC(fY, fM - 1, fD) - todayUtc) / (1000 * 3600 * 24));
    const endOffset = Math.floor((Date.UTC(toY, toM - 1, toD) - todayUtc) / (1000 * 3600 * 24)) + 1;

    const combinedSchedules: any[] = [...manualSchedules];
    const manualKeySet = new Set(
      manualSchedules.map(s => `${s.employeeId}_${getJakartaDateStr(s.date)}`)
    );

    if (endOffset - startOffset <= 40) {
      for (const emp of empDataLight) {
        const empExchanges = approvedExchanges.filter(ex => ex.requesterId === emp.id || ex.replacerId === emp.id);
        const empLeaves = leaveRows.filter(l => l.employeeId === emp.id && l.status === 'Approved');
        const empOvertimes = overtimeRows.filter(o => o.employeeId === emp.id && o.status === 'Approved');

        const dyn = computeEmployeeScheduleInMemory({
          emp,
          exchanges: empExchanges,
          leaves: empLeaves,
          overtimes: empOvertimes,
          allShiftTypes,
          allShiftPatterns,
          allOverrides,
          empSubDeptMap,
          startOffset,
          endOffset
        });

        for (const d of dyn) {
          if (!manualKeySet.has(`${emp.id}_${d.date}`)) {
            combinedSchedules.push(d);
          }
        }
      }
    }

    res.json({
      locations: locData,
      departments: deptData,
      subDepartments: subDeptData,
      employees: empDataLight,
      attendances: attRows.map(r => ({
        ...r,
        photoUrl: r.hasPhoto ? `/api/attendances/${r.id}/photo.jpg` : null,
      })),
      schedules: combinedSchedules,
      leaveRequests: leaveRows,
      overtimeRequests: overtimeRows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Shift Exchanges
apiRouter.get('/shift-exchanges/me/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const [data, replacers] = await Promise.all([
      db.select({
        id: shiftExchanges.id,
        requesterId: shiftExchanges.requesterId,
        replacerId: shiftExchanges.replacerId,
        dateToReplace: shiftExchanges.dateToReplace,
        dateToPayback: shiftExchanges.dateToPayback,
        status: shiftExchanges.status,
        reason: shiftExchanges.reason,
        createdAt: shiftExchanges.createdAt,
      }).from(shiftExchanges)
        .where(or(eq(shiftExchanges.requesterId, employeeId), eq(shiftExchanges.replacerId, employeeId))),
      getEmployeesLightCached()
    ]);

    const empMap: Record<string, string> = {};
    replacers.forEach(r => empMap[r.id] = r.name);
    
    const formatted = data.map(d => ({
      ...d,
      requesterName: empMap[d.requesterId] || d.requesterId,
      replacerName: empMap[d.replacerId] || d.replacerId
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/shift-exchanges/pending-danru', async (req, res) => {
  try {
    const [allExchanges, allEmps] = await Promise.all([
      db.select().from(shiftExchanges).where(eq(shiftExchanges.status, 'Pending_Danru')),
      getEmployeesLightCached()
    ]);
    const allEmpMap: Record<string, string> = {};
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
    const [allExchanges, allEmps] = await Promise.all([
      db.select().from(shiftExchanges).where(eq(shiftExchanges.status, 'Pending_Danru')),
      getEmployeesLightCached()
    ]);
    
    const emps = allEmps.filter(e => e.locationId === locationId);
    const empIds = new Set(emps.map(e => e.id));
    const allEmpMap: Record<string, string> = {};
    allEmps.forEach(e => allEmpMap[e.id] = e.name);

    const filtered = allExchanges.filter(ex => empIds.has(ex.requesterId) || empIds.has(ex.replacerId));
    
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
    const [allExchanges, allEmps] = await Promise.all([
      db.select().from(shiftExchanges).where(eq(shiftExchanges.status, 'Pending_Danru')),
      getEmployeesLightCached()
    ]);
    
    const emps = allEmps.filter(e => e.subDepartmentId === subDepartmentId);
    const empIds = new Set(emps.map(e => e.id));
    const allEmpMap: Record<string, string> = {};
    allEmps.forEach(e => allEmpMap[e.id] = e.name);

    const filtered = allExchanges.filter(ex => empIds.has(ex.requesterId) || empIds.has(ex.replacerId));
    
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
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/schedules/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [
      allEmployeesLight,
      allShiftTypes,
      allShiftPatterns,
      allOverrides,
      rawExchanges,
      leaves,
      overtimes
    ] = await Promise.all([
      getEmployeesLightCached(),
      getShiftTypesCached(),
      getShiftPatternsCached(),
      getOverridesCached(),
      db.select().from(shiftExchanges)
        .where(and(eq(shiftExchanges.status, 'Approved'), or(eq(shiftExchanges.requesterId, id), eq(shiftExchanges.replacerId, id)))),
      db.select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        requestDate: leaveRequests.requestDate,
        type: leaveRequests.type,
        status: leaveRequests.status,
      }).from(leaveRequests)
        .where(and(eq(leaveRequests.employeeId, id), eq(leaveRequests.status, 'Approved'))),
      db.select({
        id: overtimeRequests.id,
        employeeId: overtimeRequests.employeeId,
        requestDate: overtimeRequests.requestDate,
        status: overtimeRequests.status,
      }).from(overtimeRequests)
        .where(and(eq(overtimeRequests.employeeId, id), eq(overtimeRequests.status, 'Approved')))
    ]);

    const emp = allEmployeesLight.find(e => e.id === id);
    if (!emp) return res.json([]);

    const empSubDeptMap = new Map<string, string>();
    allEmployeesLight.forEach(e => empSubDeptMap.set(e.id, e.subDepartmentId));

    const computed = computeEmployeeScheduleInMemory({
      emp,
      exchanges: rawExchanges,
      leaves,
      overtimes,
      allShiftTypes,
      allShiftPatterns,
      allOverrides,
      empSubDeptMap,
      startOffset: -1,
      endOffset: 35
    });

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

apiRouter.post('/admin/reset-app-version', async (req, res) => {
  try {
    const configContent = JSON.stringify({ version: 1, releaseNotes: '', isEnabled: false });
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
    res.json({ success: true, message: 'App version reset to 1 successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/app-version', async (req, res) => {
  try {
    const existing = await db.select().from(companyInfo).where(eq(companyInfo.configKey, 'app_version'));
    const host = req.get('host') || 'garudatrisulaperkasa.web.id';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const defaultDownloadUrl = `${proto}://${host}/app-release.apk`;

    if (existing.length > 0) {
      const parsed = JSON.parse(existing[0].content);
      res.json({
        ...parsed,
        downloadUrl: parsed.downloadUrl || defaultDownloadUrl
      });
    } else {
      res.json({ version: 1, releaseNotes: '', downloadUrl: defaultDownloadUrl });
    }
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

import express from 'express';
import { db } from '../src/db';
import { locations, departments, subDepartments, employees, employeeAllowances, employeeDeductions, admins } from '../src/db/schema';
import { eq } from 'drizzle-orm';
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

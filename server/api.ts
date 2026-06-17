import express from 'express';
import { db } from '../src/db';
import { locations, departments, subDepartments, employees, employeeAllowances, employeeDeductions } from '../src/db/schema';
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
import { admins } from '../src/db/schema';

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

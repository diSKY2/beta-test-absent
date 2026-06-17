import express from 'express';
import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { eq, and, or, sql, desc, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const genericDbRouter = express.Router();

genericDbRouter.post('/rpc', async (req, res) => {
  try {
    const { action, collection, docId, data, queries, order, filters } = req.body;
    let table = (schema as any)[collection];
    
    // Fallbacks or mapping since firestore collection name might differ from schema table name
    if (collection === 'sub_departments') table = schema.subDepartments;
    if (collection === 'employee_allowances') table = schema.employeeAllowances;
    if (collection === 'employee_deductions') table = schema.employeeDeductions;
    if (collection === 'shift_types') table = schema.shiftTypes;
    if (collection === 'shift_patterns') table = schema.shiftPatterns;
    if (collection === 'subdept_schedule_overrides') table = schema.subdeptScheduleOverrides;
    if (collection === 'leave_requests') table = schema.leaveRequests;
    if (collection === 'overtime_requests') table = schema.overtimeRequests;
    if (collection === 'company_info') table = schema.companyInfo;
    if (collection === 'work_reports') table = schema.workReports;
    if (collection === 'galleries') table = schema.galleries;

    if (!table) {
      if (collection === 'admins' || collection === 'locations' || collection === 'departments' || collection === 'employees' || collection === 'schedules' || collection === 'attendances' || collection === 'announcements') {
        table = (schema as any)[collection];
      }
    }

    if (!table) {
      return res.status(400).json({ error: 'Collection not defined in schema: ' + collection });
    }

    if (action === 'getDocs') {
      let queryFn = db.select().from(table);
      
      // Basic support for Drizzle eq() filters sent from mobile as: [{ field: "nik", operator: "==", value: "123" }]
      if (filters && Array.isArray(filters) && filters.length > 0) {
        // Warning: This simplistic approach only handles '==' on top level keys for now
        const conditions = filters.map((f: any) => {
          if (f.operator === '==' && table[f.field]) {
            return eq(table[f.field], f.value);
          }
          return undefined;
        }).filter(Boolean);
        
        if (conditions.length > 0) {
           queryFn = queryFn.where(and(...conditions)) as any; 
        }
      }

      if (collection === 'employees') {
        const results = await queryFn;
        const allowances = await db.select().from(schema.employeeAllowances);
        const deductions = await db.select().from(schema.employeeDeductions);
        
        for (const emp of results) {
          emp.allowances = allowances.filter(a => a.employeeId === emp.id);
          emp.deductions = deductions.filter(d => d.employeeId === emp.id);
        }
        res.json(results);
      } else if (collection === 'company_info') {
        const results = await queryFn;
        const mapped = results.map(r => ({
          id: r.id,
          key: r.configKey,
          ...JSON.parse(r.content || '{}')
        }));
        res.json(mapped);
      } else {
        const results = await queryFn;
        res.json(results);
      }
    } 
    else if (action === 'addDoc') {
      const newId = uuidv4();
      
      const convertDates = (obj: any) => {
        const res = { ...obj };
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        for (const k in res) {
          if (dateKeyRegex.test(k) && res[k] !== null && res[k] !== undefined) {
            if (res[k] && typeof res[k] === 'object' && 'seconds' in res[k]) {
               res[k] = new Date(res[k].seconds * 1000);
            } else if (typeof res[k] === 'number' || typeof res[k] === 'string') {
               res[k] = new Date(res[k]);
               // ensure it's a valid date, else delete
               if (isNaN(res[k].getTime())) delete res[k];
            }
          }
        }
        return res;
      };
      
      const safeData = convertDates(data);
      const insertData = { ...safeData, id: newId };
      
      // if dealing with employees, we have to split allowances/deductions
      if (collection === 'employees') {
        const { allowances, deductions, ...empData } = insertData;
        await db.insert(table).values(empData);
        if (allowances && allowances.length) {
          for (const a of allowances) {
            await db.insert(schema.employeeAllowances).values({ id: uuidv4(), employeeId: newId, name: a.name, amount: String(a.amount) });
          }
        }
        if (deductions && deductions.length) {
          for (const d of deductions) {
            await db.insert(schema.employeeDeductions).values({ id: uuidv4(), employeeId: newId, name: d.name, amount: String(d.amount) });
          }
        }
      } else if (collection === 'company_info') {
        const { key, ...rest } = safeData;
        await db.insert(table).values({
          id: newId,
          configKey: key || 'profile',
          content: JSON.stringify(rest)
        });
      } else {
        await db.insert(table).values(insertData);
      }
      
      res.json({ id: newId });
    }
    else if (action === 'setDoc') {
      const convertDates = (obj: any) => {
        const res = { ...obj };
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        for (const k in res) {
          if (dateKeyRegex.test(k) && res[k] !== null && res[k] !== undefined) {
            if (res[k] && typeof res[k] === 'object' && 'seconds' in res[k]) {
               res[k] = new Date(res[k].seconds * 1000);
            } else if (typeof res[k] === 'number' || typeof res[k] === 'string') {
               res[k] = new Date(res[k]);
               // ensure it's a valid date, else delete
               if (isNaN(res[k].getTime())) delete res[k];
            }
          }
        }
        return res;
      };
      
      const safeData = convertDates(data);
      // Upsert essentially
      const insertData = { ...safeData, id: docId };
      // we check if it exists:
      const existing = await db.select().from(table).where(eq(table.id, docId));
      if (existing.length > 0) {
        if (collection === 'employees') {
          const { allowances, deductions, ...empData } = safeData;
          await db.update(table).set(empData).where(eq(table.id, docId));
          // delete and re-insert nested
          await db.delete(schema.employeeAllowances).where(eq(schema.employeeAllowances.employeeId, docId));
          if (allowances && allowances.length) {
            for (const a of allowances) {
              await db.insert(schema.employeeAllowances).values({ id: uuidv4(), employeeId: docId, name: a.name, amount: String(a.amount) });
            }
          }
          await db.delete(schema.employeeDeductions).where(eq(schema.employeeDeductions.employeeId, docId));
          if (deductions && deductions.length) {
            for (const d of deductions) {
              await db.insert(schema.employeeDeductions).values({ id: uuidv4(), employeeId: docId, name: d.name, amount: String(d.amount) });
            }
          }
        } else if (collection === 'company_info') {
          const { key, ...rest } = safeData;
          const currentContent = JSON.parse(existing[0].content || '{}');
          await db.update(table).set({
            configKey: key || existing[0].configKey,
            content: JSON.stringify({ ...currentContent, ...rest }),
            updatedAt: new Date()
          }).where(eq(table.id, docId));
        } else {
          await db.update(table).set(safeData).where(eq(table.id, docId));
        }
      } else {
        if (collection === 'company_info') {
          const { key, ...rest } = safeData;
          await db.insert(table).values({
             id: docId,
             configKey: key || 'profile',
             content: JSON.stringify(rest)
          });
        } else {
          await db.insert(table).values(insertData);
        }
      }
      res.json({ id: docId });
    }
    else if (action === 'updateDoc') {
      const convertDates = (obj: any) => {
        const res = { ...obj };
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        for (const k in res) {
          if (dateKeyRegex.test(k) && res[k] !== null && res[k] !== undefined) {
            if (res[k] && typeof res[k] === 'object' && 'seconds' in res[k]) {
               res[k] = new Date(res[k].seconds * 1000);
            } else if (typeof res[k] === 'number' || typeof res[k] === 'string') {
               res[k] = new Date(res[k]);
               // ensure it's a valid date, else delete
               if (isNaN(res[k].getTime())) delete res[k];
            }
          }
        }
        return res;
      };
      
      const safeData = convertDates(data);
      if (collection === 'employees') {
        const { allowances, deductions, ...empData } = safeData;
        await db.update(table).set(empData).where(eq(table.id, docId));
        if (allowances) {
          await db.delete(schema.employeeAllowances).where(eq(schema.employeeAllowances.employeeId, docId));
          for (const a of allowances) {
            await db.insert(schema.employeeAllowances).values({ id: uuidv4(), employeeId: docId, name: a.name, amount: String(a.amount) });
          }
        }
        if (deductions) {
          await db.delete(schema.employeeDeductions).where(eq(schema.employeeDeductions.employeeId, docId));
          for (const d of deductions) {
            await db.insert(schema.employeeDeductions).values({ id: uuidv4(), employeeId: docId, name: d.name, amount: String(d.amount) });
          }
        }
      } else if (collection === 'company_info') {
        const { key, ...rest } = safeData;
        const existing = await db.select().from(table).where(eq(table.id, docId));
        if (existing.length > 0) {
          const currentContent = JSON.parse(existing[0].content || '{}');
          await db.update(table).set({
            configKey: key || existing[0].configKey,
            content: JSON.stringify({ ...currentContent, ...rest }),
            updatedAt: new Date()
          }).where(eq(table.id, docId));
        }
      } else {
        await db.update(table).set(safeData).where(eq(table.id, docId));
      }
      res.json({ id: docId });
    }
    else if (action === 'deleteDoc') {
      await db.delete(table).where(eq(table.id, docId));
      res.json({ id: docId });
    }
  } catch (err: any) {
    console.error('RPC Error:', err);
    res.status(500).json({ error: err.message });
  }
});

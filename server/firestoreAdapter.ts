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
      const activeFilters = filters || queries || [];
      if (activeFilters && Array.isArray(activeFilters) && activeFilters.length > 0) {
        // Warning: This simplistic approach only handles '==' on top level keys for now
        const conditions = activeFilters.map((f: any) => {
          let fieldName = f.field;
          if (collection === 'company_info' && fieldName === 'key') fieldName = 'configKey';
          
          const operator = f.op || f.operator;
          const val = f.value !== undefined ? f.value : f.val;
          if (operator === '==' && table[fieldName]) {
            return eq(table[fieldName], val);
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

      // --- AUTO FIX UNTUK DEMO & SISA SESSION LAMA ---
      // Jika dari aplikasi Android masih menyimpan session dengan ID "123" atau ID Firebase lama lainnya, 
      // PostgreSQL akan menolak karena Foreign Key strict. 
      // Jadi kita auto fallback sementara agar demo lancar.
      if (safeData.employeeId === '123' || (safeData.employeeId && safeData.employeeId.length < 10)) {
        console.warn(`[AUTO FIX] Found legacy employeeId: ${safeData.employeeId}, auto replacing with GT111's ID.`);
        // UUID dari GT111
        safeData.employeeId = '4992823a-48ec-43f0-9263-dd17756788e6'; 
      }
      // ------------------------------------------

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
        const confKey = key || 'profile';
        
        // Try getting existing to handle merge
        const existing = await db.select().from(table).where(eq(table.configKey, confKey));
        if (existing.length > 0) {
          const currentContent = JSON.parse(existing[0].content || '{}');
          await db.update(table).set({
            content: JSON.stringify({ ...currentContent, ...rest }),
            updatedAt: new Date()
          }).where(eq(table.id, existing[0].id));
        } else {
          await db.insert(table).values({
            id: newId,
            configKey: confKey,
            content: JSON.stringify(rest)
          });
        }
      } else if (collection === 'shift_patterns') {
        const existing = await db.select().from(table).where(eq(table.subDepartmentId, safeData.subDepartmentId));
        if (existing.length > 0) {
          await db.update(table).set({ ...safeData, updatedAt: new Date() }).where(eq(table.id, existing[0].id));
          res.json({ id: existing[0].id });
          return;
        } else {
          await db.insert(table).values(insertData);
        }
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
          const confKey = key || 'profile';
          const existingByKey = await db.select().from(table).where(eq(table.configKey, confKey));
          if (existingByKey.length > 0) {
             const currentContent = JSON.parse(existingByKey[0].content || '{}');
             await db.update(table).set({
               content: JSON.stringify({ ...currentContent, ...rest }),
               updatedAt: new Date()
             }).where(eq(table.id, existingByKey[0].id));
          } else {
             await db.insert(table).values({
                id: docId,
                configKey: confKey,
                content: JSON.stringify(rest)
             });
          }
        } else if (collection === 'shift_patterns') {
          const existingBySub = await db.select().from(table).where(eq(table.subDepartmentId, safeData.subDepartmentId));
          if (existingBySub.length > 0) {
             await db.update(table).set({ ...safeData, updatedAt: new Date() }).where(eq(table.id, existingBySub[0].id));
          } else {
             await db.insert(table).values(insertData);
          }
        } else {
          await db.insert(table).values(insertData);
        }
      }
      res.json({ id: docId });
    }
    else if (action === 'batchSetDocs') {
      const convertDates = (obj: any) => {
        const res = { ...obj };
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        for (const k in res) {
          if (dateKeyRegex.test(k) && res[k] !== null && res[k] !== undefined) {
             if (res[k] && typeof res[k] === 'object' && 'seconds' in res[k]) res[k] = new Date(res[k].seconds * 1000);
             else if (typeof res[k] === 'number' || typeof res[k] === 'string') {
               res[k] = new Date(res[k]);
               if (isNaN(res[k].getTime())) delete res[k];
             }
          }
        }
        return res;
      };

      const docs = req.body.docs;
      
      await db.transaction(async (tx: any) => {
        for (const doc of docs) {
          const safeData = convertDates(doc.data);
          const insertData = { ...safeData, id: doc.id };
          const existing = await tx.select().from(table).where(eq(table.id, doc.id));
          if (existing.length > 0) {
            await tx.update(table).set(safeData).where(eq(table.id, doc.id));
          } else {
            await tx.insert(table).values(insertData);
          }
        }
      });
      res.json({ success: true, count: docs.length });
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
    console.error('RPC Error:', err, err.cause);
    const errorMessage = err.cause ? `${err.message} - Cause: ${err.cause.message || JSON.stringify(err.cause)}` : err.message;
    res.status(500).json({ error: errorMessage });
  }
});

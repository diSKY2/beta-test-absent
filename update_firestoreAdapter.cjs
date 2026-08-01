const fs = require('fs');
let code = fs.readFileSync('server/firestoreAdapter.ts', 'utf-8');

const processGetDocsCode = `
const processGetDocs = async (collection: string, filters: any, queries: any) => {
  let table = (schema as any)[collection];
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
  if (collection === 'agendas') table = schema.agendas;
  if (!table) {
    if (collection === 'admins' || collection === 'locations' || collection === 'departments' || collection === 'employees' || collection === 'schedules' || collection === 'attendances' || collection === 'announcements' || collection === 'agendas') {
      table = (schema as any)[collection];
    }
  }
  if (!table) throw new Error('Collection not defined in schema: ' + collection);

  let queryFn = db.select().from(table);
  const activeFilters = filters || queries || [];
  if (activeFilters && Array.isArray(activeFilters) && activeFilters.length > 0) {
    const conditions = activeFilters.map((f: any) => {
      let fieldName = f.field;
      if (collection === 'company_info' && fieldName === 'key') fieldName = 'configKey';
      if (collection === 'attendances' && fieldName === 'date') fieldName = 'attendanceDate';
      if (collection === 'leave_requests' && fieldName === 'date') fieldName = 'requestDate';
      if (collection === 'overtime_requests' && fieldName === 'date') fieldName = 'requestDate';
      
      const operator = f.op || f.operator;
      const val = f.value !== undefined ? f.value : f.val;
      if (table[fieldName]) {
        let finalVal = val;
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        if (dateKeyRegex.test(fieldName)) {
           if (typeof val === 'string') finalVal = new Date(val);
           else if (Array.isArray(val)) finalVal = val.map(v => typeof v === 'string' ? new Date(v) : v);
        }
        if (operator === '==') return eq(table[fieldName], finalVal);
        if (operator === 'in') return inArray(table[fieldName], finalVal);
        if (operator === '>=') return sql\`\${table[fieldName]} >= \${val}\`;
        if (operator === '<=') {
           let finalVal = val;
           if (typeof val === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(val)) finalVal = \`\${val} 23:59:59\`;
           return sql\`\${table[fieldName]} <= \${finalVal}\`;
        }
      }
      return undefined;
    }).filter(Boolean);
    if (conditions.length > 0) queryFn = (queryFn as any).where(and(...conditions));
  }
  
  if (collection === 'employees') {
    const results = await queryFn;
    const allowances = await db.select().from(schema.employeeAllowances);
    const deductions = await db.select().from(schema.employeeDeductions);
    for (const emp of results) {
      (emp as any).allowances = allowances.filter((a: any) => a.employeeId === emp.id);
      (emp as any).deductions = deductions.filter((d: any) => d.employeeId === emp.id);
    }
    return results;
  } else if (collection === 'company_info') {
    const results = await queryFn;
    return results.map((r: any) => ({ id: r.id, key: r.configKey, ...JSON.parse(r.content || '{}') }));
  } else {
    return await queryFn;
  }
};
`;

const getDocsRegex = /if \(action === 'getDocs'\) \{[\s\S]*?(?=else if \(action === 'addDoc'\))/m;

code = code.replace(getDocsRegex, `
    if (action === 'batchGetDocs') {
      const { batch } = req.body;
      const results = await Promise.all(batch.map((b: any) => processGetDocs(b.collection, b.filters, b.queries)));
      return res.json(results);
    }
    
    if (action === 'getDocs') {
      const results = await processGetDocs(collection, filters, queries);
      return res.json(results);
    }
    `);
    
code = code.replace("export const genericDbRouter = express.Router();", "export const genericDbRouter = express.Router();\n\n" + processGetDocsCode);

fs.writeFileSync('server/firestoreAdapter.ts', code);
console.log('Done!');

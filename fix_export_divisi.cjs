const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

const regex = /allEmployees\.forEach\(emp => \{[\s\S]*?const row: any\[\] = \[[\s\S]*?emp\.nik \|\| emp\.id\.substring\(0, 8\),[\s\S]*?emp\.name \|\| '-',[\s\S]*?emp\.departmentName \|\| '-',[\s\S]*?emp\.rosterId \|\| 'REGU A'[\s\S]*?\];/m;

const newExport = `allEmployees.forEach(emp => {
          const dept = departments.find(d => d.id === emp.departmentId);
          const subDept = subDepartments.find(sd => sd.id === emp.subDepartmentId);

          const row: any[] = [
              emp.nik || emp.id.substring(0, 8), 
              emp.name || '-', 
              dept ? dept.name : '-', 
              subDept ? subDept.name : '-' 
          ];`;

code = code.replace(regex, newExport);
fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

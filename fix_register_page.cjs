const fs = require('fs');

let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

// Filter departments by locationId
code = code.replace(
  /\{departments\.map\(dep => \(\n                    <option key=\{dep\.id\} value=\{dep\.id\}>\{dep\.name\}<\/option>\n                  \)\)\}/,
  `{departments.filter(d => !locationId || d.locationId === locationId).map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}`
);

// Filter subDepartments by departmentId
code = code.replace(
  /\{subDepartments\.map\(sub => \(\n                    <option key=\{sub\.id\} value=\{sub\.id\}>\{sub\.name\}<\/option>\n                  \)\)\}/,
  `{subDepartments.filter(s => !departmentId || s.departmentId === departmentId).map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}`
);

// Reset sub-dropdowns on location/department change
code = code.replace(
  /onChange=\{e => setLocationId\(e\.target\.value\)\}/,
  `onChange={e => {
                    setLocationId(e.target.value);
                    setDepartmentId('');
                    setSubDepartmentId('');
                  }}`
);

code = code.replace(
  /onChange=\{e => setDepartmentId\(e\.target\.value\)\}/,
  `onChange={e => {
                    setDepartmentId(e.target.value);
                    setSubDepartmentId('');
                  }}`
);

// Remove "Staff HR"
code = code.replace(/<option value="Staff HR">Staff HR<\/option>\s*/, '');

fs.writeFileSync('src/pages/RegisterPage.tsx', code);

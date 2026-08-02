const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Rostering.tsx', 'utf8');

code = code.replace(
  `          if (d.date.startsWith(\`\${year}-\${month}\`)) {
            map[d.date] = d.shiftTypeId;
          }`,
  `          const overrideDate = d.overrideDate || d.date;
          if (overrideDate && overrideDate.startsWith(\`\${year}-\${month}\`)) {
            map[overrideDate] = d.shiftTypeId;
          }`
);

code = code.replace(
  `      await setDoc(doc(db, 'subdept_schedule_overrides', docId), {
        subDepartmentId: selectedSub,
        date: dateStr,
        shiftTypeId: shiftTypeId,
        updatedAt: Date.now()
      }, { merge: true });`,
  `      await setDoc(doc(db, 'subdept_schedule_overrides', docId), {
        subDepartmentId: selectedSub,
        overrideDate: dateStr,
        shiftTypeId: shiftTypeId,
        updatedAt: Date.now()
      }, { merge: true });`
);

fs.writeFileSync('src/pages/admin/Rostering.tsx', code);

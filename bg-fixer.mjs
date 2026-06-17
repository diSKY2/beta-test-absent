import fs from 'fs';
import path from 'path';

function fixBg(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/bg-\[#111827\]/g, 'bg-slate-50');
  content = content.replace(/text-slate-200/g, 'text-gray-800');
  fs.writeFileSync(filePath, content);
}

['src/pages/admin/Geofencing.tsx', 'src/pages/admin/HRAdminManager.tsx', 'src/pages/admin/OrgStructure.tsx', 'src/pages/admin/Monitoring.tsx', 'src/pages/admin/CMS.tsx'].forEach(p => {
  fixBg(path.join(process.cwd(), p));
});
console.log('fixed');

import fs from 'fs';
import path from 'path';

function fixButtons(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/bg-teal-600 text-gray-900/g, 'bg-teal-600 text-white');
  content = content.replace(/bg-indigo-600 text-gray-900/g, 'bg-indigo-600 text-white');
  content = content.replace(/bg-rose-600 text-gray-900/g, 'bg-rose-600 text-white');
  content = content.replace(/bg-teal-500 text-gray-900/g, 'bg-teal-500 text-white');
  content = content.replace(/bg-blue-600 text-gray-900/g, 'bg-blue-600 text-white');
  content = content.replace(/bg-green-600 text-gray-900/g, 'bg-green-600 text-white');

  fs.writeFileSync(filePath, content);
}

['src/pages/admin/Geofencing.tsx', 'src/pages/admin/HRAdminManager.tsx', 'src/pages/admin/OrgStructure.tsx', 'src/pages/admin/Monitoring.tsx', 'src/pages/admin/CMS.tsx'].forEach(p => {
  fixButtons(path.join(process.cwd(), p));
});
console.log('fixed');

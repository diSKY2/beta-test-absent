import fs from 'fs';
import path from 'path';

function replaceTheme(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/bg-\[#0f172a\]/g, 'bg-white');
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  content = content.replace(/bg-\[#1e293b\]/g, 'bg-white');
  content = content.replace(/border-slate-700/g, 'border-slate-300');
  content = content.replace(/text-slate-200/g, 'text-gray-900');
  content = content.replace(/text-white/g, 'text-gray-900');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/bg-slate-800/g, 'bg-slate-100');
  
  // Custom classes for shadow
  content = content.replace(/shadow-lg/g, 'shadow-sm');
  
  // Custom text for header
  content = content.replace(/bg-\[#070b14\]/g, 'bg-slate-50');

  fs.writeFileSync(filePath, content);
}

['src/pages/admin/Geofencing.tsx', 'src/pages/admin/HRAdminManager.tsx', 'src/pages/admin/OrgStructure.tsx', 'src/pages/admin/Monitoring.tsx', 'src/pages/admin/CMS.tsx'].forEach(p => {
  replaceTheme(path.join(process.cwd(), p));
});
console.log('done');

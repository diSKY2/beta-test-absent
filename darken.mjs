import fs from 'fs';
import path from 'path';

function darken(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Backgrounds
  content = content.replace(/bg-white/g, 'bg-[#0f172a]');
  content = content.replace(/bg-slate-50/g, 'bg-[#111827]');
  content = content.replace(/bg-slate-100/g, 'bg-[#1e293b]');
  content = content.replace(/bg-gray-900/g, 'bg-slate-800');
  content = content.replace(/bg-gray-800/g, 'bg-slate-700');
  content = content.replace(/bg-indigo-50/g, 'bg-indigo-900/20');
  content = content.replace(/bg-amber-50/g, 'bg-amber-900/20');
  content = content.replace(/bg-green-50/g, 'bg-green-900/20');

  // Borders
  content = content.replace(/border-slate-200/g, 'border-slate-800');
  content = content.replace(/border-slate-300/g, 'border-slate-700');
  content = content.replace(/border-slate-100/g, 'border-slate-800');
  content = content.replace(/border-indigo-100/g, 'border-indigo-500/20');

  // Text colors
  content = content.replace(/text-gray-900/g, 'text-white');
  content = content.replace(/text-gray-800/g, 'text-slate-200');
  content = content.replace(/text-gray-700/g, 'text-slate-300');
  content = content.replace(/text-slate-600/g, 'text-slate-300');
  content = content.replace(/text-slate-500/g, 'text-slate-400');
  content = content.replace(/text-indigo-900/g, 'text-indigo-300');
  content = content.replace(/text-amber-700/g, 'text-amber-400');
  content = content.replace(/text-green-700/g, 'text-green-400');

  // Other components
  content = content.replace(/shadow-sm/g, 'shadow-lg');
  content = content.replace(/divide-slate-100/g, 'divide-slate-800');

  fs.writeFileSync(filePath, content);
}

const dir = path.join(process.cwd(), 'src/pages/admin');
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx') && file !== 'AdminDashboard.tsx') {
    darken(path.join(dir, file));
  }
});
console.log('darkened');

import fs from 'fs';
import path from 'path';

function fixInputs(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/className="((?:.*?)border-slate-700(?:.*?))"/g, (match, p1) => {
    let newClass = p1;
    if (!newClass.includes('bg-') && (newClass.includes('rounded') || newClass.includes('w-full'))) {
        newClass = newClass + " bg-[#0f172a] text-white";
    }
    return `className="${newClass}"`;
  });
  
  fs.writeFileSync(filePath, content);
}

['src/pages/admin/Rostering.tsx', 'src/pages/admin/Approvals.tsx'].forEach(p => {
  fixInputs(path.join(process.cwd(), p));
});

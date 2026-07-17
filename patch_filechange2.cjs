const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(/<label className="px-4 py-2\.5 bg-slate-900 border border-slate-800 rounded-xl text-\[10px\] font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm">[\s\S]*?<\/label>/gm,
`<button type="button" onClick={() => handleCapturePhoto(setReportPhoto)} className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm">
  <Camera className="w-4 h-4 text-[#14B8A6]" />
  <span>Ambil Foto</span>
</button>`);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log("Done patching HTML");

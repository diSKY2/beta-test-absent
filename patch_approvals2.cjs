const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Approvals.tsx', 'utf8');

code = code.replace(/<p className="text-slate-600 text-xs line-clamp-1">\{req\.type\}: \{req\.reason\}<\/p>/g,
`<p className="text-slate-600 text-xs line-clamp-1">{req.type}: {req.reason}</p>
                         {req.photoUrl && (
                           <button onClick={() => setSelectedImage(req.photoUrl)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 cursor-pointer">
                             <ImageIcon className="w-3 h-3" /> Lihat Bukti Foto
                           </button>
                         )}`);

fs.writeFileSync('src/pages/admin/Approvals.tsx', code);
console.log("Done patching Approvals.tsx history photo link");

const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Rostering.tsx', 'utf-8');

const regexPushToApp = /const handlePushToApp = async \(\) => \{[\s\S]*?\n\s*setLoading\(false\);\n\s*\};/;
code = code.replace(regexPushToApp, "");

const regexButton = /<button onClick=\{handlePushToApp\} disabled=\{loading\} className="flex items-center gap-2 bg-indigo-900\/20 text-indigo-400 px-4 py-2 h-10 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50">\n\s*<Repeat className="w-4 h-4" \/> Push Jadwal ke Aplikasi\n\s*<\/button>/;
const replacementButton = `<div className="flex items-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> Sinkronisasi Otomatis Aktif
                  </div>`;
code = code.replace(regexButton, replacementButton);

const regexCheckCircle = /import \{ (.*) \} from 'lucide-react';/;
if(!code.includes('CheckCircle2')) {
   code = code.replace(regexCheckCircle, (match, p1) => {
       return `import { ${p1}, CheckCircle2 } from 'lucide-react';`;
   });
}

fs.writeFileSync('src/pages/admin/Rostering.tsx', code);
console.log('Done');

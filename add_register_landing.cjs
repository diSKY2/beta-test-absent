const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');
code = code.replace(/<Lock className="w-4 h-4 text-slate-200 group-hover:rotate-12 transition-transform" \/>\s*<span>HRD Portal<\/span>\s*<\/Link>/, `<Lock className="w-4 h-4 text-slate-200 group-hover:rotate-12 transition-transform" />
                <span>HRD Portal</span>
              </Link>
              <Link 
                to="/register" 
                className="group flex items-center gap-1.5 bg-blue-100 text-blue-900 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-200 active:scale-95 transition-all shadow-md hover:shadow-lg border-b-4 border-blue-300"
              >
                <span>Daftar Pegawai</span>
              </Link>`);
fs.writeFileSync('src/pages/LandingPage.tsx', code);

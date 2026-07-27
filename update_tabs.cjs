const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// Update activeTab types
code = code.replace(
  /useState\<'home' \| 'izin' \| 'lembur' \| 'jadwal' \| 'laporan' \| 'absen_anggota'\>/,
  "useState<'home' | 'izin' | 'lembur' | 'jadwal' | 'laporan' | 'absen_anggota' | 'tukar_jadwal'>"
);

// Add to bottom nav
const newNavButton = `
            <button 
              onClick={() => setActiveTab('tukar_jadwal')}
              className={\`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 \${activeTab === 'tukar_jadwal' ? 'text-[#0C2461] scale-105' : 'text-slate-400 hover:text-slate-600'}\`}
            >
              <RefreshCw className={\`w-4.5 h-4.5 \${activeTab === 'tukar_jadwal' ? 'text-red-600 stroke-[2.5px]' : ''}\`} />
              <span className="text-[8px] font-black uppercase tracking-widest font-mono">Tukar</span>
            </button>
`;
code = code.replace('grid-cols-6', 'grid-cols-7');
code = code.replace('</nav>', newNavButton + '          </nav>');

// Remove the Tukar Jadwal button from the home tab schedules section
code = code.replace(
  /<button onClick=\{\(\) =\> setShowExchangeModal\(true\)\} className="px-3 py-1\.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg shadow-sm border border-blue-200 active:scale-95 transition-all">\s*Tukar Jadwal\s*<\/button>/,
  ""
);

// We need to inject the tab content right after 'absen_anggota' tab ends or just anywhere in the main content area.
// Let's find the end of 'absen_anggota' tab.
fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

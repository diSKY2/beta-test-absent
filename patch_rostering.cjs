const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Rostering.tsx', 'utf8');

// 1. Hide Jam Mulai and Jam Pulang if isFlexible is true
content = content.replace(
  `<div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-medium text-slate-600 mb-1">Jam Mulai</label>
                                 <input required type="time" className="w-full text-sm border-slate-300 rounded-lg bg-white text-slate-900" value={newShift.startTime} onChange={e=>setNewShift({...newShift, startTime: e.target.value})} />
                              </div>
                              <div>
                                 <label className="block text-xs font-medium text-slate-600 mb-1">Jam Pulang</label>
                                 <input required type="time" className="w-full text-sm border-slate-300 rounded-lg bg-white text-slate-900" value={newShift.endTime} onChange={e=>setNewShift({...newShift, endTime: e.target.value})} />
                              </div>
                           </div>`,
  `{!newShift.isFlexible && (
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-medium text-slate-600 mb-1">Jam Mulai</label>
                                 <input required type="time" className="w-full text-sm border-slate-300 rounded-lg bg-white text-slate-900" value={newShift.startTime} onChange={e=>setNewShift({...newShift, startTime: e.target.value})} />
                              </div>
                              <div>
                                 <label className="block text-xs font-medium text-slate-600 mb-1">Jam Pulang</label>
                                 <input required type="time" className="w-full text-sm border-slate-300 rounded-lg bg-white text-slate-900" value={newShift.endTime} onChange={e=>setNewShift({...newShift, endTime: e.target.value})} />
                              </div>
                           </div>
                           )}`
);

// 2. Hide Lintas Hari if isFlexible is true (since time doesn't matter)
content = content.replace(
  `<div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs shadow-lg">
                             <input type="checkbox" id="cross" checked={newShift.isCrossDay} onChange={e=>setNewShift({...newShift, isCrossDay: e.target.checked})} className="rounded mt-0.5 text-blue-600" />
                             <label htmlFor="cross" className="font-medium leading-relaxed">
                               Lintas Hari (Centang jika jadwal pulang masuk ke hari berikutnya. Misal: Masuk jam 22:00, Pulang jam 07:00 Pagi besoknya)
                             </label>
                           </div>`,
  `{!newShift.isFlexible && (
                           <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs shadow-lg">
                             <input type="checkbox" id="cross" checked={newShift.isCrossDay} onChange={e=>setNewShift({...newShift, isCrossDay: e.target.checked})} className="rounded mt-0.5 text-blue-600" />
                             <label htmlFor="cross" className="font-medium leading-relaxed">
                               Lintas Hari (Centang jika jadwal pulang masuk ke hari berikutnya. Misal: Masuk jam 22:00, Pulang jam 07:00 Pagi besoknya)
                             </label>
                           </div>
                           )}`
);

// 3. Fix display side (List of shifts)
content = content.replace(
  `<span>{st.startTime} - {st.endTime} {st.isCrossDay && '(Besoknya)'}</span>`,
  `{st.isFlexible ? <span>Jam Bebas (Flexible)</span> : <span>{st.startTime} - {st.endTime} {st.isCrossDay && '(Besoknya)'}</span>}`
);

// 4. Fix display side (Pattern list builder)
content = content.replace(
  `<div className="text-xs text-slate-600">{st.isOffDay ? 'Libur' : \`\${st.startTime}-\${st.endTime}\`}</div>`,
  `<div className="text-xs text-slate-600">{st.isOffDay ? 'Libur' : st.isFlexible ? 'Bebas' : \`\${st.startTime}-\${st.endTime}\`}</div>`
);

// 5. Fix display side (Preview Pattern)
content = content.replace(
  `<div className="text-xs text-slate-600">{detail.isOffDay ? 'LIBUR' : \`\${detail.startTime} - \${detail.endTime}\`}</div>`,
  `<div className="text-xs text-slate-600">{detail.isOffDay ? 'LIBUR' : detail.isFlexible ? 'FLEXIBLE' : \`\${detail.startTime} - \${detail.endTime}\`}</div>`
);

// 6. Fix display side (Calendar/Table)
content = content.replace(
  `{!sVal.isOffDay && <div className="opacity-80 text-xs px-2 border-l border-current"> {sVal.startTime} - {sVal.endTime} {sVal.isCrossDay&&'(+1)'}</div>}`,
  `{!sVal.isOffDay && <div className="opacity-80 text-xs px-2 border-l border-current"> {sVal.isFlexible ? 'Flexible' : \`\${sVal.startTime} - \${sVal.endTime} \${sVal.isCrossDay?'(+1)':''}\`}</div>}`
);

fs.writeFileSync('src/pages/admin/Rostering.tsx', content);
console.log('Patched Rostering.tsx');

const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/OrgStructure.tsx', 'utf-8');

// 1. Imports
code = code.replace(
  "import { UserPlus, Pencil, Trash2, MapPin, Plus, X } from 'lucide-react';",
  "import { UserPlus, Pencil, Trash2, MapPin, Plus, X, ChevronDown, ChevronRight, Building, Map } from 'lucide-react';"
);

// 2. States
const stateAnchor = "const [editId, setEditId] = useState<string | null>(null);";
const newStates = `const [editId, setEditId] = useState<string | null>(null);
  const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});
  
  const toggleLoc = (id: string) => setExpandedLocs(prev => ({...prev, [id]: !prev[id]}));
  const toggleDept = (id: string) => setExpandedDepts(prev => ({...prev, [id]: !prev[id]}));
  const toggleSub = (id: string) => setExpandedSubs(prev => ({...prev, [id]: !prev[id]}));
`;
code = code.replace(stateAnchor, newStates);

// 3. renderTree function
const treeStart = "const renderTree = () => {";
const treeEndStr = "  return (";
const renderTreeIndex = code.indexOf(treeStart);
const renderTreeEndIndex = code.indexOf(treeEndStr, renderTreeIndex);

const newRenderTree = `const renderTree = () => {
    return (
      <div className="space-y-3">
        {locations.map(loc => {
          const locDepts = departments.filter(d => d.locationId === loc.id);
          const isLocExpanded = !!expandedLocs[loc.id];

          return (
            <div key={loc.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
              {/* LOCATION HEADER */}
              <div 
                className="flex items-center gap-3 p-3 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => toggleLoc(loc.id)}
              >
                <button className="text-slate-400 hover:text-slate-600 shrink-0">
                  {isLocExpanded ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                </button>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="truncate pr-4">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{loc.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono truncate">Cabang Utama</p>
                </div>
              </div>

              {/* DEPARTMENTS LIST */}
              {isLocExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                  {locDepts.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 italic pl-14">Tidak ada departemen di lokasi ini.</div>
                  ) : locDepts.map(dept => {
                    const deptSubs = subDepartments.filter(s => s.departmentId === dept.id);
                    const isDeptExpanded = !!expandedDepts[dept.id];

                    return (
                      <div key={dept.id} className="border-b border-slate-100 last:border-0">
                        {/* DEPARTMENT HEADER */}
                        <div 
                          className="flex items-center gap-3 p-2 sm:p-3 pl-8 sm:pl-10 hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => toggleDept(dept.id)}
                        >
                          <button className="text-slate-400 hover:text-slate-600 shrink-0">
                            {isDeptExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                          </button>
                          <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Building className="w-3.5 h-3.5" />
                          </div>
                          <h5 className="font-bold text-slate-700 text-xs sm:text-sm truncate pr-4">{dept.name}</h5>
                        </div>

                        {/* SUB DEPARTMENTS LIST */}
                        {isDeptExpanded && (
                          <div className="bg-slate-100/50 pb-2">
                            {deptSubs.length === 0 ? (
                              <div className="p-2 text-[11px] text-slate-400 italic pl-20">Tidak ada regu di departemen ini.</div>
                            ) : deptSubs.map(sub => {
                              const subEmps = employees.filter(e => e.subDepartmentId === sub.id);
                              const isSubExpanded = !!expandedSubs[sub.id];

                              return (
                                <div key={sub.id} className="border-b border-slate-200/50 last:border-0">
                                  <div 
                                    className="flex items-center gap-2.5 p-2 pl-16 sm:pl-20 hover:bg-slate-200/50 transition-colors cursor-pointer"
                                    onClick={() => toggleSub(sub.id)}
                                  >
                                    <button className="text-slate-400 hover:text-slate-600 shrink-0">
                                      {isSubExpanded ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
                                    </button>
                                    <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                      <Map className="w-3 h-3" />
                                    </div>
                                    <span className="font-semibold text-slate-600 text-[11px] sm:text-xs truncate pr-4">{sub.name}</span>
                                    <span className="ml-auto text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-200 rounded-full">{subEmps.length} Pegawai</span>
                                  </div>

                                  {/* EMPLOYEES LIST */}
                                  {isSubExpanded && (
                                    <div className="bg-slate-200/30 p-3 pl-24 sm:pl-28 flex flex-wrap gap-3">
                                      {subEmps.length === 0 ? (
                                        <div className="text-[11px] text-slate-400 italic">Tidak ada pegawai di regu ini.</div>
                                      ) : subEmps.map(emp => (
                                        <div key={emp.id} className="bg-white border border-slate-300 px-3 py-2 rounded-xl shadow-sm flex items-center gap-3 group min-w-[250px] flex-1 max-w-[350px]">
                                          {emp.profilePicUrl ? (
                                            <img src={emp.profilePicUrl} alt={emp.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border border-slate-600" />
                                          ) : (
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300 text-slate-500 font-bold text-xs">
                                              {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap text-xs">
                                              <span className="truncate">{emp.name}</span>
                                              {emp.nik && <span className="text-[10px] text-blue-600 font-mono">({emp.nik})</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                                              <span>{emp.role}</span>
                                              {emp.status && emp.status !== 'Aktif' ? (
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded uppercase font-mono">
                                                  {emp.status}
                                                </span>
                                              ) : (
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded uppercase font-mono">
                                                  Aktif
                                                </span>
                                              )}
                                            </div>
                                            {emp.password && <div className="text-[9px] text-slate-400 mt-1 font-mono">Pass: {emp.password}</div>}
                                          </div>
                                          <div className="flex flex-col gap-1 shrink-0">
                                            <button onClick={() => handleEdit(emp)} className="text-sky-500 hover:bg-sky-50 p-1.5 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5"/></button>
                                            <button onClick={() => handleDelete(emp.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    );
  };

`;

code = code.substring(0, renderTreeIndex) + newRenderTree + code.substring(renderTreeEndIndex);
fs.writeFileSync('src/pages/admin/OrgStructure.tsx', code);

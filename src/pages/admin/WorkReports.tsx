import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from '../../lib/firestoreClient';
import { db } from '../../lib/firestoreClient';
import { format } from 'date-fns';
import { Briefcase, Search, Calendar, User as UserIcon, Building, Layers, Users, ChevronDown, ChevronRight } from 'lucide-react';

export default function WorkReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, any>>({});
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [expandedSubDepts, setExpandedSubDepts] = useState<Record<string, boolean>>({});

  const toggleLoc = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedLocs(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleDept = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleSubDept = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedSubDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const unsubLocs = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => {
      setDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSubDepts = onSnapshot(collection(db, 'sub_departments'), (snap) => {
      setSubDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unSubEmp = onSnapshot(collection(db, 'employees'), (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach(doc => {
        map[doc.id] = { id: doc.id, ...doc.data() };
      });
      setEmployeesMap(map);
    });

    const q = query(collection(db, 'work_reports'), orderBy('createdAt', 'desc'));
    const unSubRep = onSnapshot(q, (snap) => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubLocs();
      unsubDepts();
      unsubSubDepts();
      unSubEmp();
      unSubRep();
    };
  }, []);

  const employees = Object.values(employeesMap);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-500" />
          Laporan Kerja Pegawai
        </h2>
        <p className="text-slate-400">Pilah laporan kerja per unit dan pantau field activity pegawai hari ini.</p>
      </div>

      {/* Filters Header */}
      <div className="p-4 border border-slate-800 rounded-xl mb-6 flex flex-wrap gap-4 items-center justify-between bg-[#111827]/80 shadow-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIK..." 
              className="bg-[#0f172a] border border-slate-700 text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Tanggal:</span>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#0f172a] border border-slate-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Cabang/Pabrik:</span>
            <select 
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-[#0f172a] border border-slate-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">🌍 Semua Lokasi Kerja</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Memuat data...</div>
      ) : (
        <div className="space-y-4">
          {locations.filter(loc => selectedLocationId === 'all' || loc.id === selectedLocationId).map(loc => {
            const isLocExpanded = !!expandedLocs[loc.id];
            
            const locEmployees = employees.filter(e => e.locationId === loc.id);
            if (locEmployees.length === 0) return null;
            
            const locReports = reports.filter(r => {
               const dateStr = format(new Date(r.date || r.createdAt), 'yyyy-MM-dd');
               return dateStr === dateFilter && employeesMap[r.employeeId]?.locationId === loc.id;
            });
            const deptsInLoc = departments.filter(d => locEmployees.some(e => e.departmentId === d.id));

            return (
              <div key={loc.id} className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-md overflow-hidden transition-all">
                <div onClick={(e) => toggleLoc(loc.id, e)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#151f32] select-none bg-[#111827]">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-indigo-900/10 border border-indigo-500/20 flex items-center justify-center">
                       <Building className="w-5 h-5 text-indigo-400" />
                     </div>
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         {isLocExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                         <h4 className="font-bold text-white text-sm uppercase">{loc.name}</h4>
                       </div>
                       <p className="text-xs text-slate-400 font-mono">Laporan: {locReports.length}</p>
                     </div>
                  </div>
                </div>

                {isLocExpanded && (
                  <div className="border-t border-slate-800 p-4 space-y-4 bg-[#0B101A]">
                    {deptsInLoc.length === 0 ? (
                       <p className="text-slate-500 text-xs text-center py-4">Tidak ada departemen / karyawan di lokasi ini.</p>
                    ) : deptsInLoc.map(dept => {
                      const isDeptExpanded = !!expandedDepts[dept.id];
                      const deptEmployees = locEmployees.filter(e => e.departmentId === dept.id);
                      if(deptEmployees.length === 0) return null;

                      const subDeptsInDept = subDepartments.filter(sd => deptEmployees.some(e => e.subDepartmentId === sd.id));
                      const deptReports = locReports.filter(r => employeesMap[r.employeeId]?.departmentId === dept.id);

                      return (
                        <div key={dept.id} className="bg-[#0f172a]/50 rounded-lg border border-slate-700/50 overflow-hidden">
                          <div onClick={(e) => toggleDept(dept.id, e)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#151f32]/50 select-none">
                            <div className="flex items-center gap-3 pl-2">
                               <Layers className="w-4 h-4 text-blue-400" />
                               <div className="flex items-center gap-2">
                                 {isDeptExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                 <h5 className="font-bold text-white text-sm">{dept.name}</h5>
                                 <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Departemen</span>
                               </div>
                            </div>
                            <span className="text-xs font-mono text-slate-400 pr-2">{deptReports.length} Laporan</span>
                          </div>

                          {isDeptExpanded && (
                            <div className="border-t border-slate-700/50 p-3 space-y-3 bg-[#0a0f18]">
                              {subDeptsInDept.map(subDept => {
                                const isSubDeptExpanded = !!expandedSubDepts[subDept.id];
                                const subDeptEmployees = deptEmployees.filter(e => e.subDepartmentId === subDept.id);
                                if(subDeptEmployees.length === 0) return null;

                                const filteredSubDeptEmployees = subDeptEmployees.filter(emp => {
                                   if (!searchQuery) return true;
                                   const s = searchQuery.toLowerCase();
                                   return (emp.name || '').toLowerCase().includes(s) || (emp.nik || '').toLowerCase().includes(s);
                                });

                                const subDeptReports = deptReports.filter(r => employeesMap[r.employeeId]?.subDepartmentId === subDept.id);

                                return (
                                  <div key={subDept.id} className="bg-[#151f32]/40 rounded border border-slate-700/30 overflow-hidden">
                                    <div onClick={(e) => toggleSubDept(subDept.id, e)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#1a263c]/50 select-none">
                                      <div className="flex items-center gap-3 pl-4">
                                         <Users className="w-4 h-4 text-emerald-400" />
                                         <div className="flex items-center gap-2">
                                           {isSubDeptExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                           <h6 className="font-semibold text-slate-200 text-xs">{subDept.name}</h6>
                                           <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Sub Bagian / Regu</span>
                                         </div>
                                      </div>
                                      <span className="text-xs font-mono text-slate-400 pr-2">{subDeptReports.length} Laporan</span>
                                    </div>

                                    {isSubDeptExpanded && (
                                      <div className="border-t border-slate-700/30 bg-[#0f172a] p-4">
                                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                                           {filteredSubDeptEmployees.map(emp => {
                                              const empReports = subDeptReports.filter(r => r.employeeId === emp.id);
                                              
                                              return (
                                                <div key={emp.id} className="bg-[#111827] border border-slate-800 rounded-lg p-4">
                                                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-800/50">
                                                    {emp?.profilePicUrl ? (
                                                      <img src={emp.profilePicUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                                                    ) : (
                                                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                                        {emp?.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                                      </div>
                                                    )}
                                                    <div>
                                                      <div className="font-bold text-white text-sm">{emp.name}</div>
                                                      <div className="text-[10px] text-slate-400 font-mono">NIK: {emp.nik || '-'}</div>
                                                    </div>
                                                  </div>

                                                  <div className="space-y-3">
                                                    {empReports.length === 0 ? (
                                                       <p className="text-xs text-slate-500 italic text-center py-2">Belum ada laporan hari ini.</p>
                                                    ) : empReports.map(report => (
                                                      <div key={report.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                                                        <div className="flex items-center justify-between mb-2">
                                                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                                                            {format(new Date(report.createdAt), 'HH:mm')}
                                                          </span>
                                                          {report.photoUrl && (
                                                             <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                                                📸 Ada Foto
                                                             </span>
                                                          )}
                                                        </div>
                                                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{report.description}</p>
                                                        {report.photoUrl && (
                                                           <div className="mt-2 pt-2 border-t border-slate-800/50">
                                                              <button onClick={() => setSelectedImage(report.photoUrl)} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Lihat Lampiran Foto &rarr;</button>
                                                           </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )
                                           })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white"
            onClick={() => setSelectedImage(null)}
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}


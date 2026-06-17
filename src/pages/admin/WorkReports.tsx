import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from '../../lib/firestoreClient';
import { db } from '../../lib/firestoreClient';
import { format } from 'date-fns';
import { Briefcase, Search, Calendar, User as UserIcon } from 'lucide-react';

export default function WorkReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // Listen to employees to map names
    const unSubEmp = onSnapshot(collection(db, 'employees'), (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach(doc => {
        map[doc.id] = doc.data();
      });
      setEmployeesMap(map);
    });

    // Listen to work reports
    const q = query(collection(db, 'work_reports'), orderBy('createdAt', 'desc'));
    const unSubRep = onSnapshot(q, (snap) => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unSubEmp();
      unSubRep();
    };
  }, []);

  const filteredReports = reports.filter(r => {
    const emp = employeesMap[r.employeeId] || {};
    const searchLow = searchQuery.toLowerCase();
    const nameMatch = (emp.name || '').toLowerCase().includes(searchLow);
    const descMatch = (r.description || '').toLowerCase().includes(searchLow);
    const dateMatch = (r.date || '').toLowerCase().includes(searchLow);
    return nameMatch || descMatch || dateMatch;
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-500" />
          Laporan Kerja Pegawai
        </h2>
        <p className="text-slate-400">Pantau laporan kerja harian dan field activity pegawai.</p>
      </div>

      <div className="bg-[#0f172a] rounded-2xl shadow-lg border border-slate-800 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama, deskripsi, atau tanggal..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#151f32] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Memuat data...</div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center text-slate-400">Belum ada laporan kerja.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map(report => {
              const emp = employeesMap[report.employeeId] || { name: 'Unknown', role: 'Unknown' };
              const dateObj = report.date ? new Date(report.date) : new Date(report.createdAt);
              
              return (
                <div key={report.id} className="bg-[#151f32] rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                  {report.photoUrl ? (
                     <div 
                       className="h-48 w-full bg-slate-900 cursor-pointer relative group"
                       onClick={() => setSelectedImage(report.photoUrl)}
                     >
                       <img 
                         src={report.photoUrl} 
                         alt="Work Report" 
                         className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                       />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                         <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">Lihat Penuh</span>
                       </div>
                     </div>
                  ) : (
                     <div className="h-48 w-full bg-slate-800/50 flex flex-col items-center justify-center text-slate-500">
                       <Briefcase className="w-8 h-8 mb-2 opacity-50" />
                       <span className="text-xs">Tanpa Foto</span>
                     </div>
                  )}
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                       <Calendar className="w-3.5 h-3.5" />
                       {format(dateObj, 'MMM dd, yyyy HH:mm')}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      {emp.profilePicUrl ? (
                         <img src={emp.profilePicUrl} className="w-10 h-10 rounded-full border border-slate-700" alt="" />
                      ) : (
                         <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <UserIcon className="w-5 h-5" />
                         </div>
                      )}
                      <div>
                        <div className="font-semibold text-white text-sm">{emp.name}</div>
                        <div className="text-xs text-slate-500">{emp.role}</div>
                      </div>
                    </div>

                    <div className="mt-auto bg-black/20 p-3 rounded-lg border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                       {report.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
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

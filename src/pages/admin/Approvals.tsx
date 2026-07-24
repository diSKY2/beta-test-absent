import { useState, useEffect } from 'react';
import { db } from '../../lib/firestoreClient';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, setDoc } from '../../lib/firestoreClient';
import { Check, X, Image as ImageIcon, Download, Search } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { auth } from '../../lib/firestoreClient';
import { useToast } from '../../providers/ToastProvider';
import * as XLSX from 'xlsx';

export default function Approvals() {
  const toast = useToast();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [historyLeaves, setHistoryLeaves] = useState<any[]>([]);
  const [historyOvertimes, setHistoryOvertimes] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchHistory, setSearchHistory] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [shiftExchanges, setShiftExchanges] = useState<any[]>([]);
  
  useEffect(() => {
    // Assuming Danru role, fetch shift exchanges pending Danru approval
    // But since Admin is global or subDept based, we can fetch all or pass the admin's subDept
    // If admin is super, fetch all. For now, fetch all by hitting a generic endpoint or /api/shift-exchanges/all-danru
    fetch(import.meta.env.VITE_API_BASE_URL + '/api/shift-exchanges/pending-danru')
      .then(res => res.json())
      .then(data => setShiftExchanges(data))
      .catch(console.error);
  }, []);

  const handleExchangeApproval = async (id: string, status: string) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/shift-exchanges/' + id + '/status', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status })
      });
      if (res.ok) {
         toast.show('Status tukar jadwal diupdate', 'success');
         setShiftExchanges(prev => prev.filter(e => e.id !== id));
      }
    } catch(err) {
      console.error(err);
    }
  };


  useEffect(() => {
    const q1 = query(collection(db, 'leave_requests'), where('status', '==', 'Pending'));
    const un1 = onSnapshot(q1, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaves(list);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'leave_requests', auth));

    const q1Hist = query(collection(db, 'leave_requests'), where('status', 'in', ['Approved', 'Rejected']));
    const un1Hist = onSnapshot(q1Hist, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoryLeaves(list.sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)));
    }, (error) => console.log(error));

    const q2 = query(collection(db, 'overtime_requests'), where('status', '==', 'Pending'));
    const un2 = onSnapshot(q2, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOvertimes(list);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'overtime_requests', auth));

    const q2Hist = query(collection(db, 'overtime_requests'), where('status', 'in', ['Approved', 'Rejected']));
    const un2Hist = onSnapshot(q2Hist, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoryOvertimes(list.sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)));
    }, (error) => console.log(error));

    const un3 = onSnapshot(collection(db, 'employees'), (snapshot) => {
        const empMap: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
            empMap[doc.id] = doc.data().name;
        });
        setEmployeesMap(empMap);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'employees', auth));

    return () => { un1(); un1Hist(); un2(); un2Hist(); un3(); };
  }, []);

  const handleLeaveAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      await updateDoc(doc(db, 'leave_requests', id), { status: action, updatedAt: Date.now() });
      const req = leaves.find(l => l.id === id);
      
      if (req && action === 'Approved') {
         // Extract only YYYY-MM-DD to avoid exceeding database varchar(50) limit on ID
         let datePart = '';
         if (typeof req.requestDate === 'string') {
           datePart = req.requestDate.split('T')[0];
         } else if (typeof req.requestDate === 'number') {
           datePart = new Date(req.requestDate).toISOString().split('T')[0];
         } else if (req.requestDate && typeof (req.requestDate as any).toDate === 'function') {
           datePart = (req.requestDate as any).toDate().toISOString().split('T')[0];
         } else if (req.requestDate instanceof Date) {
           datePart = req.requestDate.toISOString().split('T')[0];
         } else {
           datePart = new Date().toISOString().split('T')[0];
         }

         const attId = `${req.employeeId}_${datePart}`;
         await setDoc(doc(db, 'attendances', attId), {
            employeeId: req.employeeId,
            attendanceDate: req.requestDate,
            status: req.type, // 'Sakit' or 'Izin'
            type: 'Leave',
            reason: req.reason,
            timestamp: Date.now()
         }, { merge: true });
      }

      const employeeName = req ? (employeesMap[req.employeeId] || 'Pegawai') : 'Pegawai';
      toast.success(`Permintaan izin/sakit ${employeeName} berhasil ${action === 'Approved' ? 'disetujui' : 'ditolak'}`);
    } catch(e: any) {
      toast.error('Gagal memproses persetujuan izin: ' + e.message);
      handleFirestoreError(e, OperationType.UPDATE, 'leave_requests', auth);
    }
  };

  const handleOvertimeAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      await updateDoc(doc(db, 'overtime_requests', id), { status: action, updatedAt: Date.now() });
      const req = overtimes.find(l => l.id === id);
      const employeeName = req ? (employeesMap[req.employeeId] || 'Pegawai') : 'Pegawai';
      toast.success(`Permintaan lembur ${employeeName} berhasil ${action === 'Approved' ? 'disetujui' : 'ditolak'}`);
    } catch(e: any) {
      toast.error('Gagal memproses persetujuan lembur: ' + e.message);
      handleFirestoreError(e, OperationType.UPDATE, 'overtime_requests', auth);
    }
  };

  const exportHistory = () => {
     try {
       const wb = XLSX.utils.book_new();

       // 1. Export Leave History
       const leaveData = historyLeaves.map(r => ({
          'ID Pegawai': r.employeeId,
          'Nama Pegawai': employeesMap[r.employeeId] || '-',
          'Tipe': r.type,
          'Tanggal': r.requestDate,
          'Alasan': r.reason,
          'Status': r.status,
          'Waktu Persetujuan': r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'
       }));
       const wsLeaves = XLSX.utils.json_to_sheet(leaveData);
       XLSX.utils.book_append_sheet(wb, wsLeaves, 'Riwayat Izin & Sakit');

       // 2. Export Overtime History
       const overtimeData = historyOvertimes.map(r => ({
          'ID Pegawai': r.employeeId,
          'Nama Pegawai': employeesMap[r.employeeId] || '-',
          'Jam Lembur': r.hours,
          'Tanggal': r.requestDate,
          'Alasan': r.reason,
          'Status': r.status,
          'Waktu Persetujuan': r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'
       }));
       const wsOvertimes = XLSX.utils.json_to_sheet(overtimeData);
       XLSX.utils.book_append_sheet(wb, wsOvertimes, 'Riwayat Lembur');

       XLSX.writeFile(wb, `Log_Persetujuan_${new Date().toISOString().split('T')[0]}.xlsx`);
       toast.success('Berhasil mengekspor log persetujuan');
     } catch (e: any) {
       toast.error('Gagal export excel: ' + e.message);
     }
  };

  const filteredHistoryLeaves = historyLeaves.filter(req => {
     const n = (employeesMap[req.employeeId] || req.employeeId).toLowerCase();
     return n.includes(searchHistory.toLowerCase());
  });

  const filteredHistoryOvertimes = historyOvertimes.filter(req => {
     const n = (employeesMap[req.employeeId] || req.employeeId).toLowerCase();
     return n.includes(searchHistory.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sistem Approval</h2>
          <p className="text-slate-600">Setujui permintaan izin, sakit, lembur terintegrasi data kehadiran.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab('pending')}
             className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${activeTab==='pending' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
           >
             Pending ({leaves.length + overtimes.length})
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${activeTab==='history' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
           >
             Riwayat Persetujuan
           </button>
        </div>
      </div>

      {activeTab === 'pending' && (
      <>
        
            {/* SHIFT EXCHANGES */}
            {shiftExchanges && shiftExchanges.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Pengajuan Tukar Jadwal</h3>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">{shiftExchanges.length} Pending Danru</span>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {shiftExchanges.map(ex => (
                    <div key={ex.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{ex.requesterName} &#8594; {ex.replacerName}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">Alasan: {ex.reason || '-'}</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl mb-4 text-xs font-medium text-slate-700 shadow-sm border border-slate-100">
                        <p className="mb-1"><strong className="text-blue-700">Tgl Digantikan (Libur):</strong> {new Date(ex.dateToReplace).toLocaleDateString('id-ID')}</p>
                        <p><strong className="text-green-700">Tgl Pelunasan (Masuk):</strong> {new Date(ex.dateToPayback).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleExchangeApproval(ex.id, 'Approved')} className="flex-1 bg-[#0C2461] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors">Setujui Tukar Jadwal</button>
                        <button onClick={() => handleExchangeApproval(ex.id, 'Rejected')} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


<div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Permintaan Izin & Sakit</h3>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{leaves.length} Pending</span>
          </div>
          <div className="divide-y divide-slate-200">
            {leaves.length === 0 ? (
              <div className="p-8 text-center text-slate-600 italic">Tidak ada permintaan izin/sakit.</div>
            ) : (
              leaves.map(req => (
                 <div key={req.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-900">{employeesMap[req.employeeId] || req.employeeId}</span>
                         <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.type === 'Sakit' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                           {req.type}
                         </span>
                         <span className="text-sm text-slate-600">• {req.requestDate}</span>
                         <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                           Menunggu
                         </span>
                      </div>
                      <p className="text-sm text-slate-700">{req.reason}</p>
                      {req.photoUrl && (
                        <button onClick={() => setSelectedImage(req.photoUrl)} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2 cursor-pointer">
                          <ImageIcon className="w-4 h-4" /> Lihat Bukti Foto
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleLeaveAction(req.id, 'Approved')} className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                        <Check className="w-4 h-4" /> Setujui
                      </button>
                      <button onClick={() => handleLeaveAction(req.id, 'Rejected')} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                        <X className="w-4 h-4" /> Tolak
                      </button>
                    </div>
                 </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Permintaan Lembur</h3>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">{overtimes.length} Pending</span>
          </div>
          <div className="divide-y divide-slate-200">
            {overtimes.length === 0 ? (
              <div className="p-8 text-center text-slate-600 italic">Tidak ada permintaan lembur.</div>
            ) : (
              overtimes.map(req => (
                 <div key={req.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-900">{employeesMap[req.employeeId] || req.employeeId}</span>
                         <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full font-medium">
                           {req.hours} Jam
                         </span>
                         <span className="text-sm text-slate-600">• {req.requestDate}</span>
                         <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                           Menunggu
                         </span>
                      </div>
                      <p className="text-sm text-slate-700">{req.reason}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleOvertimeAction(req.id, 'Approved')} className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                        <Check className="w-4 h-4" /> Setujui
                      </button>
                      <button onClick={() => handleOvertimeAction(req.id, 'Rejected')} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                        <X className="w-4 h-4" /> Tolak
                      </button>
                    </div>
                 </div>
              ))
            )}
          </div>
        </div>
      </>
      )}

      {activeTab === 'history' && (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in duration-300 flex flex-col">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
               <h3 className="text-lg font-semibold text-slate-900">Log Persetujuan</h3>
               <p className="text-xs text-slate-600">Riwayat pengajuan izin dan lembur yang telah diproses.</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchHistory}
                    onChange={(e) => setSearchHistory(e.target.value)}
                    placeholder="Cari nama pegawai..." 
                    className="bg-white border border-slate-300 text-sm text-slate-900 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
                  />
                </div>
                <button 
                  onClick={exportHistory}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
             </div>
          </div>
          
          <div className="divide-y divide-slate-200">
             <div className="p-4 bg-slate-50 flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Riwayat Izin & Sakit ({filteredHistoryLeaves.length})</span>
             </div>
             {filteredHistoryLeaves.length === 0 ? (
                <div className="p-8 text-center text-slate-600 italic text-sm">Tidak ada riwayat.</div>
             ) : (
                filteredHistoryLeaves.map(req => (
                   <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-sm">{employeesMap[req.employeeId] || req.employeeId}</span>
                            <span className="text-slate-600 text-xs">• {req.requestDate}</span>
                         </div>
                         <p className="text-slate-600 text-xs line-clamp-1">{req.type}: {req.reason}</p>
                         {req.photoUrl && (
                           <button onClick={() => setSelectedImage(req.photoUrl)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 cursor-pointer">
                             <ImageIcon className="w-3 h-3" /> Lihat Bukti Foto
                           </button>
                         )}
                      </div>
                      <div>
                         <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold ${req.status === 'Approved' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20'}`}>{req.status}</span>
                      </div>
                   </div>
                ))
             )}

             <div className="p-4 bg-slate-50 flex items-center gap-2 border-t mt-4">
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Riwayat Lembur ({filteredHistoryOvertimes.length})</span>
             </div>
             {filteredHistoryOvertimes.length === 0 ? (
                <div className="p-8 text-center text-slate-600 italic text-sm">Tidak ada riwayat.</div>
             ) : (
                filteredHistoryOvertimes.map(req => (
                   <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-sm">{employeesMap[req.employeeId] || req.employeeId}</span>
                            <span className="text-slate-500 text-xs">• {req.requestDate}</span>
                         </div>
                         <p className="text-slate-600 text-xs line-clamp-1">{req.hours} Jam: {req.reason}</p>
                      </div>
                      <div>
                         <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold ${req.status === 'Approved' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20'}`}>{req.status}</span>
                      </div>
                   </div>
                ))
             )}
          </div>
      </div>
      )}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Bukti Foto" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button 
            className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}

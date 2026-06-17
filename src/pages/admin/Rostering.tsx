import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firestoreClient';
import { collection, query, where, getDocs, setDoc, doc, addDoc, deleteDoc } from '../../lib/firestoreClient';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { format, addDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { Calendar as CalIcon, Download, Clock, Repeat, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../../providers/ToastProvider';

interface ShiftType {
  id: string;
  subDepartmentId: string;
  name: string;
  startTime: string;
  endTime: string;
  isCrossDay: boolean;
  isOffDay: boolean;
  color: string;
}

interface ShiftPattern {
  id: string; // usually subDepartmentId
  subDepartmentId: string;
  sequence: string[]; // arr of shiftTypeIds
  startDate: string; // YYYY-MM-DD
}

export default function Rostering() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'calendar' | 'shifts' | 'pattern'>('calendar');
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState('');
  
  const currentMonth = new Date();
  const [month, setMonth] = useState(format(currentMonth, 'MM'));
  const [year, setYear] = useState(format(currentMonth, 'yyyy'));
  
  const [schedules, setSchedules] = useState<Record<string, string>>({}); // {"YYYY-MM-DD": "shiftTypeId"} (manually overriden schedules for a specific date)
  
  // Data State
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [pattern, setPattern] = useState<ShiftPattern | null>(null);
  const [loading, setLoading] = useState(false);

  // Pattern Local State
  const [localSeq, setLocalSeq] = useState<string[]>([]);
  const [localStart, setLocalStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Sync Pattern Local State when pattern changes
  useEffect(() => {
    if (pattern) {
      setLocalSeq(pattern.sequence || []);
      setLocalStart(pattern.startDate || format(new Date(), 'yyyy-MM-dd'));
    } else {
      setLocalSeq([]);
      setLocalStart(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [pattern]);

  // New Shift Type Form State
  const [newShift, setNewShift] = useState<Partial<ShiftType>>({
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    isCrossDay: false,
    isOffDay: false,
    color: 'bg-blue-100 text-blue-700'
  });

  // Fetch Core Data
  useEffect(() => {
    async function fetchCore() {
      try {
        const [subSnap, deptSnap, locSnap] = await Promise.all([
          getDocs(collection(db, 'sub_departments')),
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'locations'))
        ]);
        const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSubDepts(subs);
        setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLocations(locSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        if (subs.length > 0) setSelectedSub(subs[0].id);
      } catch (e) {}
    }
    fetchCore();
  }, []);

  // Fetch Data Specific to Selected Sub Dept & Month
  useEffect(() => {
    async function fetchData() {
      if (!selectedSub) return;
      setLoading(true);
      try {
        // Fetch Shift Types
        const shiftsSnap = await getDocs(query(collection(db, 'shift_types'), where('subDepartmentId', '==', selectedSub)));
        const types = shiftsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShiftType[];
        setShiftTypes(types);

        // Fetch Shift Pattern
        const patternDoc = await getDocs(query(collection(db, 'shift_patterns'), where('subDepartmentId', '==', selectedSub)));
        if (!patternDoc.empty) {
          setPattern({ id: patternDoc.docs[0].id, ...patternDoc.docs[0].data() } as ShiftPattern);
        } else {
          setPattern(null);
        }

        // Fetch Schedules Overrides
        const schedulesSnap = await getDocs(query(collection(db, 'subdept_schedule_overrides'), where('subDepartmentId', '==', selectedSub)));
        const map: Record<string, string> = {};
        schedulesSnap.forEach(doc => {
          const d = doc.data();
          if (d.date.startsWith(`${year}-${month}`)) {
            map[d.date] = d.shiftTypeId;
          }
        });
        setSchedules(map);

      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchData();
  }, [selectedSub, month, year]);

  // Handle saving new shift type
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.name || !selectedSub) return;
    try {
      const docRef = await addDoc(collection(db, 'shift_types'), {
        ...newShift,
        subDepartmentId: selectedSub,
        createdAt: Date.now()
      });
      setShiftTypes(prev => [...prev, { id: docRef.id, ...newShift, subDepartmentId: selectedSub } as ShiftType]);
      setNewShift({ name: '', startTime: '08:00', endTime: '17:00', isCrossDay: false, isOffDay: false, color: 'bg-blue-100 text-blue-700' });
      toast.success('Jam shift baru berhasil disimpan');
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan jam shift: ' + err.message);
    }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shift_types', id));
      setShiftTypes(prev => prev.filter(s => s.id !== id));
      toast.success('Jam shift berhasil dihapus');
    } catch(err: any) {
       console.error(err);
       toast.error('Gagal menghapus jam shift: ' + err.message);
    }
  };

  // Handle Pattern updates
  const handlePatternChange = async (newSequence: string[], newStartDate: string) => {
    try {
      if (pattern && pattern.id) {
         await setDoc(doc(db, 'shift_patterns', pattern.id), {
           subDepartmentId: selectedSub,
           sequence: newSequence,
           startDate: newStartDate,
           updatedAt: Date.now()
         }, { merge: true });
         setPattern({ ...pattern, sequence: newSequence, startDate: newStartDate });
      } else {
         const docRef = await addDoc(collection(db, 'shift_patterns'), {
           subDepartmentId: selectedSub,
           sequence: newSequence,
           startDate: newStartDate,
           createdAt: Date.now()
         });
         setPattern({ id: docRef.id, subDepartmentId: selectedSub, sequence: newSequence, startDate: newStartDate });
      }
      toast.success('Pola shift berhasil disimpan.');
    } catch(err: any) {
      toast.error('Gagal menyimpan pola shift: ' + err.message);
    }
  };

  // Calendar Logic
  const getDaysInMonth = () => {
    const start = startOfMonth(new Date(Number(year), Number(month) - 1));
    const end = endOfMonth(start);
    const dates = [];
    let curr = start;
    while (curr <= end) {
      dates.push(format(curr, 'yyyy-MM-dd'));
      curr = addDays(curr, 1);
    }
    return dates;
  };

  const getShiftForDate = (dateStr: string): ShiftType | null => {
    // Check manual overrides first
    if (schedules[dateStr]) {
       return shiftTypes.find(s => s.id === schedules[dateStr]) || null;
    }
    
    // Otherwise calculate from pattern
    if (!pattern || !pattern.sequence || pattern.sequence.length === 0 || !pattern.startDate) return null;
    
    const dDate = new Date(dateStr);
    const pDate = new Date(pattern.startDate);
    
    const diff = differenceInDays(dDate, pDate);
    
    if (diff < 0) return null; // Before pattern started
    
    const index = diff % pattern.sequence.length;
    const computedShiftId = pattern.sequence[index];
    
    return shiftTypes.find(s => s.id === computedShiftId) || null;
  };

  const handleOverrideShift = async (dateStr: string, shiftTypeId: string) => {
    const backupMap = { ...schedules };
    setSchedules(prev => ({ ...prev, [dateStr]: shiftTypeId }));
    
    try {
      const docId = `${selectedSub}_${dateStr}`;
      await setDoc(doc(db, 'subdept_schedule_overrides', docId), {
        subDepartmentId: selectedSub,
        date: dateStr,
        shiftTypeId: shiftTypeId,
        updatedAt: Date.now()
      }, { merge: true });
      const shiftName = shiftTypes.find(s => s.id === shiftTypeId)?.name || 'Shift';
      toast.success(`Jadwal tanggal ${dateStr} diubah ke "${shiftName}"`);
    } catch(e: any) {
      setSchedules(backupMap);
      toast.error('Gagal menyimpan perubahan shift: ' + e.message);
      handleFirestoreError(e, OperationType.UPDATE, 'subdept_schedule_overrides', auth);
    }
  };

  const clearOverride = async (dateStr: string) => {
    const backupMap = { ...schedules };
    const newMap = { ...schedules };
    delete newMap[dateStr];
    setSchedules(newMap);
    try {
       const docId = `${selectedSub}_${dateStr}`;
       await deleteDoc(doc(db, 'subdept_schedule_overrides', docId));
       toast.success(`Modifikasi jadwal tanggal ${dateStr} dikembalikan ke default.`);
    } catch (e: any) {
       setSchedules(backupMap);
       toast.error('Gagal mengembalikan jadwal ke default: ' + e.message);
    }
  }

  const handleExport = () => {
     const sub = subDepts.find(s => s.id === selectedSub);
     const dept = departments.find(d => d.id === sub?.departmentId);
     const loc = locations.find(l => l.id === dept?.locationId);

     const locName = loc?.name || 'Semua Lokasi';
     const monthName = format(new Date(Number(year), Number(month) - 1, 1), 'MMMM yyyy');

     const headers1 = ['LAPORAN ABSEN HARIAN', '', '', '', '', '', ''];
     const locRow = ['KANTOR/LOKASI CABANG:', locName, '', '', '', '', ''];
     const monthRow = ['BULAN:', monthName, '', '', '', '', ''];

     const dates = getDaysInMonth();
     const headers2 = ['DEPARTEMEN', 'REGU'];
     dates.forEach((d) => {
        headers2.push(format(new Date(d), 'd')); // '1', '2', '3'
     });

     const shiftDataRow = [dept?.name || '-', sub?.name || '-'];
     dates.forEach((d) => {
        const shift = getShiftForDate(d);
        shiftDataRow.push(shift ? shift.name : '-');
     });

     const blankRow: string[] = [];

     const wsData = [
        headers1,
        locRow,
        monthRow,
        headers2,
        shiftDataRow,
        blankRow,
        blankRow
     ];

     const ws = XLSX.utils.aoa_to_sheet(wsData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Jadwal " + monthName);
     XLSX.writeFile(wb, `Jadwal_${locName}_${monthName}.xlsx`);
  };

  const handlePushToApp = async () => {
    if (!selectedSub || !pattern) {
      toast.warning("Pilih regu dan pastikan pola sudah ditentukan.");
      return;
    }

    setLoading(true);
    try {
      // 1. Get employees in this sub-department
      const empSnap = await getDocs(query(collection(db, 'employees'), where('subDepartmentId', '==', selectedSub)));
      const employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (employees.length === 0) {
        toast.warning("Tidak ada pegawai di regu ini.");
        setLoading(false);
        return;
      }

      // 2. Compute schedules for the month
      const dates = getDaysInMonth();
      let writeCount = 0;

      for (const emp of employees) {
        for (const dateStr of dates) {
          const shift = getShiftForDate(dateStr);
          if (shift) {
            const docId = `${emp.id}_${dateStr}`;
            await setDoc(doc(db, 'schedules', docId), {
              employeeId: emp.id,
              subDepartmentId: selectedSub,
              date: dateStr,
              shiftTypeId: shift.id,
              shiftName: shift.name,
              shiftStart: shift.isOffDay ? "Libur" : shift.startTime,
              shiftEnd: shift.isOffDay ? "Libur" : shift.endTime,
              isOffDay: shift.isOffDay,
              updatedAt: Date.now()
            }, { merge: true });
            writeCount++;
          }
        }
      }
      toast.success(`Berhasil! ${writeCount} jadwal shift bulan ini telah didistribusikan ke aplikasi pegawai.`);
    } catch (e: any) {
      console.error(e);
      toast.error("Gagal mem-push jadwal: " + e.message);
    }
    setLoading(false);
  };

  const colors = [
    { label: 'Gray', value: 'bg-gray-100 text-slate-300' },
    { label: 'Red (Libur/Off)', value: 'bg-red-100 text-red-700' },
    { label: 'Blue', value: 'bg-blue-100 text-blue-700' },
    { label: 'Green', value: 'bg-green-100 text-green-400' },
    { label: 'Purple', value: 'bg-purple-100 text-purple-700' },
    { label: 'Amber', value: 'bg-amber-100 text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Dynamic Rostering ({selectedSub && subDepts.find(s=>s.id === selectedSub)?.name})</h2>
        <p className="text-slate-400">Atur jam shift kustom per cabang/regu, lalu atur pola berulang bulanan otomatis.</p>
      </div>

      <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
         <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Pilih Regu / Sub-Bagian Untuk Diatur</label>
              <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)} className="w-full border-slate-700 rounded-lg shadow-lg bg-[#0f172a] text-white">
                {subDepts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
         </div>
         
         <div className="flex border-b border-slate-800 w-full overflow-x-auto">
            <button onClick={()=>setActiveTab('shifts')} className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab==='shifts' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>1. Master Jam Shift</button>
            <button onClick={()=>setActiveTab('pattern')} className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab==='pattern' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>2. Definisi Pola (Pattern)</button>
            <button onClick={()=>setActiveTab('calendar')} className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab==='calendar' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>3. Kalender (Hasil & Set Pengecualian)</button>
         </div>

         {/* SHIFT TAB */}
         {activeTab === 'shifts' && (
           <div className="mt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                 {/* Form */}
                 <div className="bg-[#111827] p-6 rounded-xl border border-slate-800">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4"/> Tambah Jam Shift Baru</h4>
                    <form onSubmit={handleSaveShift} className="space-y-4">
                       <div>
                         <label className="block text-xs font-medium text-slate-400 mb-1">Nama Shift (Misal: Pagi, Malam, Libur)</label>
                         <input required type="text" className="w-full text-sm border-slate-700 rounded-lg bg-[#0f172a] text-white" value={newShift.name} onChange={e=>setNewShift({...newShift, name: e.target.value})} />
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <input type="checkbox" id="isOff" checked={newShift.isOffDay} onChange={e=>setNewShift({...newShift, isOffDay: e.target.checked})} className="rounded text-indigo-600" />
                         <label htmlFor="isOff" className="text-sm text-slate-700 font-medium">Shift ini adalah Hari Libur / Off (Tanpa jam mulai & pulang)</label>
                       </div>

                       {!newShift.isOffDay && (
                         <>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-medium text-slate-400 mb-1">Jam Mulai</label>
                                 <input required type="time" className="w-full text-sm border-slate-700 rounded-lg bg-[#0f172a] text-white" value={newShift.startTime} onChange={e=>setNewShift({...newShift, startTime: e.target.value})} />
                              </div>
                              <div>
                                 <label className="block text-xs font-medium text-slate-400 mb-1">Jam Pulang</label>
                                 <input required type="time" className="w-full text-sm border-slate-700 rounded-lg bg-[#0f172a] text-white" value={newShift.endTime} onChange={e=>setNewShift({...newShift, endTime: e.target.value})} />
                              </div>
                           </div>
                           <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs shadow-lg">
                             <input type="checkbox" id="cross" checked={newShift.isCrossDay} onChange={e=>setNewShift({...newShift, isCrossDay: e.target.checked})} className="rounded mt-0.5 text-blue-600" />
                             <label htmlFor="cross" className="font-medium leading-relaxed">
                               Lintas Hari (Centang jika jadwal pulang masuk ke hari berikutnya. Misal: Masuk jam 22:00, Pulang jam 07:00 Pagi besoknya)
                             </label>
                           </div>
                         </>
                       )}

                       <div>
                         <label className="block text-xs font-medium text-slate-400 mb-2">Warna Visual Kelompok</label>
                         <div className="flex flex-wrap gap-2">
                            {colors.map(c => (
                               <button 
                                 type="button" 
                                 key={c.value} 
                                 onClick={()=>setNewShift({...newShift, color: c.value})}
                                 className={`w-8 h-8 rounded-full border-2 ${c.value.split(' ')[0]} ${newShift.color === c.value ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-900' : 'border-transparent'}`}
                                 title={c.label}
                               />
                            ))}
                         </div>
                       </div>
                       
                       <button type="submit" className="w-full bg-indigo-600 text-white font-medium text-sm py-2 rounded-lg hover:bg-indigo-700">Simpan Jam Shift</button>
                    </form>
                 </div>

                 {/* List */}
                 <div>
                    <h4 className="font-semibold text-white mb-4">Daftar Shift Tersedia untuk {subDepts.find(s=>s.id === selectedSub)?.name}</h4>
                    {shiftTypes.length === 0 ? <p className="text-sm text-slate-400">Belum ada jam shift dikonfigurasi.</p> : (
                       <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {shiftTypes.map(st => (
                             <div key={st.id} className={`p-4 rounded-xl border flex items-center justify-between ${st.color}`}>
                                <div>
                                   <div className="font-bold">{st.name}</div>
                                   {st.isOffDay ? (
                                     <div className="text-xs opacity-80 mt-1">HARI LIBUR BEBAS TUGAS</div>
                                   ) : (
                                     <div className="text-xs opacity-80 mt-1">{st.startTime} - {st.endTime} {st.isCrossDay && '(Besoknya)'}</div>
                                   )}
                                </div>
                                <button onClick={()=>handleDeleteShift(st.id)} className="p-2 bg-[#0f172a]/50 hover:bg-[#0f172a]/80 rounded-lg text-rose-600"><Trash2 className="w-4 h-4"/></button>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>
         )}

         {/* PATTERN TAB */}
         {activeTab === 'pattern' && (() => {
            // if shiftTypes empty
            if (shiftTypes.length === 0) return <div className="mt-6 p-4 bg-amber-900/20 text-amber-400 rounded-lg">Harap buat "Jam Shift" terlebih dahulu di menu pertama.</div>;

            return (
              <div className="mt-6 space-y-6">
                 <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-5 text-indigo-300 text-sm">
                   <h4 className="font-bold flex items-center gap-2 mb-2"><Repeat className="w-4 h-4"/> Konsep Pola Berulang (Rotasi)</h4>
                   <p className="opacity-90">Sistem akan membaca susunan pola yang Anda buat berurutan, mulai dari "Tanggal Mulai Pola". Setelah mencapai urutan terakhir, pola otomatis diulangi dari nomor (hari) pertama sampai selamanya.</p>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-white mb-4 block text-sm">Tambahkan Hari ke Pola</h4>
                      <div className="flex flex-col gap-2">
                         {shiftTypes.map(st => (
                           <button key={st.id} type="button" onClick={()=>setLocalSeq([...localSeq, st.id])} className="w-full text-left p-3 rounded-lg border border-slate-800 hover:border-indigo-500 bg-[#0f172a] shadow-lg flex items-center justify-between">
                             <div>
                               <div className="font-bold text-sm text-white">{st.name}</div>
                               <div className="text-xs text-slate-400">{st.isOffDay ? 'Libur' : `${st.startTime}-${st.endTime}`}</div>
                             </div>
                             <Plus className="w-4 h-4 text-slate-400" />
                           </button>
                         ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-4 block text-sm">Susunan Pola Anda ({localSeq.length} Hari Berulang)</h4>
                      
                      <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Berlaku / Berjalan Pola Ini (Hari Ke-1)</label>
                         <input type="date" value={localStart} onChange={(e)=>setLocalStart(e.target.value)} className="w-full text-sm border-slate-700 rounded-lg pb-2 pt-2 px-3 bg-[#0f172a] text-white"/>
                      </div>

                      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 min-h-[300px] flex flex-col gap-2">
                         {localSeq.length === 0 && <div className="text-center text-sm text-slate-400 py-10">Pola masih kosong. Klik shift di sebelah kiri untuk menyusun pola.</div>}
                         {localSeq.map((shiftId, index) => {
                            const detail = shiftTypes.find(s => s.id === shiftId);
                            return (
                               <div key={`${index}-${shiftId}`} className={`flex items-center justify-between p-3 rounded-lg border shadow-lg ${detail?.color || 'bg-[#0f172a] text-white'}`}>
                                  <div className="flex items-center gap-3">
                                     <span className="font-mono text-xs opacity-50 w-5">H{index+1}</span>
                                     <div className="font-bold text-sm">{detail?.name || 'Shift Dihapus'}</div>
                                  </div>
                                  <button onClick={()=>setLocalSeq(localSeq.filter((_, i) => i !== index))} className="p-1 hover:bg-black/10 rounded"><Trash2 className="w-4 h-4"/></button>
                               </div>
                            )
                         })}
                      </div>

                      <button onClick={()=>handlePatternChange(localSeq, localStart)} className="w-full mt-4 bg-slate-800 text-white font-bold text-sm py-3 rounded-xl hover:bg-slate-700 flex items-center justify-center gap-2">
                         <Repeat className="w-4 h-4"/> Konfirmasi & Simpan Rotasi Pola
                      </button>
                    </div>
                 </div>
              </div>
            );
         })()}

         {/* CALENDAR TAB */}
         {activeTab === 'calendar' && (
           <div className="mt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 w-full flex items-center gap-2">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Bulan View</label>
                    <select value={month} onChange={e => setMonth(e.target.value)} className="w-full border-slate-700 rounded-lg shadow-lg bg-[#0f172a] text-white">
                      {Array.from({length: 12}).map((_, i) => {
                         const m = (i + 1).toString().padStart(2, '0');
                         return <option key={m} value={m}>{format(new Date(2000, i, 1), 'MMMM')}</option>
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Tahun</label>
                    <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-32 border-slate-700 rounded-lg shadow-lg bg-[#0f172a] text-white" />
                  </div>
                </div>
                <div className="flex items-end">
                  <button onClick={handleExport} className="flex items-center gap-2 bg-green-900/20 text-green-400 px-4 py-2 h-10 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors">
                    <Download className="w-4 h-4" /> Export Excel
                  </button>
                  <button onClick={handlePushToApp} disabled={loading} className="flex items-center gap-2 bg-indigo-900/20 text-indigo-400 px-4 py-2 h-10 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50">
                    <Repeat className="w-4 h-4" /> Push Jadwal ke Aplikasi
                  </button>
                </div>
              </div>

              {!pattern ? (
                 <div className="p-10 text-center text-slate-400 bg-[#111827] border border-slate-800 rounded-xl border-dashed">
                    Pola (Pattern) rotasi belum di-define untuk regu ini. Harap atur di kolom ke-2.
                 </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-[#111827] text-slate-300 border-b border-slate-800">
                         <tr>
                           <th className="px-6 py-4 font-bold w-48 border-r border-slate-800">Tanggal</th>
                           <th className="px-6 py-4 font-bold">Shift Generasi Sistem</th>
                           <th className="px-6 py-4 font-bold">Override / Pengecualian?</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800 bg-[#0f172a]">
                         {getDaysInMonth().map(dateStr => {
                            const isOverriden = !!schedules[dateStr];
                            const sVal = getShiftForDate(dateStr);
                            
                            return (
                               <tr key={dateStr} className={`hover:bg-[#111827] ${isOverriden ? 'bg-amber-900/20/30' : ''}`}>
                                 <td className="px-6 py-4 border-r border-slate-800 text-white font-medium">
                                   {format(new Date(dateStr), 'EEEE, dd MMM yyyy')}
                                   {isOverriden && <div className="text-[10px] text-amber-600 font-bold tracking-wider mt-1">(DI-REVISI MANUAL)</div>}
                                 </td>
                                 <td className="px-6 py-4">
                                     {sVal ? (
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${sVal.color}`}>
                                          <div className="font-bold">{sVal.name}</div>
                                          {!sVal.isOffDay && <div className="opacity-80 text-xs px-2 border-l border-current"> {sVal.startTime} - {sVal.endTime} {sVal.isCrossDay&&'(+1)'}</div>}
                                        </div>
                                     ) : <span className="text-slate-400 italic">Belum mencapai tanggal pola</span>}
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <select 
                                         value={schedules[dateStr] || ''} 
                                         onChange={e => {
                                            if (e.target.value) {
                                               handleOverrideShift(dateStr, e.target.value)
                                            } else {
                                               clearOverride(dateStr)
                                            }
                                         }}
                                         className="border-slate-700 text-sm rounded-lg py-1.5 px-3 min-w-[150px] bg-[#0f172a] text-white"
                                      >
                                         <option value="">Ikuti Pola</option>
                                         <optgroup label="Ubah ke / Set Ke:">
                                            {shiftTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                                         </optgroup>
                                      </select>
                                      {isOverriden && (
                                         <button onClick={()=>clearOverride(dateStr)} className="text-xs text-rose-500 font-semibold underline">Hapus Revisi & Kembali ke Pola</button>
                                      )}
                                    </div>
                                 </td>
                               </tr>
                            )
                         })}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
           </div>
         )}
      </div>
    </div>
  );
}

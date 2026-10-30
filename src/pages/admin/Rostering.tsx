import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { db, auth } from '../../lib/firestoreClient';
import { collection, query, where, getDocs, setDoc, doc, addDoc, deleteDoc, batchSetDocs } from '../../lib/firestoreClient';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { format, addDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { 
  Calendar as CalIcon, 
  Calendar, 
  Download, 
  Clock, 
  Repeat, 
  Plus, 
  Trash2, 
  Edit2, 
  ShieldAlert, 
  CheckCircle2, 
  Building2, 
  FileSpreadsheet,
  MapPin,
  Users,
  X,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../../providers/ToastProvider';

interface ShiftType {
  id: string;
  subDepartmentId: string;
  name: string;
  startTime: string;
  endTime: string;
  isCrossDay: boolean;
  isFlexible: boolean;
  isWfa: boolean;
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
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [showBranchExportModal, setShowBranchExportModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('export') === 'branch') {
      setShowBranchExportModal(true);
    }
  }, [searchParams]);

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
  const [editShiftId, setEditShiftId] = useState<string | null>(null);
  const [newShift, setNewShift] = useState<Partial<ShiftType>>({
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    isCrossDay: false,
    isFlexible: false,
    isWfa: false,
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
          const overrideDate = d.overrideDate || d.date;
          if (overrideDate && overrideDate.startsWith(`${year}-${month}`)) {
            map[overrideDate] = d.shiftTypeId;
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
      if (editShiftId) {
        await setDoc(doc(db, 'shift_types', editShiftId), {
          ...newShift,
          updatedAt: Date.now()
        }, { merge: true });
        setShiftTypes(prev => prev.map(s => s.id === editShiftId ? { ...s, ...newShift } as ShiftType : s));
        setEditShiftId(null);
        toast.success('Jam shift berhasil diperbarui');
      } else {
        const docRef = await addDoc(collection(db, 'shift_types'), {
          ...newShift,
          subDepartmentId: selectedSub,
          createdAt: Date.now()
        });
        setShiftTypes(prev => [...prev, { id: docRef.id, ...newShift, subDepartmentId: selectedSub } as ShiftType]);
        toast.success('Jam shift baru berhasil disimpan');
      }
      setNewShift({ name: '', startTime: '08:00', endTime: '17:00', isCrossDay: false, isFlexible: false, isWfa: false, isOffDay: false, color: 'bg-blue-100 text-blue-700' });
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan jam shift: ' + err.message);
    }
  };
  
  const handleEditClick = (st: ShiftType) => {
    setNewShift({
      name: st.name,
      startTime: st.startTime,
      endTime: st.endTime,
      isCrossDay: st.isCrossDay,
      isOffDay: st.isOffDay,
      color: st.color
    });
    setEditShiftId(st.id);
  };
  
  const handleCancelEdit = () => {
    setNewShift({ name: '', startTime: '08:00', endTime: '17:00', isCrossDay: false, isOffDay: false, color: 'bg-blue-100 text-blue-700' });
    setEditShiftId(null);
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
        overrideDate: dateStr,
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

  

  const colors = [
    { label: 'Gray', value: 'bg-gray-100 text-slate-700' },
    { label: 'Red (Libur/Off)', value: 'bg-red-100 text-red-700' },
    { label: 'Blue', value: 'bg-blue-100 text-blue-700' },
    { label: 'Green', value: 'bg-green-100 text-green-700' },
    { label: 'Purple', value: 'bg-purple-100 text-purple-700' },
    { label: 'Amber', value: 'bg-whitember-100 text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dynamic Rostering ({selectedSub && subDepts.find(s=>s.id === selectedSub)?.name})</h2>
          <p className="text-slate-600">Atur jam shift kustom per cabang/regu, lalu atur pola berulang bulanan otomatis.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowBranchExportModal(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
          <span>Export Jadwal Per Cabang (Excel)</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
         <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Pilih Regu / Sub-Bagian Untuk Diatur</label>
              <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-lg bg-white text-slate-900">
                {subDepts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
         </div>
         
         <div className="flex border-b border-slate-200 w-full overflow-x-auto">
            <button onClick={()=>setActiveTab('shifts')} className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab==='shifts' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-700'}`}>1. Master Jam Shift</button>
            <button onClick={()=>setActiveTab('pattern')} className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab==='pattern' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-700'}`}>2. Definisi Pola (Pattern)</button>
            <button onClick={()=>setActiveTab('calendar')} className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab==='calendar' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-700'}`}>3. Kalender (Hasil & Set Pengecualian)</button>
         </div>

         {/* SHIFT TAB */}
         {activeTab === 'shifts' && (
           <div className="mt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                 {/* Form */}
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4"/> {editShiftId ? 'Edit Jam Shift' : 'Tambah Jam Shift Baru'}</h4>
                    <form onSubmit={handleSaveShift} className="space-y-4">
                       <div>
                         <label className="block text-xs font-medium text-slate-600 mb-1">Nama Shift (Misal: Pagi, Malam, Libur)</label>
                         <input required type="text" className="w-full text-sm border-slate-300 rounded-lg bg-white text-slate-900" value={newShift.name} onChange={e=>setNewShift({...newShift, name: e.target.value})} />
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <input type="checkbox" id="isOff" checked={newShift.isOffDay} onChange={e=>setNewShift({...newShift, isOffDay: e.target.checked})} className="rounded text-indigo-600" />
                         <label htmlFor="isOff" className="text-sm text-slate-700 font-medium">Shift ini adalah Hari Libur / Off (Tanpa jam mulai & pulang)</label>
                       </div>

                       {!newShift.isOffDay && (
                         <>
                           {!newShift.isFlexible && (
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
                           )}
                           {!newShift.isFlexible && (
                           <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs shadow-lg">
                             <input type="checkbox" id="cross" checked={newShift.isCrossDay} onChange={e=>setNewShift({...newShift, isCrossDay: e.target.checked})} className="rounded mt-0.5 text-blue-600" />
                             <label htmlFor="cross" className="font-medium leading-relaxed">
                               Lintas Hari (Centang jika jadwal pulang masuk ke hari berikutnya. Misal: Masuk jam 22:00, Pulang jam 07:00 Pagi besoknya)
                             </label>
                           </div>
                           )}
                           
                           <div className="flex items-start gap-2 bg-teal-50 p-3 rounded-lg border border-teal-100 text-teal-800 text-xs shadow-lg">
                             <input type="checkbox" id="flexi" checked={newShift.isFlexible} onChange={e=>setNewShift({...newShift, isFlexible: e.target.checked})} className="rounded mt-0.5 text-teal-600" />
                             <label htmlFor="flexi" className="font-medium leading-relaxed">
                               Flexible Time (Pegawai bebas melakukan absen masuk kapan saja tanpa dihitung terlambat)
                             </label>
                           </div>

                           <div className="flex items-start gap-2 bg-purple-50 p-3 rounded-lg border border-purple-100 text-purple-800 text-xs shadow-lg">
                             <input type="checkbox" id="wfa" checked={newShift.isWfa} onChange={e=>setNewShift({...newShift, isWfa: e.target.checked})} className="rounded mt-0.5 text-purple-600" />
                             <label htmlFor="wfa" className="font-medium leading-relaxed">
                               WFA / Work From Anywhere (Pegawai dapat absen dari lokasi mana saja tanpa dibatasi radius kantor)
                             </label>
                           </div>
                         </>
                       )}

                       <div>
                         <label className="block text-xs font-medium text-slate-600 mb-2">Warna Visual Kelompok</label>
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
                       
                       <div className="flex gap-2">
                         <button type="submit" className="flex-1 bg-blue-600 text-white font-medium text-sm py-2 rounded-lg hover:bg-indigo-700">{editShiftId ? 'Update' : 'Simpan'}</button>
                         {editShiftId && (
                           <button type="button" onClick={handleCancelEdit} className="flex-1 bg-slate-200 text-slate-700 font-medium text-sm py-2 rounded-lg hover:bg-slate-300">Batal</button>
                         )}
                       </div>
                    </form>
                 </div>

                 {/* List */}
                 <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Daftar Shift Tersedia untuk {subDepts.find(s=>s.id === selectedSub)?.name}</h4>
                    {shiftTypes.length === 0 ? <p className="text-sm text-slate-600">Belum ada jam shift dikonfigurasi.</p> : (
                       <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {shiftTypes.map(st => (
                             <div key={st.id} className={`p-4 rounded-xl border flex items-center justify-between ${st.color}`}>
                                <div>
                                   <div className="font-bold">{st.name}</div>
                                   {st.isOffDay ? (
                                     <div className="text-xs opacity-80 mt-1">HARI LIBUR BEBAS TUGAS</div>
                                   ) : (
                                     <div className="text-xs opacity-80 mt-1 flex flex-col gap-1">
                                       {st.isFlexible ? <span>Jam Bebas (Flexible)</span> : <span>{st.startTime} - {st.endTime} {st.isCrossDay && '(Besoknya)'}</span>}
                                       <div className="flex gap-2 mt-1">
                                          {st.isFlexible && <span className="bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded text-[10px] font-bold">FLEXIBLE</span>}
                                          {st.isWfa && <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-bold">WFA</span>}
                                       </div>
                                     </div>
                                   )}
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={()=>handleEditClick(st)} className="p-2 bg-white/50 hover:bg-white/80 rounded-lg text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                  <button onClick={()=>handleDeleteShift(st.id)} className="p-2 bg-white/50 hover:bg-white/80 rounded-lg text-rose-600"><Trash2 className="w-4 h-4"/></button>
                                </div>
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
            if (shiftTypes.length === 0) return <div className="mt-6 p-4 bg-whitember-900/20 text-amber-400 rounded-lg">Harap buat "Jam Shift" terlebih dahulu di menu pertama.</div>;

            return (
              <div className="mt-6 space-y-6">
                 <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-5 text-indigo-300 text-sm">
                   <h4 className="font-bold flex items-center gap-2 mb-2"><Repeat className="w-4 h-4"/> Konsep Pola Berulang (Rotasi)</h4>
                   <p className="opacity-90">Sistem akan membaca susunan pola yang Anda buat berurutan, mulai dari "Tanggal Mulai Pola". Setelah mencapai urutan terakhir, pola otomatis diulangi dari nomor (hari) pertama sampai selamanya.</p>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-4 block text-sm">Tambahkan Hari ke Pola</h4>
                      <div className="flex flex-col gap-2">
                         {shiftTypes.map(st => (
                           <button key={st.id} type="button" onClick={()=>setLocalSeq([...localSeq, st.id])} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-500 bg-white shadow-lg flex items-center justify-between">
                             <div>
                               <div className="font-bold text-sm text-slate-900">{st.name}</div>
                               <div className="text-xs text-slate-600">{st.isOffDay ? 'Libur' : st.isFlexible ? 'Bebas' : `${st.startTime}-${st.endTime}`}</div>
                             </div>
                             <Plus className="w-4 h-4 text-slate-600" />
                           </button>
                         ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-4 block text-sm">Susunan Pola Anda ({localSeq.length} Hari Berulang)</h4>
                      
                      <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Berlaku / Berjalan Pola Ini (Hari Ke-1)</label>
                         <input type="date" value={localStart} onChange={(e)=>setLocalStart(e.target.value)} className="w-full text-sm border-slate-300 rounded-lg pb-2 pt-2 px-3 bg-white text-slate-900"/>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[300px] flex flex-col gap-2">
                         {localSeq.length === 0 && <div className="text-center text-sm text-slate-600 py-10">Pola masih kosong. Klik shift di sebelah kiri untuk menyusun pola.</div>}
                         {localSeq.map((shiftId, index) => {
                            const detail = shiftTypes.find(s => s.id === shiftId);
                            return (
                               <div key={`${index}-${shiftId}`} className={`flex items-center justify-between p-3 rounded-lg border shadow-lg ${detail?.color || 'bg-white text-slate-900'}`}>
                                  <div className="flex items-center gap-3">
                                     <span className="font-mono text-xs opacity-50 w-5">H{index+1}</span>
                                     <div className="font-bold text-sm">{detail?.name || 'Shift Dihapus'}</div>
                                  </div>
                                  <button onClick={()=>setLocalSeq(localSeq.filter((_, i) => i !== index))} className="p-1 hover:bg-black/10 rounded"><Trash2 className="w-4 h-4"/></button>
                               </div>
                            )
                         })}
                      </div>

                      <button onClick={()=>handlePatternChange(localSeq, localStart)} className="w-full mt-4 bg-slate-100 text-slate-900 font-bold text-sm py-3 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2">
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
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Bulan View</label>
                    <select value={month} onChange={e => setMonth(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-lg bg-white text-slate-900">
                      {Array.from({length: 12}).map((_, i) => {
                         const m = (i + 1).toString().padStart(2, '0');
                         return <option key={m} value={m}>{format(new Date(2000, i, 1), 'MMMM')}</option>
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Tahun</label>
                    <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-32 border-slate-300 rounded-lg shadow-lg bg-white text-slate-900" />
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowBranchExportModal(true)} 
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 h-10 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                    title="Export Rekap Jadwal Seluruh Regu & Personel di Lokasi Cabang ke Excel"
                  >
                    <Building2 className="w-4 h-4 text-emerald-100" /> 
                    <span>Export Per Cabang (Seluruh Regu)</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleExport} 
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 h-10 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                    title="Export Excel untuk 1 regu yang sedang aktif saja"
                  >
                    <Download className="w-4 h-4 text-slate-500" /> 
                    <span>Export Regu Ini Saja</span>
                  </button>
                  <div className="hidden xl:flex items-center gap-2 px-3 py-2 h-10 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 
                    <span>Sinkronisasi Otomatis</span>
                  </div>
                </div>
              </div>

              {!pattern ? (
                 <div className="p-10 text-center text-slate-600 bg-slate-50 border border-slate-200 rounded-xl border-dashed">
                    Pola (Pattern) rotasi belum di-define untuk regu ini. Harap atur di kolom ke-2.
                 </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-lg">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                         <tr>
                           <th className="px-6 py-4 font-bold w-48 border-r border-slate-200">Tanggal</th>
                           <th className="px-6 py-4 font-bold">Shift Generasi Sistem</th>
                           <th className="px-6 py-4 font-bold">Override / Pengecualian?</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200 bg-white">
                         {getDaysInMonth().map(dateStr => {
                            const isOverriden = !!schedules[dateStr];
                            const sVal = getShiftForDate(dateStr);
                            
                            return (
                               <tr key={dateStr} className={`hover:bg-slate-50 ${isOverriden ? 'bg-whitember-900/20/30' : ''}`}>
                                 <td className="px-6 py-4 border-r border-slate-200 text-slate-900 font-medium">
                                   {format(new Date(dateStr), 'EEEE, dd MMM yyyy')}
                                   {isOverriden && <div className="text-[10px] text-amber-600 font-bold tracking-wider mt-1">(DI-REVISI MANUAL)</div>}
                                 </td>
                                 <td className="px-6 py-4">
                                     {sVal ? (
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${sVal.color}`}>
                                          <div className="font-bold">{sVal.name}</div>
                                          {!sVal.isOffDay && <div className="opacity-80 text-xs px-2 border-l border-current"> {sVal.isFlexible ? 'Flexible' : `${sVal.startTime} - ${sVal.endTime} ${sVal.isCrossDay?'(+1)':''}`}</div>}
                                        </div>
                                     ) : <span className="text-slate-600 italic">Belum mencapai tanggal pola</span>}
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
                                         className="border-slate-300 text-sm rounded-lg py-1.5 px-3 min-w-[150px] bg-white text-slate-900"
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

      {/* MODAL EXPORT JADWAL PER CABANG (MULTI-SHEET EXCEL) */}
      <ExportBranchRosterModal
        isOpen={showBranchExportModal}
        onClose={() => {
          setShowBranchExportModal(false);
          if (searchParams.get('export')) {
            searchParams.delete('export');
            setSearchParams(searchParams, { replace: true });
          }
        }}
        locations={locations}
        defaultMonth={month}
        defaultYear={year}
      />
    </div>
  );
}

// ==========================================
// EXPORT JADWAL CABANG MODAL (SELF-CONTAINED)
// ==========================================
interface ExportBranchRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: any[];
  defaultLocationId?: string;
  defaultMonth?: string;
  defaultYear?: string;
}

export function ExportBranchRosterModal({
  isOpen,
  onClose,
  locations,
  defaultLocationId = 'all',
  defaultMonth,
  defaultYear
}: ExportBranchRosterModalProps) {
  const toast = useToast();
  const currentDate = new Date();
  
  const [selectedLocationId, setSelectedLocationId] = useState<string>(defaultLocationId || 'all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    defaultMonth || (currentDate.getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    defaultYear || currentDate.getFullYear().toString()
  );

  const [includeReguSheet, setIncludeReguSheet] = useState(true);
  const [includePersonelSheet, setIncludePersonelSheet] = useState(true);
  const [includeMasterSheet, setIncludeMasterSheet] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const monthsList = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const currentYearNum = currentDate.getFullYear();
  const yearsList = [currentYearNum - 1, currentYearNum, currentYearNum + 1, currentYearNum + 2];

  const selectedLocObj = locations.find(l => l.id === selectedLocationId);
  const locationLabel = selectedLocationId === 'all' ? 'Semua Cabang Penempatan' : (selectedLocObj?.name || 'Cabang Terpilih');
  const monthLabel = monthsList.find(m => m.value === selectedMonth)?.label || '';

  const handleDownloadExcel = async () => {
    if (!includeReguSheet && !includePersonelSheet && !includeMasterSheet) {
      toast.error('Pilih minimal satu lembar kerja (worksheet) untuk di-export.');
      return;
    }

    setIsExporting(true);
    try {
      toast.info('Menyiapkan data jadwal cabang dari server...');
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${baseUrl}/api/admin/roster-export-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          month: selectedMonth,
          year: selectedYear
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal memuat data jadwal cabang dari server');
      }

      const data = await res.json();
      const { dates, branches, monthName, allShiftTypes } = data;

      if (!branches || branches.length === 0) {
        toast.error('Tidak ada data cabang yang ditemukan untuk periode ini.');
        setIsExporting(false);
        return;
      }

      const wb = XLSX.utils.book_new();

      // 1. SHEET 1: JADWAL SHIFT REGU (Matrix per Cabang & Regu)
      if (includeReguSheet) {
        const wsDataRegu: any[][] = [];

        // Title Block
        wsDataRegu.push(['PT. GARUDA TRISULA PERKASA']);
        wsDataRegu.push(['LAPORAN JADWAL KERJA / ROSTER SHIFT CABANG PENEMPATAN']);
        wsDataRegu.push(['CABANG PENEMPATAN:', selectedLocationId === 'all' ? 'SEMUA CABANG PENEMPATAN' : (branches[0]?.locationName || '-')]);
        wsDataRegu.push(['PERIODE BULAN:', (monthName || `${monthLabel} ${selectedYear}`).toUpperCase()]);
        wsDataRegu.push(['TANGGAL CETAK:', new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })]);
        wsDataRegu.push([]); // blank

        // Column Headers
        const tableHeaders = [
          'NO',
          'CABANG PENEMPATAN',
          'DEPARTEMEN',
          'REGU / SUB-BAGIAN',
          'JML PERSONEL'
        ];
        dates.forEach((d: any) => {
          tableHeaders.push(`${d.day} (${d.dayName})`);
        });
        tableHeaders.push('TOTAL KERJA', 'TOTAL LIBUR');
        wsDataRegu.push(tableHeaders);

        // Data Rows
        let rowNum = 1;
        let grandTotalEmps = 0;
        let totalRegus = 0;

        branches.forEach((b: any) => {
          b.reguSchedules.forEach((regu: any) => {
            totalRegus++;
            grandTotalEmps += (regu.totalEmployees || 0);
            const row = [
              rowNum++,
              b.locationName,
              regu.departmentName,
              regu.subDepartmentName,
              regu.totalEmployees
            ];
            regu.daily.forEach((d: any) => {
              row.push(d.shiftName);
            });
            row.push(regu.workDays, regu.offDays);
            wsDataRegu.push(row);
          });
        });

        // Summary Row
        wsDataRegu.push([]);
        wsDataRegu.push([
          'TOTAL',
          `${branches.length} Cabang`,
          '-',
          `${totalRegus} Regu Operasional`,
          grandTotalEmps,
          ...dates.map(() => '-'),
          '-',
          '-'
        ]);

        const wsRegu = XLSX.utils.aoa_to_sheet(wsDataRegu);
        XLSX.utils.book_append_sheet(wb, wsRegu, 'Jadwal Shift Regu');
      }

      // 2. SHEET 2: DETAIL JADWAL PERSONEL
      if (includePersonelSheet) {
        const wsDataPersonel: any[][] = [];

        // Title Block
        wsDataPersonel.push(['PT. GARUDA TRISULA PERKASA']);
        wsDataPersonel.push(['JADWAL KERJA DETAIL ANGGOTA / PERSONEL PER CABANG']);
        wsDataPersonel.push(['CABANG PENEMPATAN:', selectedLocationId === 'all' ? 'SEMUA CABANG PENEMPATAN' : (branches[0]?.locationName || '-')]);
        wsDataPersonel.push(['PERIODE BULAN:', (monthName || `${monthLabel} ${selectedYear}`).toUpperCase()]);
        wsDataPersonel.push(['TANGGAL CETAK:', new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })]);
        wsDataPersonel.push([]); // blank

        // Column Headers
        const tableHeadersEmp = [
          'NO',
          'CABANG PENEMPATAN',
          'NIK',
          'NAMA LENGKAP',
          'JABATAN / ROLE',
          'DEPARTEMEN',
          'REGU'
        ];
        dates.forEach((d: any) => {
          tableHeadersEmp.push(`${d.day} (${d.dayName})`);
        });
        tableHeadersEmp.push('TOTAL KERJA', 'TOTAL LIBUR', 'TOTAL IZIN/SAKIT');
        wsDataPersonel.push(tableHeadersEmp);

        // Data Rows
        let empRowNum = 1;
        branches.forEach((b: any) => {
          b.empSchedules.forEach((emp: any) => {
            const row = [
              empRowNum++,
              emp.locationName,
              emp.nik || '-',
              emp.name,
              emp.role,
              emp.departmentName,
              emp.subDepartmentName
            ];
            emp.daily.forEach((d: any) => {
              const text = d.shiftName + (d.exchangeNote ? ` [${d.exchangeNote}]` : '');
              row.push(text);
            });
            row.push(emp.workDays, emp.offDays, emp.leaveDays);
            wsDataPersonel.push(row);
          });
        });

        // Summary Row
        wsDataPersonel.push([]);
        wsDataPersonel.push([
          'TOTAL PERSONEL',
          `${empRowNum - 1} Orang`,
          '-',
          '-',
          '-',
          '-',
          '-',
          ...dates.map(() => '-'),
          '-',
          '-',
          '-'
        ]);

        const wsPersonel = XLSX.utils.aoa_to_sheet(wsDataPersonel);
        XLSX.utils.book_append_sheet(wb, wsPersonel, 'Detail Personel Cabang');
      }

      // 3. SHEET 3: MASTER JAM SHIFT ACUAN
      if (includeMasterSheet && allShiftTypes && allShiftTypes.length > 0) {
        const wsDataMaster: any[][] = [];
        wsDataMaster.push(['PT. GARUDA TRISULA PERKASA']);
        wsDataMaster.push(['DAFTAR MASTER JAM SHIFT OPERASIONAL ACUAN']);
        wsDataMaster.push([]);
        wsDataMaster.push(['NO', 'NAMA SHIFT', 'JAM MASUK', 'JAM PULANG', 'SIFAT / KETERANGAN']);

        allShiftTypes.forEach((st: any, idx: number) => {
          let note = 'Normal';
          if (st.isOffDay) note = 'Hari Libur / Off';
          else if (st.isFlexible) note = 'Flexible Time';
          else if (st.isCrossDay) note = 'Lintas Hari (+1)';

          wsDataMaster.push([
            idx + 1,
            st.name,
            st.isOffDay ? '-' : st.startTime,
            st.isOffDay ? '-' : st.endTime,
            note
          ]);
        });

        const wsMaster = XLSX.utils.aoa_to_sheet(wsDataMaster);
        XLSX.utils.book_append_sheet(wb, wsMaster, 'Master Jam Shift');
      }

      // Generate File
      const locClean = selectedLocationId === 'all'
        ? 'Semua_Cabang'
        : (branches[0]?.locationName || 'Cabang').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeMonthStr = (monthName || `${monthLabel}_${selectedYear}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Jadwal_${locClean}_${safeMonthStr}.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success(`Jadwal cabang berhasil diunduh: ${fileName}`);
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Gagal export jadwal cabang: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Export Jadwal Per Cabang</h3>
              <p className="text-xs text-blue-200">Unduh jadwal kerja seluruh regu & personel per cabang penempatan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Cabang Penempatan Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Cabang Penempatan (Lokasi)
            </label>
            <select
              value={selectedLocationId}
              onChange={e => setSelectedLocationId(e.target.value)}
              className="w-full text-sm border-slate-300 rounded-xl bg-white text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-medium py-2.5 px-3"
            >
              <option value="all">🌟 Semua Cabang Penempatan (Seluruh Lokasi)</option>
              <optgroup label="Pilih Cabang Tertentu:">
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    📍 {loc.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              File Excel akan memuat seluruh departemen dan regu di cabang yang Anda pilih.
            </p>
          </div>

          {/* Month & Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full text-sm border-slate-300 rounded-xl bg-white text-slate-900 shadow-sm font-medium py-2.5 px-3"
              >
                {monthsList.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tahun
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full text-sm border-slate-300 rounded-xl bg-white text-slate-900 shadow-sm font-medium py-2.5 px-3"
              >
                {yearsList.map(y => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Worksheet Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilihan Lembar Kerja (Sheets Excel)
            </label>
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeReguSheet}
                  onChange={e => setIncludeReguSheet(e.target.checked)}
                  className="rounded text-blue-600 mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">1. Sheet Jadwal Shift Regu & Departemen</div>
                  <div className="text-[11px] text-slate-500">
                    Matrix jadwal kerja per departemen dan regu dari tanggal 1 s/d akhir bulan (format rekapitulasi cabang).
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  checked={includePersonelSheet}
                  onChange={e => setIncludePersonelSheet(e.target.checked)}
                  className="rounded text-blue-600 mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">2. Sheet Detail Jadwal Personel</div>
                  <div className="text-[11px] text-slate-500">
                    Matrix per nama karyawan & NIK, mencakup jadwal shift, status izin/sakit, dan catatan tukar jadwal.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  checked={includeMasterSheet}
                  onChange={e => setIncludeMasterSheet(e.target.checked)}
                  className="rounded text-blue-600 mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">3. Sheet Daftar Master Jam Shift</div>
                  <div className="text-[11px] text-slate-500">
                    Daftar referensi jam masuk, jam pulang, dan jenis shift operasional.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold block text-blue-950">Target Export:</span>
              <span className="font-semibold text-blue-800">{locationLabel}</span>
              <span className="text-blue-600 block text-[11px]">Periode: {monthLabel} {selectedYear}</span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Format .xlsx
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Excel...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Excel Jadwal (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

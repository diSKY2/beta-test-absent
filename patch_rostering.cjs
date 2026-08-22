const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Rostering.tsx', 'utf8');

code = code.replace(
  `const [newShift, setNewShift] = useState<Partial<ShiftType>>({`,
  `const [editShiftId, setEditShiftId] = useState<string | null>(null);
  const [newShift, setNewShift] = useState<Partial<ShiftType>>({`
);

code = code.replace(
  `  const handleSaveShift = async (e: React.FormEvent) => {
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
  };`,
  `  const handleSaveShift = async (e: React.FormEvent) => {
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
      setNewShift({ name: '', startTime: '08:00', endTime: '17:00', isCrossDay: false, isOffDay: false, color: 'bg-blue-100 text-blue-700' });
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
  };`
);

code = code.replace(
  `                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4"/> Tambah Jam Shift Baru</h4>`,
  `                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4"/> {editShiftId ? 'Edit Jam Shift' : 'Tambah Jam Shift Baru'}</h4>`
);

code = code.replace(
  `                       <button type="submit" className="w-full bg-blue-600 text-white font-medium text-sm py-2 rounded-lg hover:bg-indigo-700">Simpan Jam Shift</button>`,
  `                       <div className="flex gap-2">
                         <button type="submit" className="flex-1 bg-blue-600 text-white font-medium text-sm py-2 rounded-lg hover:bg-indigo-700">{editShiftId ? 'Update' : 'Simpan'}</button>
                         {editShiftId && (
                           <button type="button" onClick={handleCancelEdit} className="flex-1 bg-slate-200 text-slate-700 font-medium text-sm py-2 rounded-lg hover:bg-slate-300">Batal</button>
                         )}
                       </div>`
);

code = code.replace(
  `<Trash2 className="w-4 h-4"/></button>`,
  `<Trash2 className="w-4 h-4"/></button>
                                </div>`
);

code = code.replace(
  `<button onClick={()=>handleDeleteShift(st.id)} className="p-2 bg-white/50 hover:bg-white/80 rounded-lg text-rose-600"><Trash2 className="w-4 h-4"/></button>`,
  `<div className="flex gap-1">
                                  <button onClick={()=>handleEditClick(st)} className="p-2 bg-white/50 hover:bg-white/80 rounded-lg text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                  <button onClick={()=>handleDeleteShift(st.id)} className="p-2 bg-white/50 hover:bg-white/80 rounded-lg text-rose-600"><Trash2 className="w-4 h-4"/></button>`
);

fs.writeFileSync('src/pages/admin/Rostering.tsx', code);

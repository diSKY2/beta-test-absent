import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firestoreClient';
import { collection, query, getDocs, addDoc, deleteDoc, doc, onSnapshot } from '../../lib/firestoreClient';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { Map, MapPin, Trash2, PlusCircle, Building } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';

export default function Geofencing() {
  const toast = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepts, setSubDepts] = useState<any[]>([]);
  
  const [locForm, setLocForm] = useState({ name: '', latitude: '', longitude: '', radius: '' });
  const [deptForm, setDeptForm] = useState({ name: '', locationId: '' });
  const [subForm, setSubForm] = useState({ name: '', departmentId: '' });

  useEffect(() => {
    const unsubscibes = [
      onSnapshot(collection(db, 'locations'), snap => setLocations(snap.docs.map(d => ({id: d.id, ...d.data()}))), e => handleFirestoreError(e, OperationType.GET, 'locations', auth)),
      onSnapshot(collection(db, 'departments'), snap => setDepartments(snap.docs.map(d => ({id: d.id, ...d.data()}))), e => handleFirestoreError(e, OperationType.GET, 'departments', auth)),
      onSnapshot(collection(db, 'sub_departments'), snap => setSubDepts(snap.docs.map(d => ({id: d.id, ...d.data()}))), e => handleFirestoreError(e, OperationType.GET, 'sub_departments', auth))
    ];
    return () => unsubscibes.forEach(un => un());
  }, []);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!locForm.name || !locForm.latitude || !locForm.longitude || !locForm.radius) return;
    try {
      await addDoc(collection(db, 'locations'), {
        name: locForm.name,
        latitude: Number(locForm.latitude),
        longitude: Number(locForm.longitude),
        radius: Number(locForm.radius),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success(`Lokasi/Cabang "${locForm.name}" berhasil ditambahkan`);
      setLocForm({ name: '', latitude: '', longitude: '', radius: '' });
    } catch(err: any) {
      toast.error('Gagal menambahkan lokasi: ' + err.message);
      handleFirestoreError(err, OperationType.CREATE, 'locations', auth);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!deptForm.name || !deptForm.locationId) return;
    try {
      await addDoc(collection(db, 'departments'), {
        name: deptForm.name,
        locationId: deptForm.locationId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success(`Departemen "${deptForm.name}" berhasil ditambahkan`);
      setDeptForm({ name: '', locationId: '' });
    } catch(err: any) {
      toast.error('Gagal menambahkan departemen: ' + err.message);
      handleFirestoreError(err, OperationType.CREATE, 'departments', auth);
    }
  };

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!subForm.name || !subForm.departmentId) return;
    try {
      await addDoc(collection(db, 'sub_departments'), {
        name: subForm.name,
        departmentId: subForm.departmentId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success(`Regu "${subForm.name}" berhasil ditambahkan`);
      setSubForm({ name: '', departmentId: '' });
    } catch(err: any) {
      toast.error('Gagal menambahkan regu: ' + err.message);
      handleFirestoreError(err, OperationType.CREATE, 'sub_departments', auth);
    }
  };

  const deleteRecord = async (col: string, id: string) => {
    try {
       await deleteDoc(doc(db, col, id));
       toast.success('Data berhasil dihapus');
    } catch(err: any) {
       toast.error('Gagal menghapus data: ' + err.message);
       handleFirestoreError(err, OperationType.DELETE, col, auth);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Geofencing & Setup Hirarki</h2>
        <p className="text-slate-600">Atur titik absen pabrik/cabang dan hirarki departemen.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* LOKASI ROW */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
           <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
               <MapPin className="w-4 h-4 text-rose-500" />
             </div>
             Lokasi/Cabang
           </h3>
           <form onSubmit={handleAddLocation} className="space-y-3 mb-6">
             <input required type="text" placeholder="Nama Cabang" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={locForm.name} onChange={e=>setLocForm({...locForm, name: e.target.value})} />
             <div className="grid grid-cols-2 gap-3">
               <input required type="number" step="any" placeholder="Latitude" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={locForm.latitude} onChange={e=>setLocForm({...locForm, latitude: e.target.value})} />
               <input required type="number" step="any" placeholder="Longitude" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={locForm.longitude} onChange={e=>setLocForm({...locForm, longitude: e.target.value})} />
             </div>
             <input required type="number" placeholder="Radius Toleransi (Meter)" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={locForm.radius} onChange={e=>setLocForm({...locForm, radius: e.target.value})} />
             <button type="submit" className="w-full bg-blue-700 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4"/> Tambah Lokasi</button>
           </form>

           <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
             {locations.map(l => (
                <div key={l.id} className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center group hover:shadow-sm transition-all">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0C2461] flex items-center justify-center shrink-0">
                       <MapPin className="w-5 h-5" />
                     </div>
                     <div>
                       <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">CABANG UTAMA</div>
                       <div className="font-extrabold text-sm text-[#0C2461] uppercase leading-tight">{l.name}</div>
                       <div className="text-[9px] text-slate-500 font-mono mt-1">COORD: {l.latitude}, {l.longitude} • RADIUS: {l.radius} M</div>
                     </div>
                   </div>
                   <button onClick={() => deleteRecord('locations', l.id)} className="text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors "><Trash2 className="w-4 h-4"/></button>
                </div>
             ))}
           </div>
        </div>

        {/* DEPARTEMEN ROW */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
           <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               <Building className="w-4 h-4 text-blue-500" />
             </div>
             Departemen/Bagian
           </h3>
           <form onSubmit={handleAddDept} className="space-y-3 mb-6">
             <input required type="text" placeholder="Nama Bagian" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={deptForm.name} onChange={e=>setDeptForm({...deptForm, name: e.target.value})} />
             <select required className="w-full text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={deptForm.locationId} onChange={e=>setDeptForm({...deptForm, locationId: e.target.value})}>
                <option value="" className="text-slate-600">Pilih Cabang Induk...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
             </select>
             <button type="submit" className="w-full bg-blue-600 text-slate-900 rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4"/> Tambah Bagian</button>
           </form>

           <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
             {departments.map(d => {
                const pLoc = locations.find(l => l.id === d.locationId);
                return (
                  <div key={d.id} className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center group hover:shadow-sm transition-all">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                         <Building className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">DEPARTEMEN INDUK</div>
                         <div className="font-extrabold text-sm text-[#0C2461] uppercase leading-tight">{d.name}</div>
                         <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{pLoc?.name || 'Cabang Belum Ditautkan'}</div>
                       </div>
                     </div>
                     <button onClick={() => deleteRecord('departments', d.id)} className="text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors "><Trash2 className="w-4 h-4"/></button>
                  </div>
                )
             })}
           </div>
        </div>

        {/* SUB REGULAR ROW */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
           <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
               <Map className="w-4 h-4 text-emerald-500" />
             </div>
             Sub-Bagian/Regu
           </h3>
           <form onSubmit={handleAddSub} className="space-y-3 mb-6">
             <input required type="text" placeholder="Nama Regu" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={subForm.name} onChange={e=>setSubForm({...subForm, name: e.target.value})} />
             <select required className="w-full text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={subForm.departmentId} onChange={e=>setSubForm({...subForm, departmentId: e.target.value})}>
                <option value="" className="text-slate-600">Pilih Bagian Induk...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
             </select>
             <button type="submit" className="w-full bg-emerald-600 text-slate-900 rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4"/> Tambah Regu</button>
           </form>

           <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
             {subDepts.map(s => {
                const pDept = departments.find(d => d.id === s.departmentId);
                return (
                  <div key={s.id} className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center group hover:shadow-sm transition-all">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                         <Map className="w-5 h-5" strokeWidth={2.5} />
                       </div>
                       <div>
                         <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">REGU OPERASIONAL</div>
                         <div className="font-extrabold text-sm text-[#0C2461] uppercase leading-tight">{s.name}</div>
                         <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{pDept?.name || 'Bagian Belum Ditautkan'}</div>
                       </div>
                     </div>
                     <button onClick={() => deleteRecord('sub_departments', s.id)} className="text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors "><Trash2 className="w-4 h-4"/></button>
                  </div>
                )
             })}
           </div>
        </div>

      </div>
    </div>
  );
}

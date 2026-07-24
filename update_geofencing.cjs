const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firestoreClient';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from '../../lib/firestoreClient';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { Map, MapPin, Trash2, PlusCircle, Building, ChevronDown, ChevronRight, Edit2, X, Check } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';

export default function Geofencing() {
  const toast = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepts, setSubDepts] = useState<any[]>([]);

  // Form states
  const [locForm, setLocForm] = useState({ name: '', latitude: '', longitude: '', radius: '' });
  const [deptForm, setDeptForm] = useState({ name: '', locationId: '' });
  const [subForm, setSubForm] = useState({ name: '', departmentId: '' });

  // UI States
  const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // Edit States
  const [editLocId, setEditLocId] = useState<string | null>(null);
  const [editLocForm, setEditLocForm] = useState({ name: '', latitude: '', longitude: '', radius: '' });
  
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [editDeptForm, setEditDeptForm] = useState({ name: '' });

  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editSubForm, setEditSubForm] = useState({ name: '' });

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
      toast.success(\`Lokasi "\${locForm.name}" berhasil ditambahkan\`);
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
      toast.success(\`Departemen "\${deptForm.name}" berhasil ditambahkan\`);
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
      toast.success(\`Sub-bagian "\${subForm.name}" berhasil ditambahkan\`);
      setSubForm({ name: '', departmentId: '' });
    } catch(err: any) {
      toast.error('Gagal menambahkan sub-bagian: ' + err.message);
      handleFirestoreError(err, OperationType.CREATE, 'sub_departments', auth);
    }
  };

  const deleteRecord = async (col: string, id: string) => {
    if(confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await deleteDoc(doc(db, col, id));
        toast.success('Data berhasil dihapus');
      } catch(err: any) {
        toast.error('Gagal menghapus data: ' + err.message);
        handleFirestoreError(err, OperationType.DELETE, col, auth);
      }
    }
  };

  const saveLocEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'locations', id), {
        name: editLocForm.name,
        latitude: Number(editLocForm.latitude),
        longitude: Number(editLocForm.longitude),
        radius: Number(editLocForm.radius),
        updatedAt: Date.now()
      });
      toast.success('Lokasi berhasil diupdate');
      setEditLocId(null);
    } catch(e: any) {
      toast.error('Gagal update: ' + e.message);
    }
  };

  const saveDeptEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'departments', id), {
        name: editDeptForm.name,
        updatedAt: Date.now()
      });
      toast.success('Departemen berhasil diupdate');
      setEditDeptId(null);
    } catch(e: any) {
      toast.error('Gagal update: ' + e.message);
    }
  };

  const saveSubEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'sub_departments', id), {
        name: editSubForm.name,
        updatedAt: Date.now()
      });
      toast.success('Sub-bagian berhasil diupdate');
      setEditSubId(null);
    } catch(e: any) {
      toast.error('Gagal update: ' + e.message);
    }
  };

  const toggleLoc = (id: string) => {
    setExpandedLocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Multi-Cabang Geofencing</h2>
        <p className="text-slate-600">Kelola hierarki struktur organisasi (Cabang &rarr; Departemen &rarr; Regu) dan titik absensi (Geofencing).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ADD FORMS (Sidebar) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
               <MapPin className="w-4 h-4 text-blue-500" /> Tambah Lokasi / Cabang
             </h3>
             <form onSubmit={handleAddLocation} className="space-y-3">
               <input required type="text" placeholder="Nama Cabang" className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500" value={locForm.name} onChange={e=>setLocForm({...locForm, name: e.target.value})} />
               <div className="grid grid-cols-2 gap-3">
                 <input required type="number" step="any" placeholder="Latitude" className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500" value={locForm.latitude} onChange={e=>setLocForm({...locForm, latitude: e.target.value})} />
                 <input required type="number" step="any" placeholder="Longitude" className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500" value={locForm.longitude} onChange={e=>setLocForm({...locForm, longitude: e.target.value})} />
               </div>
               <input required type="number" placeholder="Radius (Meter)" className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500" value={locForm.radius} onChange={e=>setLocForm({...locForm, radius: e.target.value})} />
               <button type="submit" className="w-full bg-blue-700 text-white rounded-lg py-2.5 text-xs font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4"/> Simpan</button>
             </form>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
               <Building className="w-4 h-4 text-emerald-500" /> Tambah Departemen
             </h3>
             <form onSubmit={handleAddDept} className="space-y-3">
               <input required type="text" placeholder="Nama Departemen" className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500" value={deptForm.name} onChange={e=>setDeptForm({...deptForm, name: e.target.value})} />
               <select required className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500" value={deptForm.locationId} onChange={e=>setDeptForm({...deptForm, locationId: e.target.value})}>
                  <option value="">Pilih Cabang Induk...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
               </select>
               <button type="submit" className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-xs font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4"/> Simpan</button>
             </form>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
               <Map className="w-4 h-4 text-purple-500" /> Tambah Regu / Sub-Bagian
             </h3>
             <form onSubmit={handleAddSub} className="space-y-3">
               <input required type="text" placeholder="Nama Regu" className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500" value={subForm.name} onChange={e=>setSubForm({...subForm, name: e.target.value})} />
               <select required className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500" value={subForm.departmentId} onChange={e=>setSubForm({...subForm, departmentId: e.target.value})}>
                  <option value="">Pilih Departemen Induk...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({locations.find(l => l.id === d.locationId)?.name || '?'})</option>)}
               </select>
               <button type="submit" className="w-full bg-purple-600 text-white rounded-lg py-2.5 text-xs font-bold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4"/> Simpan</button>
             </form>
          </div>
        </div>

        {/* STRUCTURE TREE */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <h3 className="font-bold text-slate-900">Hierarki Organisasi & Lokasi</h3>
            <p className="text-xs text-slate-500 mt-1">Klik pada nama Cabang/Departemen untuk memperluas.</p>
          </div>

          <div className="p-4 overflow-y-auto no-scrollbar flex-grow space-y-3 bg-slate-50/50">
            {locations.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm italic">Belum ada data lokasi.</div>
            )}
            
            {locations.map(loc => {
              const locDepts = departments.filter(d => d.locationId === loc.id);
              const isLocExpanded = !!expandedLocs[loc.id];
              const isEditingLoc = editLocId === loc.id;

              return (
                <div key={loc.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
                  
                  {/* LOCATION HEADER */}
                  <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => !isEditingLoc && toggleLoc(loc.id)}>
                      <button className="text-slate-400 hover:text-slate-600 shrink-0">
                        {isLocExpanded ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      
                      {isEditingLoc ? (
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2" onClick={e => e.stopPropagation()}>
                          <input type="text" className="text-xs p-1.5 border border-slate-300 rounded" value={editLocForm.name} onChange={e => setEditLocForm({...editLocForm, name: e.target.value})} placeholder="Nama"/>
                          <input type="number" className="text-xs p-1.5 border border-slate-300 rounded" value={editLocForm.latitude} onChange={e => setEditLocForm({...editLocForm, latitude: e.target.value})} placeholder="Lat"/>
                          <input type="number" className="text-xs p-1.5 border border-slate-300 rounded" value={editLocForm.longitude} onChange={e => setEditLocForm({...editLocForm, longitude: e.target.value})} placeholder="Long"/>
                          <input type="number" className="text-xs p-1.5 border border-slate-300 rounded" value={editLocForm.radius} onChange={e => setEditLocForm({...editLocForm, radius: e.target.value})} placeholder="Rad"/>
                        </div>
                      ) : (
                        <div className="truncate pr-4">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{loc.name}</h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {loc.latitude}, {loc.longitude} | R: {loc.radius}m
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isEditingLoc ? (
                        <>
                          <button onClick={() => saveLocEdit(loc.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-4 h-4"/></button>
                          <button onClick={() => setEditLocId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4"/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditLocId(loc.id); setEditLocForm({name: loc.name, latitude: String(loc.latitude), longitude: String(loc.longitude), radius: String(loc.radius)}); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => deleteRecord('locations', loc.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* DEPARTMENTS LIST */}
                  {isLocExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {locDepts.length === 0 ? (
                        <div className="p-4 text-xs text-slate-400 italic pl-14">Tidak ada departemen di lokasi ini.</div>
                      ) : locDepts.map(dept => {
                        const deptSubs = subDepts.filter(s => s.departmentId === dept.id);
                        const isDeptExpanded = !!expandedDepts[dept.id];
                        const isEditingDept = editDeptId === dept.id;

                        return (
                          <div key={dept.id} className="border-b border-slate-100 last:border-0">
                            
                            {/* DEPARTMENT HEADER */}
                            <div className="flex items-center justify-between p-2 sm:p-3 pl-8 sm:pl-10 hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => !isEditingDept && toggleDept(dept.id)}>
                                <button className="text-slate-400 hover:text-slate-600 shrink-0">
                                  {isDeptExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                                </button>
                                <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <Building className="w-3.5 h-3.5" />
                                </div>
                                
                                {isEditingDept ? (
                                  <div className="flex-1 pr-4" onClick={e => e.stopPropagation()}>
                                    <input type="text" className="w-full text-xs p-1.5 border border-slate-300 rounded" value={editDeptForm.name} onChange={e => setEditDeptForm({...editDeptForm, name: e.target.value})} placeholder="Nama Departemen"/>
                                  </div>
                                ) : (
                                  <h5 className="font-bold text-slate-700 text-xs sm:text-sm truncate pr-4">{dept.name}</h5>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                {isEditingDept ? (
                                  <>
                                    <button onClick={() => saveDeptEdit(dept.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-4 h-4"/></button>
                                    <button onClick={() => setEditDeptId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4"/></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setEditDeptId(dept.id); setEditDeptForm({name: dept.name}); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit2 className="w-3.5 h-3.5"/></button>
                                    <button onClick={() => deleteRecord('departments', dept.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* SUB DEPARTMENTS LIST */}
                            {isDeptExpanded && (
                              <div className="bg-slate-100/50 pb-2">
                                {deptSubs.length === 0 ? (
                                  <div className="p-2 text-[11px] text-slate-400 italic pl-20">Tidak ada regu di departemen ini.</div>
                                ) : deptSubs.map(sub => {
                                  const isEditingSub = editSubId === sub.id;

                                  return (
                                    <div key={sub.id} className="flex items-center justify-between p-2 pl-16 sm:pl-20 hover:bg-slate-200/50 transition-colors">
                                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                          <Map className="w-3 h-3" />
                                        </div>
                                        
                                        {isEditingSub ? (
                                          <div className="flex-1 pr-4">
                                            <input type="text" className="w-full text-xs p-1 border border-slate-300 rounded" value={editSubForm.name} onChange={e => setEditSubForm({...editSubForm, name: e.target.value})} placeholder="Nama Regu"/>
                                          </div>
                                        ) : (
                                          <span className="font-semibold text-slate-600 text-[11px] sm:text-xs truncate pr-4">{sub.name}</span>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-1 shrink-0">
                                        {isEditingSub ? (
                                          <>
                                            <button onClick={() => saveSubEdit(sub.id)} className="p-1 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-3.5 h-3.5"/></button>
                                            <button onClick={() => setEditSubId(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded-lg"><X className="w-3.5 h-3.5"/></button>
                                          </>
                                        ) : (
                                          <>
                                            <button onClick={() => { setEditSubId(sub.id); setEditSubForm({name: sub.name}); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg"><Edit2 className="w-3 h-3"/></button>
                                            <button onClick={() => deleteRecord('sub_departments', sub.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg"><Trash2 className="w-3 h-3"/></button>
                                          </>
                                        )}
                                      </div>
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
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/admin/Geofencing.tsx', code);

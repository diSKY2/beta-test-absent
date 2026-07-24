import React, { useState, useEffect } from 'react';
import { db, storage } from '../../lib/firestoreClient';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../../lib/firestoreClient';
import { ref, uploadBytesResumable, getDownloadURL } from '../../lib/firestoreClient';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { auth } from '../../lib/firestoreClient';
import { UserPlus, Pencil, Trash2, MapPin, Plus, X, ChevronDown, ChevronRight, Building, Map } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';

interface ComponentAmount { id: string; name: string; amount: string; isFixedName?: boolean; }

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  state = { hasError: false, error: null };
  constructor(props: {children: React.ReactNode}) {
    super(props);
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-rose-500 font-mono whitespace-pre-wrap"><h2>Something went wrong in OrgStructure:</h2>{String(this.state.error?.stack || this.state.error)}</div>;
    }
    // @ts-ignore
    return this.props.children;
  }
}

export default function OrgStructureWrapper() {
  return (
    <ErrorBoundary>
      <OrgStructure />
    </ErrorBoundary>
  );
}

function OrgStructure() {
  const toast = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Selection states for form
  const [selLoc, setSelLoc] = useState('');
  const [selDept, setSelDept] = useState('');
  const [selSub, setSelSub] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});
  
  const toggleLoc = (id: string) => setExpandedLocs(prev => ({...prev, [id]: !prev[id]}));
  const toggleDept = (id: string) => setExpandedDepts(prev => ({...prev, [id]: !prev[id]}));
  const toggleSub = (id: string) => setExpandedSubs(prev => ({...prev, [id]: !prev[id]}));

  const [form, setForm] = useState({ name: '', role: 'Anggota', baseSalary: '', nik: '', password: '', profilePicUrl: '', status: 'Aktif' });
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadProfilePic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 2) {
      toast.error('Ukuran maksimal foto adalah 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setForm(prev => ({ ...prev, profilePicUrl: dataUrl }));
        setIsUploading(false);
        toast.success('Foto profil berhasil diupload');
      };
      reader.onerror = (error) => {
        console.error(error);
        toast.error('Gagal membaca file gambar');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error(error);
      toast.error('Terjadi kesalahan saat memproses gambar');
      setIsUploading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({...prev, password: result}));
  };

  const generateNIK = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({...prev, nik: `GT${random}`}));
  };
  
  const [allowances, setAllowances] = useState<ComponentAmount[]>([
    { id: 't-jabatan', name: 'Tunjangan Jabatan', amount: '', isFixedName: false }
  ]);
  
  const [deductions, setDeductions] = useState<ComponentAmount[]>([
    { id: 'p-bpjstk', name: 'BPJS Ketenagakerjaan', amount: '', isFixedName: false },
    { id: 'p-bpjskes', name: 'BPJS Kesehatan', amount: '', isFixedName: false }
  ]);

  useEffect(() => {
    const unsubscibes = [
      onSnapshot(collection(db, 'locations'), snap => setLocations(snap.docs.map(d => ({id: d.id, ...d.data()}))), e => handleFirestoreError(e, OperationType.GET, 'locations', auth)),
      onSnapshot(collection(db, 'departments'), snap => setDepartments(snap.docs.map(d => ({id: d.id, ...d.data()}))), e => handleFirestoreError(e, OperationType.GET, 'departments', auth)),
      onSnapshot(collection(db, 'sub_departments'), snap => setSubDepartments(snap.docs.map(d => ({id: d.id, ...d.data()}))), e => handleFirestoreError(e, OperationType.GET, 'sub_departments', auth)),
      onSnapshot(collection(db, 'employees'), snap => setEmployees(snap.docs.map(d => ({id: d.id, ...d.data()}))), e => handleFirestoreError(e, OperationType.GET, 'employees', auth))
    ];
    return () => unsubscibes.forEach(un => un());
  }, []);

  const resetForm = () => {
    setEditId(null);
    setForm({ name: '', role: 'Anggota', baseSalary: '', nik: '', password: '', profilePicUrl: '', status: 'Aktif' });
    setAllowances([{ id: 't-jabatan', name: 'Tunjangan Jabatan', amount: '', isFixedName: false }]);
    setDeductions([
      { id: 'p-bpjstk', name: 'BPJS Ketenagakerjaan', amount: '', isFixedName: false },
      { id: 'p-bpjskes', name: 'BPJS Kesehatan', amount: '', isFixedName: false }
    ]);
  };

  const handleEdit = (employee: any) => {
    setSelLoc(employee.locationId);
    setSelDept(employee.departmentId);
    setSelSub(employee.subDepartmentId);
    setForm({
      name: employee.name,
      role: employee.role,
      nik: employee.nik || '',
      password: employee.password || '',
      baseSalary: employee.baseSalary?.toString() || '',
      profilePicUrl: employee.profilePicUrl || '',
      status: employee.status || 'Aktif'
    });
    
    if (employee.allowances && employee.allowances.length > 0) {
      setAllowances(employee.allowances.map((a: any) => ({
        id: Math.random().toString(),
        name: a.name,
        amount: a.amount?.toString() || '',
        isFixedName: false
      })));
    } else {
      setAllowances([]);
    }

    if (employee.deductions && employee.deductions.length > 0) {
      setDeductions(employee.deductions.map((d: any) => ({
        id: Math.random().toString(),
        name: d.name,
        amount: d.amount?.toString() || '',
        isFixedName: false
      })));
    } else {
      setDeductions([]);
    }
    
    setEditId(employee.id);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selLoc || !selDept || !selSub || !form.name || !form.role || !form.baseSalary || !form.nik || !form.password) return;
    try {
      const payload: any = {
        name: form.name,
        role: form.role,
        nik: form.nik,
        password: form.password,
        baseSalary: Number(form.baseSalary),
        allowances: allowances.filter(a => a.name && a.amount).map(a => ({ name: a.name, amount: Number(a.amount) })),
        deductions: deductions.filter(d => d.name && d.amount).map(d => ({ name: d.name, amount: Number(d.amount) })),
        locationId: selLoc,
        departmentId: selDept,
        subDepartmentId: selSub,
        profilePicUrl: form.profilePicUrl || '',
        status: form.status || 'Aktif',
        updatedAt: Date.now()
      };

      if (editId) {
        await updateDoc(doc(db, 'employees', editId), payload);
        toast.success(`Data pegawai "${form.name}" berhasil diperbarui`);
      } else {
        await addDoc(collection(db, 'employees'), {
          ...payload,
          createdAt: Date.now(),
        });
        toast.success(`Pegawai baru "${form.name}" berhasil ditambahkan`);
      }
      resetForm();
    } catch(err: any) {
      toast.error('Gagal menyimpan data pegawai: ' + err.message);
      handleFirestoreError(err, editId ? OperationType.UPDATE : OperationType.CREATE, 'employees', auth);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      toast.success('Data pegawai berhasil dihapus');
      if (editId === id) resetForm();
    } catch(e: any) {
      toast.error('Gagal menghapus data pegawai: ' + e.message);
      handleFirestoreError(e, OperationType.DELETE, 'employees', auth);
    }
  }

  // General adder/remover for tunjangan/potongan
  const addAllowance = () => {
    if (allowances.length < 5) setAllowances([...allowances, { id: Math.random().toString(), name: '', amount: '' }]);
  };
  const removeAllowance = (id: string) => {
    setAllowances(allowances.filter(a => a.id !== id));
  };
  const updateAllowance = (id: string, field: 'name'|'amount', val: string) => {
    setAllowances(allowances.map(a => a.id === id ? { ...a, [field]: val } : a));
  };

  const addDeduction = () => {
    if (deductions.length < 5) setDeductions([...deductions, { id: Math.random().toString(), name: '', amount: '' }]);
  };
  const removeDeduction = (id: string) => {
    setDeductions(deductions.filter(d => d.id !== id));
  };
  const updateDeduction = (id: string, field: 'name'|'amount', val: string) => {
    setDeductions(deductions.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  // Tree View data modeling
  const renderTree = () => {
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Manajemen Pegawai & Organisasi</h2>
        <p className="text-slate-600">Struktur berjenjang dan manajemen opsi pegawai.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-fit max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                {editId ? <Pencil className="w-4 h-4 text-blue-500" /> : <UserPlus className="w-4 h-4 text-blue-500" />}
              </div>
              {editId ? 'Edit Pegawai' : 'Tambah Pegawai'}
            </h3>
            {editId && (
               <button onClick={resetForm} className="text-slate-600 hover:text-slate-900 transition-colors text-xs font-semibold px-2 py-1 border border-slate-300 bg-slate-100 rounded">
                 Batal Edit
               </button>
            )}
          </div>
          <form onSubmit={handleAddEmployee} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Lokasi Cabang</label>
              <select required className="w-full text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={selLoc} onChange={e => {setSelLoc(e.target.value); setSelDept(''); setSelSub('');}}>
                <option value="" className="text-slate-600">Pilih Lokasi</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Bagian (Departemen)</label>
              <select required className="w-full text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={selDept} onChange={e => {setSelDept(e.target.value); setSelSub('');}} disabled={!selLoc}>
                <option value="" className="text-slate-600">Pilih Bagian</option>
                {departments.filter(d => d.locationId === selLoc).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Sub-Bagian (Regu)</label>
              <select required className="w-full text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={selSub} onChange={e => setSelSub(e.target.value)} disabled={!selDept}>
                <option value="" className="text-slate-600">Pilih Sub-Bagian</option>
                {subDepartments.filter(s => s.departmentId === selDept).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="pt-4 border-t border-slate-200 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Foto Profil</label>
                 <div className="flex items-center gap-4">
                    {form.profilePicUrl ? (
                      <div className="relative group w-16 h-16">
                         <img src={form.profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-slate-300" />
                         <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer text-[10px] text-slate-900 font-bold text-center">Ubah<input type="file" hidden accept="image/*" onChange={handleUploadProfilePic} disabled={isUploading} /></label>
                         </div>
                      </div>
                    ) : (
                      <label className={`w-16 h-16 rounded-full bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="text-[10px] text-slate-600 font-bold">{isUploading ? '...' : 'Upload'}</div>
                        <input type="file" hidden accept="image/*" onChange={handleUploadProfilePic} disabled={isUploading} />
                      </label>
                    )}
                    <div className="text-xs text-slate-500">
                       <p>Format: JPG, PNG maksimal 2MB.</p>
                       <p>Foto untuk pembanding selfie absensi.</p>
                    </div>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Nama Pegawai</label>
                 <input required type="text" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Masukkan nama panggilan / lengkap" />
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Jabatan / Role</label>
                  <select required className="w-full text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
                    <option value="Anggota">Anggota</option>
                    <option value="Ketua">Ketua</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Status Akun Karyawan</label>
                  <select required className="w-full text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={form.status || 'Aktif'} onChange={e=>setForm({...form, status: e.target.value as any})}>
                    <option value="Aktif">Aktif / Beroperasi</option>
                    <option value="Resign">Nonaktif: Resign</option>
                    <option value="Habis Kontrak">Nonaktif: Habis Kontrak</option>
                    <option value="Pensiun">Nonaktif: Pensiun</option>
                    <option value="Sanksi">Nonaktif: Sedang Terkena Sanksi</option>
                  </select>
                </div>
               
               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">NIK (Nomor Induk Karyawan)</label>
                 <div className="flex gap-2">
                   <input required type="text" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={form.nik} onChange={e=>setForm({...form, nik: e.target.value})} placeholder="Contoh: GT1234" />
                   <button type="button" onClick={generateNIK} className="bg-slate-200 text-slate-900 text-xs px-3 py-2 rounded-lg font-semibold hover:bg-slate-600 transition-colors whitespace-nowrap">Generate NIK</button>
                 </div>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Password (Login Aplikasi)</label>
                 <div className="flex gap-2">
                   <input required type="text" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Buat / Generate password" />
                   <button type="button" onClick={generatePassword} className="bg-slate-200 text-slate-900 text-xs px-3 py-2 rounded-lg font-semibold hover:bg-slate-600 transition-colors whitespace-nowrap">Generate</button>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Gaji Pokok (Rp)</label>
                 <input required type="number" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={form.baseSalary} onChange={e=>setForm({...form, baseSalary: e.target.value})} placeholder="Contoh: 4500000" />
               </div>
            </div>

            {/* TUNJANGAN */}
            <div className="pt-4 border-t border-slate-200">
               <div className="flex justify-between items-center mb-3">
                 <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Tunjangan</label>
                 {allowances.length < 5 && (
                   <button type="button" onClick={addAllowance} className="text-blue-600 text-xs font-semibold hover:text-teal-300 flex items-center gap-1">
                     <Plus className="w-3 h-3"/> Tambah
                   </button>
                 )}
               </div>
               <div className="space-y-2">
                 {allowances.map((al, idx) => (
                    <div key={al.id} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <input type="text" className="w-full text-xs bg-white text-slate-900 placeholder-slate-500 rounded border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors p-2" placeholder="Nama Tunjangan" value={al.name} onChange={e => updateAllowance(al.id, 'name', e.target.value)} disabled={al.isFixedName} />
                        <input type="number" className="w-full text-xs bg-white text-slate-900 placeholder-slate-500 rounded border border-slate-300 focus:ring-teal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors p-2" placeholder="Nominal (Rp)" value={al.amount} onChange={e => updateAllowance(al.id, 'amount', e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeAllowance(al.id)} className="mt-1 text-slate-600 hover:text-rose-400 p-1"><X className="w-4 h-4"/></button>
                    </div>
                 ))}
                 {allowances.length === 0 && <p className="text-xs text-slate-600 italic">Tidak ada tunjangan</p>}
               </div>
            </div>

            {/* POTONGAN */}
            <div className="pt-4 border-t border-slate-200">
               <div className="flex justify-between items-center mb-3">
                 <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Potongan</label>
                 {deductions.length < 5 && (
                   <button type="button" onClick={addDeduction} className="text-rose-400 text-xs font-semibold hover:text-rose-300 flex items-center gap-1">
                     <Plus className="w-3 h-3"/> Tambah
                   </button>
                 )}
               </div>
               <div className="space-y-2">
                 {deductions.map((dd, idx) => (
                    <div key={dd.id} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <input type="text" className="w-full text-xs bg-white text-slate-900 placeholder-slate-500 rounded border border-slate-300 focus:ring-rose-500 focus:border-rose-500 transition-colors p-2" placeholder="Nama Potongan" value={dd.name} onChange={e => updateDeduction(dd.id, 'name', e.target.value)} disabled={dd.isFixedName} />
                        <input type="number" className="w-full text-xs bg-white text-slate-900 placeholder-slate-500 rounded border border-slate-300 focus:ring-rose-500 focus:border-rose-500 transition-colors p-2" placeholder="Nominal (Rp)" value={dd.amount} onChange={e => updateDeduction(dd.id, 'amount', e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeDeduction(dd.id)} className="mt-1 text-slate-600 hover:text-rose-400 p-1"><X className="w-4 h-4"/></button>
                    </div>
                 ))}
                 {deductions.length === 0 && <p className="text-xs text-slate-600 italic">Tidak ada potongan</p>}
               </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-slate-900 text-sm font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20 mt-4">
              Simpan Data Pegawai
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-fit">
           <h3 className="text-lg font-bold text-slate-900 mb-6">Tree Diagram Organisasi</h3>
           <div className="overflow-x-auto bg-slate-50 p-6 rounded-xl border border-slate-200 min-h-[400px]">
              {locations.length === 0 ? (
                <p className="text-slate-600 italic text-sm">Tambahkan Lokasi/Departemen/Sub-Departemen di Menu Geofencing atau database.</p>
              ) : (
                renderTree()
              )}
           </div>
        </div>

      </div>
    </div>
  );
}


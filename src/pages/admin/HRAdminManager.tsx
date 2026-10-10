import React, { useState, useEffect } from 'react';
import { db, auth, firebaseConfig } from '../../lib/firestoreClient';
import { collection, getDocs, doc, setDoc, deleteDoc } from '../../lib/firestoreClient';
import { initializeApp } from '../../lib/firestoreClient';
import { getAuth, createUserWithEmailAndPassword } from '../../lib/firestoreClient';
import { UserPlus, Shield, Trash2 } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";


export default function HRAdminManager() {
  const toast = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ action: 'getDocs', collection: 'admins' })
      });
      if (res.ok) {
         const data = await res.json();
         setAdmins(data);
      }
    } catch(err) {
      console.error("Error fetching admins", err);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    
    setLoading(true);
    
    try {
      const sanitizedEmail = form.email.toLowerCase().trim();
      
      const res = await fetch(API_BASE_URL + '/api/admin/register', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: sanitizedEmail, password: form.password, name: form.name, role: form.role })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        form.role === 'kawasdal'
          ? 'Berhasil menambah akun Management Kawasdal baru.'
          : 'Berhasil menambah HRD Administrator baru.'
      );
      setForm({ name: '', email: '', password: '', role: 'admin' });
      fetchAdmins();
    } catch(err: any) {
      console.error(err);
      toast.error('Gagal membuat akun: ' + (err.message || err));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, email: string) => {
    try {
      console.log('Attempting to delete admin with id:', id);
      const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ action: 'deleteDoc', collection: 'admins', docId: id })
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      console.log('Deletion successful');
      setAdmins(admins.filter(a => a.id !== id));
      toast.success('Akun berhasil dihapus');
    } catch(err: any) {
      console.error('Deletion error:', err);
      toast.error('Gagal menghapus akun: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" />
          Manajemen Akun HRD & Management Kawasdal
        </h2>
        <p className="text-slate-600">Kelola akses login untuk Administrator HRD (Akses Penuh) dan Management Kawasdal (Khusus Monitoring & Log Absen tanpa fitur Export).</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-500/20">
              <UserPlus className="w-4 h-4 text-indigo-600" />
            </div>
            Tambah Akun Baru
          </h3>
          <form onSubmit={handleAddAdmin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Tipe Hak Akses / Role</label>
              <select
                className="w-full text-sm bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-semibold"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin HRD (Akses Penuh + Export)</option>
                <option value="kawasdal">Management Kawasdal (Monitoring Absen Tanpa Export)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Nama Lengkap / Jabatan</label>
              <input required type="text" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Contoh: Kawasdal Unit 1" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Email Login</label>
              <input required type="email" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder={form.role === 'kawasdal' ? 'kawasdal@perusahaan.com' : 'staff@perusahaan.com'} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Password Login</label>
              <input required type="text" className="w-full text-sm bg-white text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Minimal 6 karakter" />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl transition-colors mt-4 cursor-pointer">
              {loading ? 'Memproses...' : 'Daftarkan Akun'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
           <h3 className="text-lg font-bold text-slate-900 mb-6">Daftar Akun HRD & Kawasdal Terdaftar</h3>
           <div className="space-y-3">
             {admins.map((admin) => {
                const isKawasdalAcc = admin.role === 'kawasdal';
                return (
                  <div key={admin.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center group hover:border-slate-300 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{admin.name || 'Anonymous Admin'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isKawasdalAcc
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {isKawasdalAcc ? 'Management Kawasdal' : 'Admin HRD'}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold tracking-wider text-slate-600 mt-1 uppercase">Login Email: {admin.email || admin.id}</div>
                    </div>
                    <button onClick={() => handleDelete(admin.id, admin.email)} className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                );
             })}
             {admins.length === 0 && (
               <div className="text-center py-10 text-slate-600 border border-slate-200 border-dashed rounded-xl">Belum ada akun tambahan yang terdaftar.</div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { db, auth, firebaseConfig } from '../../lib/firestoreClient';
import { collection, getDocs, doc, setDoc, deleteDoc } from '../../lib/firestoreClient';
import { initializeApp } from '../../lib/firestoreClient';
import { getAuth, createUserWithEmailAndPassword } from '../../lib/firestoreClient';
import { UserPlus, Shield, Trash2 } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';

export default function HRAdminManager() {
  const toast = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const snap = await getDocs(collection(db, 'admins'));
      setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      
      const res = await fetch('/api/admin/register', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: sanitizedEmail, password: form.password, name: form.name })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Berhasil menambah HRD Administrator baru.');
      setForm({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch(err: any) {
      console.error(err);
      toast.error('Gagal membuat akun HRD: ' + (err.message || err));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, email: string) => {
    try {
      console.log('Attempting to delete admin with id:', id);
      await deleteDoc(doc(db, 'admins', id));
      console.log('Deletion successful');
      setAdmins(admins.filter(a => a.id !== id));
      toast.success('Akun HRD berhasil dihapus');
    } catch(err: any) {
      console.error('Deletion error:', err);
      toast.error('Gagal menghapus admin: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" />
          Manajemen Akun HRD System
        </h2>
        <p className="text-slate-400">Daftarkan Email Google staff HRD untuk memberikan mereka akses login via Google.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-900/200/10 flex items-center justify-center border border-indigo-500/20">
              <UserPlus className="w-4 h-4 text-indigo-500" />
            </div>
            Tambah Akun HRD
          </h3>
          <form onSubmit={handleAddAdmin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nama Lengkap</label>
              <input required type="text" className="w-full text-sm bg-[#0f172a] text-white placeholder-slate-500 rounded-lg border border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Contoh: Budi Santoso" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Email Akun HRD</label>
              <input required type="email" className="w-full text-sm bg-[#0f172a] text-white placeholder-slate-500 rounded-lg border border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="staff@perusahaan.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Password Login</label>
              <input required type="text" className="w-full text-sm bg-[#0f172a] text-white placeholder-slate-500 rounded-lg border border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Minimal 6 karakter" />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-900/200 text-white text-sm font-bold py-3 rounded-xl transition-colors mt-4">
              {loading ? 'Memproses...' : 'Daftarkan Email'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
           <h3 className="text-lg font-bold text-white mb-6">Daftar Akun Pengurus HRD Terdaftar</h3>
           <div className="space-y-3">
             {admins.map((admin) => (
                <div key={admin.id} className="p-4 bg-[#111827] rounded-xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-colors">
                  <div>
                    <div className="font-bold text-sm text-white">{admin.name || 'Anonymous Admin'}</div>
                    <div className="text-[10px] font-semibold tracking-wider text-slate-400 mt-1 uppercase">Login Email: {admin.email || admin.id}</div>
                  </div>
                  <button onClick={() => handleDelete(admin.id, admin.email)} className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
             ))}
             {admins.length === 0 && (
               <div className="text-center py-10 text-slate-400 border border-slate-800 border-dashed rounded-xl">Belum ada HRD tambahan yang terdaftar.</div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}

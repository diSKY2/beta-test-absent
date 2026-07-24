import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Upload } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function RegisterPage() {
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [locationId, setLocationId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [subDepartmentId, setSubDepartmentId] = useState('');
  const [role, setRole] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');

  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const locRes = await fetch(API_BASE_URL + '/api/locations');
      const depRes = await fetch(API_BASE_URL + '/api/departments');
      const subRes = await fetch(API_BASE_URL + '/api/subdepartments');
      
      if (locRes.ok) setLocations(await locRes.json());
      if (depRes.ok) setDepartments(await depRes.json());
      if (subRes.ok) setSubDepartments(await subRes.json());
    } catch (err) {
      console.error("Gagal memuat data struktur", err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran foto maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!profilePicUrl) {
      setError('Mohon unggah foto profil Anda');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API_BASE_URL + '/api/employee/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nik, name, password, phone, 
          locationId, departmentId, subDepartmentId, role, profilePicUrl 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftar');
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Berhasil</h2>
          <p className="text-slate-600 mb-6">
            Data Anda telah dikirim dan sedang menunggu persetujuan dari Admin/HRD. 
            Silakan hubungi Admin untuk mempercepat proses aktivasi akun Anda.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0C2461] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0C2461]"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#0C2461]/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#0C2461] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <Shield className="w-8 h-8 text-white -rotate-3" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Pendaftaran Pegawai
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Silakan lengkapi formulir di bawah ini untuk mendaftarkan akun portal Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100 relative overflow-hidden">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-start">
              <span>{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] sm:text-sm transition-all"
                  placeholder="Misal: Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">NIK (Nomor Induk Karyawan)</label>
                <input
                  type="text"
                  required
                  value={nik}
                  onChange={e => setNik(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] sm:text-sm transition-all"
                  placeholder="Masukkan NIK"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">No. Handphone (WhatsApp)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] sm:text-sm transition-all"
                  placeholder="Misal: 08123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] sm:text-sm transition-all"
                  placeholder="Buat password untuk login"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lokasi Kerja</label>
                <select
                  required
                  value={locationId}
                  onChange={e => {
                    setLocationId(e.target.value);
                    setDepartmentId('');
                    setSubDepartmentId('');
                  }}
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] sm:text-sm transition-all"
                >
                  <option value="">Pilih Lokasi</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Departemen / Divisi</label>
                <select
                  required
                  value={departmentId}
                  onChange={e => {
                    setDepartmentId(e.target.value);
                    setSubDepartmentId('');
                  }}
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] sm:text-sm transition-all"
                >
                  <option value="">Pilih Departemen</option>
                  {departments.filter(d => !locationId || d.locationId === locationId).map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sub-Departemen / Regu</label>
                <select
                  required
                  value={subDepartmentId}
                  onChange={e => setSubDepartmentId(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] sm:text-sm transition-all"
                >
                  <option value="">Pilih Regu</option>
                  {subDepartments.filter(s => !departmentId || s.departmentId === departmentId).map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Posisi / Jabatan</label>
                <select
                  required
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] sm:text-sm transition-all"
                >
                  <option value="">Pilih Posisi</option>
                  <option value="Anggota">Anggota</option>
                  <option value="Danru">Danru (Ketua Regu)</option>
                  </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Profil</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {profilePicUrl ? (
                    <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200">
                      <img src={profilePicUrl} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  )}
                  <div className="flex text-sm text-slate-600 justify-center mt-4">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#0C2461] hover:text-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#0C2461]">
                      <span>Unggah foto (Maks 2MB)</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} required={!profilePicUrl} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold uppercase tracking-wider text-white bg-[#0C2461] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0C2461] transition-all disabled:opacity-70"
              >
                {loading ? 'Mengirim Data...' : 'Kirim Pendaftaran'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="text-sm font-medium text-[#0C2461] hover:text-blue-800"
            >
              Batal dan kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

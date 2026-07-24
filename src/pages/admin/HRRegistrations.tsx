import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { UserCheck, XCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://garudatrisulaperkasa.web.id";

export default function HRRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { auth } = useAuth();
  const { triggerToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regRes, locRes, depRes, subRes] = await Promise.all([
        fetch(API_BASE_URL + '/api/admin/registrations', {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        }),
        fetch(API_BASE_URL + '/api/locations'),
        fetch(API_BASE_URL + '/api/departments'),
        fetch(API_BASE_URL + '/api/subdepartments')
      ]);

      if (regRes.ok) setRegistrations(await regRes.json());
      if (locRes.ok) setLocations(await locRes.json());
      if (depRes.ok) setDepartments(await depRes.json());
      if (subRes.ok) setSubDepartments(await subRes.json());
      
    } catch (err: any) {
      triggerToast('Gagal mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(API_BASE_URL + '/api/admin/registrations/' + id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerToast(`Registrasi berhasil diperbarui ke: ${status}`);
        fetchData();
      } else {
        triggerToast('Gagal memperbarui status');
      }
    } catch (err: any) {
      triggerToast('Error: ' + err.message);
    }
  };

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || id;
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || id;
  const getSubDeptName = (id: string) => subDepartments.find(s => s.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#0C2461]" />
            Pendaftaran Pegawai
          </h2>
          <p className="text-slate-600 mt-1 text-sm">
            Tinjau dan proses pendaftaran akun pegawai baru yang masuk melalui portal.
          </p>
        </div>
        <button onClick={fetchData} className="text-sm font-medium text-[#0C2461] hover:underline">
          Segarkan Data
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Belum ada pendaftaran baru.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Foto & Nama</th>
                  <th className="px-6 py-4 font-semibold">Detail Info</th>
                  <th className="px-6 py-4 font-semibold">Penempatan</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {registrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {reg.profilePicUrl ? (
                          <img 
                            src={reg.profilePicUrl} 
                            alt="Foto" 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(reg.profilePicUrl)}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{reg.name}</div>
                          <div className="text-xs text-slate-500">{reg.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-slate-900 font-medium">{reg.nik || '-'}</div>
                      <div className="text-slate-500">{reg.phone || '-'}</div>
                      <div className="text-slate-400 text-xs mt-1">
                        Daftar: {new Date(reg.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-slate-800">{getLocationName(reg.locationId)}</div>
                      <div className="text-slate-600 text-xs">{getDeptName(reg.departmentId)}</div>
                      <div className="text-slate-500 text-xs">{getSubDeptName(reg.subDepartmentId)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        reg.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        reg.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reg.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'Approved')}
                            className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 transition-colors text-xs font-medium"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Terima
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'Rejected')}
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 transition-colors text-xs font-medium"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips untuk HRD:</h4>
        <p className="text-sm text-blue-800">
          Setelah menerima (approve) pendaftaran pegawai, Anda harus melengkapi pengaturan Gaji (Gaji Pokok, Tunjangan, Potongan) di <strong>Struktur Organisasi</strong> atau menu <strong>Payroll</strong>.
        </p>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-white p-2 rounded-xl max-w-lg w-full">
            <img src={selectedImage} alt="Preview Foto" className="w-full h-auto rounded-lg" />
            <div className="mt-4 text-center pb-2">
              <button onClick={() => setSelectedImage(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium text-sm transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

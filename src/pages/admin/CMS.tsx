import React, { useEffect, useState } from 'react';
import { db, storage } from '../../lib/firestoreClient';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, where, orderBy, serverTimestamp } from '../../lib/firestoreClient';
import { ref, uploadBytesResumable, getDownloadURL } from '../../lib/firestoreClient';
import { Settings, Save, Plus, Trash2, Edit2, Newspaper, Building, Building2, MapPin } from 'lucide-react';
import { auth } from '../../lib/firestoreClient';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { useToast } from '../../providers/ToastProvider';

export default function CMS() {
  const toast = useToast();
  const [profileInfo, setProfileInfo] = useState({
    name: 'PT. GARUDA TRISULA PERKASA',
    logoUrl: '',
    tagline: 'INTEGRITAS • TANGGUH • PROFESIONAL • DISIPLIN',
    phone: '+62 811-1234-5678',
    email: 'admin@garudatrisula.com',
    website: 'www.garudatrisula.com',
    address: 'Jl. Jendral Sudirman Kav. 21, Jakarta Pusat, DKI Jakarta',
    content: 'PT. GARUDA TRISULA PERKASA was established as a company focused on professional security (PAM Suwakarsa). With 10 years of experience in the security field and a Gada Utama qualification, we have achieved this. The various challenges we have faced have been invaluable resources and the best teachers in building this company. We are determined and committed to leading a professional security company.'
  });
  const [profileDocId, setProfileDocId] = useState<string | null>(null);
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'PENGUMUMAN', mediaUrl: '' });
  const [galleryFormData, setGalleryFormData] = useState({ title: '', mediaUrl: '' });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 2) {
      toast.error('Ukuran maksimal logo adalah 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setProfileInfo(prev => ({ ...prev, logoUrl: dataUrl }));
        setIsUploadingLogo(false);
        
        if (profileDocId) {
           await setDoc(doc(db, 'company_info', profileDocId), { key: 'profile', logoUrl: dataUrl }, { merge: true });
        } else {
           await addDoc(collection(db, 'company_info'), { key: 'profile', logoUrl: dataUrl });
        }
        
        toast.success('Logo berhasil diupload ke Database');
      };
      reader.onerror = (error) => {
        console.error(error);
        toast.error('Gagal membaca file logo');
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat memproses logo');
      setIsUploadingLogo(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Profile
      const infoSnapshot = await getDocs(query(collection(db, 'company_info'), where("key", "==", "profile")));
      if (!infoSnapshot.empty) {
        const data = infoSnapshot.docs[0].data();
        setProfileInfo({
          name: data.name || 'PT. GARUDA TRISULA PERKASA',
          logoUrl: data.logoUrl || '',
          tagline: data.tagline || 'INTEGRITAS • TANGGUH • PROFESIONAL • DISIPLIN',
          phone: data.phone || '+62 811-1234-5678',
          email: data.email || 'admin@garudatrisula.com',
          website: data.website || 'www.garudatrisula.com',
          address: data.address || 'Jl. Jendral Sudirman Kav. 21, Jakarta Pusat, DKI Jakarta',
          content: data.content || ''
        });
        setProfileDocId(infoSnapshot.docs[0].id);
      }

      // Fetch Announcements
      const newsSnapshot = await getDocs(collection(db, 'announcements'));
      const newsList = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Descending
      });
      setAnnouncements(newsList);

      // Fetch Galleries
      const gallerySnapshot = await getDocs(collection(db, 'galleries'));
      const galleryList = gallerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setGalleries(galleryList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (profileDocId) {
        await setDoc(doc(db, 'company_info', profileDocId), { key: 'profile', ...profileInfo }, { merge: true });
      } else {
        await addDoc(collection(db, 'company_info'), { key: 'profile', ...profileInfo });
      }
      toast.success('Profil perusahaan berhasil disimpan');
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menyimpan profil: ' + error.message);
    }
  };

  const handleSaveAnnouncement = async () => {
    try {
      if (editId) {
        await setDoc(doc(db, 'announcements', editId), {
          ...formData,
        }, { merge: true });
        toast.success('Pengumuman berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Pengumuman baru berhasil ditambahkan');
      }
      setShowModal(false);
      setFormData({ title: '', content: '', type: 'PENGUMUMAN', mediaUrl: '' });
      setEditId(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menyimpan pengumuman: ' + error.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      fetchData();
      toast.success('Pengumuman berhasil dihapus');
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menghapus pengumuman: ' + error.message);
    }
  };

  const handleSaveGallery = async () => {
    try {
      if (!galleryFormData.mediaUrl) {
         toast.warning('Mohon lampirkan media foto/video untuk galeri.');
         return;
      }
      await addDoc(collection(db, 'galleries'), {
        ...galleryFormData,
        createdAt: new Date().toISOString()
      });
      setShowGalleryModal(false);
      setGalleryFormData({ title: '', mediaUrl: '' });
      fetchData();
      toast.success('Media galeri berhasil diunggah');
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menyimpan galeri: ' + error.message);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'galleries', id));
      fetchData();
      toast.success('Media galeri berhasil dihapus');
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menghapus galeri: ' + error.message);
    }
  };

  const openEditModal = (item: any) => {
    setEditId(item.id);
    setFormData({ title: item.title, content: item.content, type: item.type || 'PENGUMUMAN', mediaUrl: item.mediaUrl || '' });
    setShowModal(true);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto text-slate-300 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase mb-2 flex items-center gap-2">
            PORTAL ADMINISTRATOR HRD <span className="text-slate-300">•</span> CMS & PENGATURAN
          </p>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-teal-500" />
            CMS Profil & Setelan HRD
          </h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Profile/About Edit */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-lg p-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                  <Building2 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                   <h3 className="font-bold text-white">Profil Perusahaan</h3>
                   <p className="text-xs text-slate-400">Teks ini tampil di landing page</p>
                </div>
             </div>

             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
               <div>
                 <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Nama Perusahaan (PT)</label>
                 <input 
                   type="text"
                   value={profileInfo.name}
                   onChange={(e) => setProfileInfo({...profileInfo, name: e.target.value})}
                   className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Logo Perusahaan</label>
                 <div className="flex items-center gap-4">
                    {profileInfo.logoUrl ? (
                      <div className="relative group w-16 h-16">
                         <img src={profileInfo.logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-white border border-slate-700 p-1" />
                         <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer text-[10px] text-white font-bold text-center">Ubah<input type="file" hidden accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} /></label>
                         </div>
                      </div>
                    ) : (
                      <label className={`w-16 h-16 rounded-lg bg-[#0f172a] border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="text-[10px] text-slate-400 font-bold">{isUploadingLogo ? '...' : 'Upload'}</div>
                        <input type="file" hidden accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                      </label>
                    )}
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={profileInfo.logoUrl}
                        onChange={(e) => setProfileInfo({...profileInfo, logoUrl: e.target.value})}
                        placeholder="Atau masukkan URL Logo langsung..."
                        className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Resolusi disarankan: 1:1 (Persegi). Maksimal 2MB.</p>
                    </div>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Tagline / Visi</label>
                 <input 
                   type="text"
                   value={profileInfo.tagline}
                   onChange={(e) => setProfileInfo({...profileInfo, tagline: e.target.value})}
                   className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Nomor Telepon</label>
                    <input 
                      type="text"
                      value={profileInfo.phone}
                      onChange={(e) => setProfileInfo({...profileInfo, phone: e.target.value})}
                      className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Alamat Email</label>
                    <input 
                      type="text"
                      value={profileInfo.email}
                      onChange={(e) => setProfileInfo({...profileInfo, email: e.target.value})}
                      className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    />
                  </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Website Utama</label>
                 <input 
                   type="text"
                   value={profileInfo.website}
                   onChange={(e) => setProfileInfo({...profileInfo, website: e.target.value})}
                   className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Alamat Pusat Perusahaan</label>
                 <textarea 
                   rows={2}
                   value={profileInfo.address}
                   onChange={(e) => setProfileInfo({...profileInfo, address: e.target.value})}
                   className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Teks Deskripsi / Tentang Kami</label>
                 <textarea 
                   rows={6}
                   value={profileInfo.content}
                   onChange={(e) => setProfileInfo({...profileInfo, content: e.target.value})}
                   className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                   placeholder="Masukkan profil perusahaan di sini..."
                 />
               </div>
               
               <button 
                 onClick={handleSaveProfile}
                 className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-500 transition-colors shadow-lg"
               >
                 <Save className="w-4 h-4" />
                 Simpan Profil
               </button>
             </div>
           </div>
        </div>

        {/* Announcements / News */}
        <div className="lg:col-span-7">
           <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Newspaper className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                     <h3 className="font-bold text-white">Berita & Pengumuman</h3>
                     <p className="text-xs text-slate-400">Kelola buletin untuk landing page</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setEditId(null);
                    setFormData({ title: '', content: '', type: 'PENGUMUMAN', mediaUrl: '' });
                    setShowModal(true);
                  }}
                  className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Baru
                </button>
             </div>              <div className="flex-1 overflow-auto p-0 min-h-[400px]">
               {announcements.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                   <Newspaper className="w-12 h-12 mb-4 opacity-20" />
                   <p>Belum ada pengumuman.</p>
                 </div>
               ) : (
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-[#151f32] border-b border-slate-800 text-xs font-mono tracking-wider text-slate-400 uppercase">
                     <tr>
                       <th className="px-6 py-4 font-semibold">Tipe</th>
                       <th className="px-6 py-4 font-semibold">Judul</th>
                       <th className="px-6 py-4 font-semibold">Lampiran</th>
                       <th className="px-6 py-4 font-semibold">Tanggal</th>
                       <th className="px-6 py-4 font-semibold">Aksi</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/50 text-slate-300">
                     {announcements.map((item) => (
                       <tr key={item.id} className="hover:bg-[#151f32]/50 transition-colors group">
                         <td className="px-6 py-4">
                           <span className="inline-flex px-2 py-1 bg-[#1e293b] text-slate-400 border border-slate-700 rounded text-[10px] font-bold uppercase tracking-widest">
                             {item.type}
                           </span>
                         </td>
                         <td className="px-6 py-4 font-semibold text-white max-w-[200px] truncate">{item.title}</td>
                         <td className="px-6 py-4 text-slate-400 text-xs">
                           {item.mediaUrl ? '✅ Ada' : '❌ Tidak'}
                         </td>
                         <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                           {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => openEditModal(item)}
                                 className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                               >
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleDeleteAnnouncement(item.id)}
                                 className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
             </div>
           </div>
        </div>

      </div>

      {/* Gallery CMS Section */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-lg flex flex-col mt-8">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Building className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                  <h3 className="font-bold text-white">Galeri Aktivitas Perusahaan</h3>
                  <p className="text-xs text-slate-400">Kelola foto/video momen aktivitas</p>
              </div>
            </div>

            <button 
              onClick={() => {
                setGalleryFormData({ title: '', mediaUrl: '' });
                setShowGalleryModal(true);
              }}
              className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <Plus className="w-4 h-4" />
              Unggah Media
            </button>
        </div>

        <div className="p-6">
          {galleries.length === 0 ? (
             <div className="flex flex-col items-center justify-center text-slate-400 py-12 border-2 border-dashed border-slate-800 rounded-xl">
               <Building className="w-12 h-12 mb-4 opacity-20" />
               <p>Belum ada media galeri. Silakan unggah momen aktivitas perusahaan.</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {galleries.map(gal => (
                 <div key={gal.id} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-[4/3] bg-slate-900">
                    {gal.mediaUrl?.startsWith('data:video') ? (
                      <video src={gal.mediaUrl} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={gal.mediaUrl} className="w-full h-full object-cover" alt={gal.title} />
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-xs font-semibold truncate">{gal.title || 'Tanpa Judul'}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteGallery(gal.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-rose-500/80 hover:bg-rose-500 backdrop-blur-md rounded-full flex items-center justify-center text-white  transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal / Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#111827]">
              <h3 className="text-lg font-bold text-white">
                {editId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
              </h3>
            </div>
            
            <div className="p-6 space-y-5">
               <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Tipe/Label</label>
                  <input 
                    type="text" 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors uppercase"
                    placeholder="Contoh: PENGUMUMAN"
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Judul</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    placeholder="Masukkan judul..."
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Konten / Isi</label>
                  <textarea 
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg p-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    placeholder="Isi pengumuman..."
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Media (URL / Upload Foto) - Opsional</label>
                  <p className="text-[10px] text-slate-400 mb-2">Karena batas server 1MB, upload video besar mungkin gagal. Direkomendasikan mengisi URL video/foto (Google Drive, YouTube, Tiktok) di bawah.</p>
                  <input 
                    type="text" 
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({...formData, mediaUrl: e.target.value})}
                    placeholder="Atau Paste Link URL Media Di Sini..."
                    className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors mb-2"
                  />
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 950000) {
                          toast.error('Ukuran file terlalu besar! Maksimal 900KB. Silakan gunakan link URL di atas.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setFormData({...formData, mediaUrl: ev.target?.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-[#1e293b]/50 border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20"
                  />
                  {formData.mediaUrl && formData.mediaUrl.startsWith('data:') && (
                    <div className="mt-2 text-xs text-teal-400 font-medium">✔️ File Upload Terlampir</div>
                  )}
               </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-[#111827] flex justify-end gap-3">
               <button 
                 onClick={() => setShowModal(false)}
                 className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
               >
                 Batal
               </button>
               <button 
                 onClick={handleSaveAnnouncement}
                 className="px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition-colors"
               >
                 Simpan
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#111827]">
              <h3 className="text-lg font-bold text-white">Unggah Momen Galeri</h3>
            </div>
            
            <div className="p-6 space-y-5">
               <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Judul/Deskripsi Singkat (Opsional)</label>
                  <input 
                    type="text" 
                    value={galleryFormData.title}
                    onChange={(e) => setGalleryFormData({...galleryFormData, title: e.target.value})}
                    className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    placeholder="Contoh: Rapat Koordinasi..."
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Media (URL / Upload) *Wajib</label>
                  <p className="text-[10px] text-slate-400 mb-2">Batas upload DB 1MB. Direkomendasikan isi URL video/foto di bawah untuk resolusi tinggi.</p>
                  <input 
                    type="text" 
                    value={galleryFormData.mediaUrl}
                    onChange={(e) => setGalleryFormData({...galleryFormData, mediaUrl: e.target.value})}
                    placeholder="Atau Paste Link URL Media Di Sini..."
                    className="w-full bg-[#0f172a] border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors mb-2"
                  />
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 950000) {
                          toast.error('Ukuran file terlalu besar! Maksimal 900KB. Gunakan input URL.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setGalleryFormData({...galleryFormData, mediaUrl: ev.target?.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-[#1e293b]/50 border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                  />
                  {galleryFormData.mediaUrl && galleryFormData.mediaUrl.startsWith('data:') && (
                    <div className="mt-2 text-xs text-emerald-400 font-medium">✔️ File Upload Terlampir</div>
                  )}
               </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-[#111827] flex justify-end gap-3">
               <button 
                 onClick={() => setShowGalleryModal(false)}
                 className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
               >
                 Batal
               </button>
               <button 
                 onClick={handleSaveGallery}
                 className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
               >
                 Simpan
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

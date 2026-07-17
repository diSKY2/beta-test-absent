import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firestoreClient';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, where } from '../../lib/firestoreClient';
import { 
  Settings, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  Newspaper, 
  Building, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  X,
  AlertCircle,
  Calendar,
  Award
} from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';
import { motion, AnimatePresence } from 'motion/react';

export default function CMS() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'announcements' | 'gallery' | 'agendas'>('profile');
  
  const [profileInfo, setProfileInfo] = useState({
    name: 'PT. GARUDA TRISULA PERKASA',
    logoUrl: '',
    tagline: 'INTEGRITAS • TANGGUH • PROFESIONAL • DISIPLIN',
    phone: '+62 811-1234-5678',
    email: 'admin@garudatrisula.com',
    website: 'www.garudatrisula.com',
    address: 'Jl. Jendral Sudirman Kav. 21, Jakarta Pusat, DKI Jakarta',
    content: "PT. GARUDA TRISULA PERKASA didirikan sebagai badan usaha jasa pengamanan (BUJP) profesional terpercaya yang berfokus pada PAM Swakarsa tingkat tinggi. Dengan pengalaman lebih dari 10 tahun dan kualifikasi manajemen Gada Utama, kami berkomitmen untuk melayani sektor industri strategis, perkantoran modern, dan pengawalan VIP di seluruh Indonesia.",
    
    // Editable Visi, Misi, Nilai Kepemimpinan
    visiTitle: 'Visi Utama',
    visiDesc: 'Menjadi Badan Usaha Jasa Pengamanan nasional terdepan yang profesional, terpercaya, dan berteknologi tinggi dalam melindungi investasi klien.',
    misiTitle: 'Misi Korporasi',
    misiDesc: 'Menyelenggarakan pembinaan fisik dan etika moral prajurit Gada Pratama secara konsisten untuk menjamin kepatuhan SOP di lapangan.',
    nilaiTitle: 'Nilai Kepemimpinan',
    nilaiDesc: 'Mengedepankan koordinasi harmonis dengan Kepolisian RI, TNI, serta tokoh masyarakat guna meredam potensi konflik wilayah.',
    
    // Editable 4 Layanan Unggulan
    layanan1Title: 'Personel Gada Pratama',
    layanan1Desc: 'Satyawan bersertifikasi resmi kepolisian RI, terlatih fisik, tanggap darurat, penegakan disiplin K3, dan etika pelayanan prima.',
    layanan2Title: 'Sistem Absensi Geofencing',
    layanan2Desc: 'Presensi dinas berbasis titik GPS presisi tinggi dan verifikasi kamera swafoto yang terintegrasi real-time ke Command Center.',
    layanan3Title: 'Command Center 24/7',
    layanan3Desc: 'Layanan monitoring keamanan terpadu 24 jam penuh yang siap mendeteksi dan merespons kendala keamanan di lapangan secara instan.',
    layanan4Title: 'Kepatuhan Standar K3',
    layanan4Desc: 'Audit rutin alat pelindung diri (APD), patroli bahaya kebakaran, serta kepatuhan keselamatan kerja di area industri strategis.',

    // Direktur Utama
    dirutName: 'H. Sugeng Triyono, S.H.',
    dirutTitle: 'Direktur Utama & Pembina Gada Utama',
    dirutQuote: '"Selamat datang di Portal Informasi Terpadu PT. Garuda Trisula Perkasa. Kami berdedikasi tinggi membangun sistem pengamanan modern yang memadukan keandalan fisik personel Gada Pratama dengan teknologi geofencing presisi real-time demi kenyamanan operasional seluruh klien strategis kami."',
    dirutPhotoUrl: ''
  });
  const [profileDocId, setProfileDocId] = useState<string | null>(null);
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<any[]>([]);
  
  // Dynamic Agendas State
  const [agendas, setAgendas] = useState<any[]>([]);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [editAgendaId, setEditAgendaId] = useState<string | null>(null);
  const [agendaFormData, setAgendaFormData] = useState({ title: '', date: '', type: 'OPERASIONAL' });

  const [showModal, setShowModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'PENGUMUMAN', mediaUrl: '', isPopup: false });
  const [galleryFormData, setGalleryFormData] = useState({ title: '', mediaUrl: '' });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showPreviewPane, setShowPreviewPane] = useState(true);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1.5) {
      toast.error('Ukuran maksimal logo adalah 1.5MB');
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
        
        toast.success('Logo berhasil terunggah dan disimpan');
      };
      reader.onerror = () => {
        toast.error('Gagal memproses file gambar');
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan memproses logo');
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
          content: data.content || '',
          visiTitle: data.visiTitle || 'Visi Utama',
          visiDesc: data.visiDesc || 'Menjadi Badan Usaha Jasa Pengamanan nasional terdepan yang profesional, terpercaya, dan berteknologi tinggi dalam melindungi investasi klien.',
          misiTitle: data.misiTitle || 'Misi Korporasi',
          misiDesc: data.misiDesc || 'Menyelenggarakan pembinaan fisik dan etika moral prajurit Gada Pratama secara konsisten untuk menjamin kepatuhan SOP di lapangan.',
          nilaiTitle: data.nilaiTitle || 'Nilai Kepemimpinan',
          nilaiDesc: data.nilaiDesc || 'Mengedepapan koordinasi harmonis dengan Kepolisian RI, TNI, serta tokoh masyarakat guna meredam potensi konflik wilayah.',
          layanan1Title: data.layanan1Title || 'Personel Gada Pratama',
          layanan1Desc: data.layanan1Desc || 'Satyawan bersertifikasi resmi kepolisian RI, terlatih fisik, tanggap darurat, penegakan disiplin K3, dan etika pelayanan prima.',
          layanan2Title: data.layanan2Title || 'Sistem Absensi Geofencing',
          layanan2Desc: data.layanan2Desc || 'Presensi dinas berbasis titik GPS presisi tinggi dan verifikasi kamera swafoto yang terintegrasi real-time ke Command Center.',
          layanan3Title: data.layanan3Title || 'Command Center 24/7',
          layanan3Desc: data.layanan3Desc || 'Layanan monitoring keamanan terpadu 24 jam penuh yang siap mendeteksi dan merespons kendala keamanan di lapangan secara instan.',
          layanan4Title: data.layanan4Title || 'Kepatuhan Standar K3',
          layanan4Desc: data.layanan4Desc || 'Audit rutin alat pelindung diri (APD), patroli bahaya kebakaran, serta kepatuhan keselamatan kerja di area industri strategis.',
          dirutName: data.dirutName || 'H. Sugeng Triyono, S.H.',
          dirutTitle: data.dirutTitle || 'Direktur Utama & Pembina Gada Utama',
          dirutQuote: data.dirutQuote || '"Selamat datang di Portal Informasi Terpadu PT. Garuda Trisula Perkasa. Kami berdedikasi tinggi membangun sistem pengamanan modern yang memadukan keandalan fisik personel Gada Pratama dengan teknologi geofencing presisi real-time demi kenyamanan operasional seluruh klien strategis kami."',
          dirutPhotoUrl: data.dirutPhotoUrl || ''
        });
        setProfileDocId(infoSnapshot.docs[0].id);
      }

      // Fetch Announcements
      const newsSnapshot = await getDocs(collection(db, 'announcements'));
      const newsList = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
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

      // Fetch Agendas
      const agendaSnapshot = await getDocs(collection(db, 'agendas'));
      const agendaList = agendaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setAgendas(agendaList);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data CMS');
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (profileDocId) {
        await setDoc(doc(db, 'company_info', profileDocId), { key: 'profile', ...profileInfo }, { merge: true });
      } else {
        await addDoc(collection(db, 'company_info'), { key: 'profile', ...profileInfo });
      }
      toast.success('Profil perusahaan berhasil dimutakhirkan');
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menyimpan profil: ' + error.message);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!formData.title.trim()) {
      toast.warning('Judul pengumuman wajib diisi');
      return;
    }
    if (!formData.content.trim()) {
      toast.warning('Konten pengumuman wajib diisi');
      return;
    }

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
      setFormData({ title: '', content: '', type: 'PENGUMUMAN', mediaUrl: '', isPopup: false });
      setEditId(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengumuman ini secara permanen?')) return;
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
    if (!galleryFormData.mediaUrl) {
       toast.warning('Mohon lampirkan media foto/video untuk galeri.');
       return;
    }
    try {
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
    if (!window.confirm('Apakah Anda yakin ingin menghapus foto galeri ini?')) return;
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
    setFormData({ title: item.title, content: item.content, type: item.type || 'PENGUMUMAN', mediaUrl: item.mediaUrl || '', isPopup: item.isPopup || false });
    setShowModal(true);
  };

  const handleSaveAgenda = async () => {
    if (!agendaFormData.title.trim()) {
      toast.warning('Judul agenda wajib diisi');
      return;
    }
    if (!agendaFormData.date.trim()) {
      toast.warning('Tanggal agenda wajib diisi (misal: 18 Jul 2026)');
      return;
    }

    try {
      if (editAgendaId) {
        await setDoc(doc(db, 'agendas', editAgendaId), {
          ...agendaFormData,
        }, { merge: true });
        toast.success('Agenda berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'agendas'), {
          ...agendaFormData,
          createdAt: new Date().toISOString()
        });
        toast.success('Agenda baru berhasil ditambahkan');
      }
      setShowAgendaModal(false);
      setAgendaFormData({ title: '', date: '', type: 'OPERASIONAL' });
      setEditAgendaId(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menyimpan agenda: ' + error.message);
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus agenda ini secara permanen?')) return;
    try {
      await deleteDoc(doc(db, 'agendas', id));
      fetchData();
      toast.success('Agenda berhasil dihapus');
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menghapus agenda: ' + error.message);
    }
  };

  const openEditAgendaModal = (item: any) => {
    setEditAgendaId(item.id);
    setAgendaFormData({ title: item.title, date: item.date, type: item.type || 'OPERASIONAL' });
    setShowAgendaModal(true);
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto text-slate-700 font-sans">
      
      {/* Banner Information / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-blue-600 font-bold uppercase block mb-1">
            PUBLISHING ENGINE & METADATA
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="w-7 h-7 text-blue-600" />
            Portal CMS & Profil Korporat
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Modifikasi seluruh data yang terlihat di portal beranda landing page secara real-time.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'profile' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Tentang Korporat
          </button>
          <button
            onClick={() => setActiveTab('agendas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'agendas' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Jadwal Kegiatan ({agendas.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'announcements' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            Berita & Pengumuman ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'gallery' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Galeri Media ({galleries.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: CORPORATE PROFILE */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-8 text-slate-800"
          >
            {/* INFORMASI DASAR */}
            <div className="bg-white/40 rounded-2xl border border-slate-200 p-6 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-200 text-blue-600">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Informasi Dasar Perusahaan</h3>
                  <p className="text-[10px] text-slate-500">Sesuaikan profil dasar yang dirujuk pada beranda publik.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Nama Entitas Perusahaan</label>
                  <input 
                    type="text"
                    value={profileInfo.name}
                    onChange={(e) => setProfileInfo({...profileInfo, name: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Logo Perusahaan</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/60 p-4 border border-slate-200 rounded-2xl">
                     {profileInfo.logoUrl ? (
                        <div className="relative group shrink-0 w-16 h-16 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shadow-lg">
                           <img src={profileInfo.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                           <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <label className="cursor-pointer text-[9px] text-white font-bold tracking-wider uppercase">Ubah<input type="file" hidden accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} /></label>
                           </div>
                        </div>
                     ) : (
                        <label className={`w-16 h-16 rounded-xl bg-white border border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors shrink-0 ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <ImageIcon className="w-5 h-5 text-slate-600 mb-1" />
                          <span className="text-[8px] text-slate-500 font-bold tracking-wider uppercase">{isUploadingLogo ? 'PROSES' : 'UPLOAD'}</span>
                          <input type="file" hidden accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                        </label>
                     )}
                     <div className="flex-1 space-y-2 w-full">
                       <input 
                         type="text"
                         value={profileInfo.logoUrl}
                         onChange={(e) => setProfileInfo({...profileInfo, logoUrl: e.target.value})}
                         placeholder="Atau tautkan URL Logo langsung..."
                         className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-mono rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                       />
                       <p className="text-[9px] text-slate-500 font-medium">Resolusi 1:1 direkomendasikan. Maksimal ukuran file 1.5MB.</p>
                     </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Visi / Tagline Slogan</label>
                  <input 
                    type="text"
                    value={profileInfo.tagline}
                    onChange={(e) => setProfileInfo({...profileInfo, tagline: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">No Telepon Operasional</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={profileInfo.phone}
                      onChange={(e) => setProfileInfo({...profileInfo, phone: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Email Hubungan Pelanggan</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={profileInfo.email}
                      onChange={(e) => setProfileInfo({...profileInfo, email: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-lowercase"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Website Resmi</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={profileInfo.website}
                      onChange={(e) => setProfileInfo({...profileInfo, website: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Alamat Kantor Pusat</label>
                  <div className="relative">
                    <MapPin className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-4" />
                    <textarea 
                      rows={2}
                      value={profileInfo.address}
                      onChange={(e) => setProfileInfo({...profileInfo, address: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* VISI, MISI & NILAI KEPEMIMPINAN */}
            <div className="bg-white/40 rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center border border-red-200 text-red-600">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Visi, Misi & Nilai Kepemimpinan</h3>
                  <p className="text-[10px] text-slate-500">Sesuaikan poin-poin penting profil korporasi.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* VISI */}
                <div className="space-y-3 bg-white/50 p-4 border border-slate-200/60 rounded-xl">
                  <label className="text-[10px] font-bold text-[#0C2461] uppercase tracking-wider font-mono block">Judul Visi</label>
                  <input 
                    type="text"
                    value={profileInfo.visiTitle}
                    onChange={(e) => setProfileInfo({...profileInfo, visiTitle: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none transition-colors"
                  />
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block mt-2">Deskripsi Visi</label>
                  <textarea 
                    rows={4}
                    value={profileInfo.visiDesc}
                    onChange={(e) => setProfileInfo({...profileInfo, visiDesc: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-3 text-xs font-semibold focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* MISI */}
                <div className="space-y-3 bg-white/50 p-4 border border-slate-200/60 rounded-xl">
                  <label className="text-[10px] font-bold text-[#0C2461] uppercase tracking-wider font-mono block">Judul Misi</label>
                  <input 
                    type="text"
                    value={profileInfo.misiTitle}
                    onChange={(e) => setProfileInfo({...profileInfo, misiTitle: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none transition-colors"
                  />
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block mt-2">Deskripsi Misi</label>
                  <textarea 
                    rows={4}
                    value={profileInfo.misiDesc}
                    onChange={(e) => setProfileInfo({...profileInfo, misiDesc: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-3 text-xs font-semibold focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* NILAI KEPEMIMPINAN */}
                <div className="space-y-3 bg-white/50 p-4 border border-slate-200/60 rounded-xl">
                  <label className="text-[10px] font-bold text-[#0C2461] uppercase tracking-wider font-mono block">Judul Nilai Kepemimpinan</label>
                  <input 
                    type="text"
                    value={profileInfo.nilaiTitle}
                    onChange={(e) => setProfileInfo({...profileInfo, nilaiTitle: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none transition-colors"
                  />
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block mt-2">Deskripsi Nilai</label>
                  <textarea 
                    rows={4}
                    value={profileInfo.nilaiDesc}
                    onChange={(e) => setProfileInfo({...profileInfo, nilaiDesc: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-3 text-xs font-semibold focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* PILAR LAYANAN & KEUNGGULAN UTAMA */}
            <div className="bg-white/40 rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-200 text-teal-600">
                  <Building className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Pilar Solusi Keamanan Terpadu (Layanan Keunggulan)</h3>
                  <p className="text-[10px] text-slate-500">Sesuaikan judul dan deskripsi 4 pilar solusi utama.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PILAR 1 */}
                <div className="bg-white/60 p-4 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Pilar 1 (Personel Gada Pratama)</span>
                  <input 
                    type="text"
                    value={profileInfo.layanan1Title}
                    onChange={(e) => setProfileInfo({...profileInfo, layanan1Title: e.target.value})}
                    placeholder="Judul Pilar 1"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                  <textarea 
                    rows={2}
                    value={profileInfo.layanan1Desc}
                    onChange={(e) => setProfileInfo({...profileInfo, layanan1Desc: e.target.value})}
                    placeholder="Deskripsi Pilar 1"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                {/* PILAR 2 */}
                <div className="bg-white/60 p-4 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Pilar 2 (Sistem Absensi Geofencing)</span>
                  <input 
                    type="text"
                    value={profileInfo.layanan2Title}
                    onChange={(e) => setProfileInfo({...profileInfo, layanan2Title: e.target.value})}
                    placeholder="Judul Pilar 2"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                  <textarea 
                    rows={2}
                    value={profileInfo.layanan2Desc}
                    onChange={(e) => setProfileInfo({...profileInfo, layanan2Desc: e.target.value})}
                    placeholder="Deskripsi Pilar 2"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                {/* PILAR 3 */}
                <div className="bg-white/60 p-4 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Pilar 3 (Keunggulan Baru)</span>
                  <input 
                    type="text"
                    value={profileInfo.layanan3Title}
                    onChange={(e) => setProfileInfo({...profileInfo, layanan3Title: e.target.value})}
                    placeholder="Judul Pilar 3"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                  <textarea 
                    rows={2}
                    value={profileInfo.layanan3Desc}
                    onChange={(e) => setProfileInfo({...profileInfo, layanan3Desc: e.target.value})}
                    placeholder="Deskripsi Pilar 3"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                {/* PILAR 4 */}
                <div className="bg-white/60 p-4 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Pilar 4 (Kepatuhan Standar K3)</span>
                  <input 
                    type="text"
                    value={profileInfo.layanan4Title}
                    onChange={(e) => setProfileInfo({...profileInfo, layanan4Title: e.target.value})}
                    placeholder="Judul Pilar 4"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                  <textarea 
                    rows={2}
                    value={profileInfo.layanan4Desc}
                    onChange={(e) => setProfileInfo({...profileInfo, layanan4Desc: e.target.value})}
                    placeholder="Deskripsi Pilar 4"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 text-xs focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PROFIL DIREKTUR UTAMA */}
            <div className="bg-white/40 rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-9 h-9 rounded-lg bg-[#0C2461]/10 flex items-center justify-center border border-[#0C2461]/20 text-[#0C2461]">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Profil Direktur Utama</h3>
                  <p className="text-[10px] text-slate-500">Sesuaikan nama, jabatan, kata sambutan, dan foto Direktur Utama.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Nama Lengkap & Gelar</label>
                  <input 
                    type="text"
                    value={profileInfo.dirutName}
                    onChange={(e) => setProfileInfo({...profileInfo, dirutName: e.target.value})}
                    placeholder="Contoh: H. Sugeng Triyono, S.H."
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Jabatan / Keterangan Pembina</label>
                  <input 
                    type="text"
                    value={profileInfo.dirutTitle}
                    onChange={(e) => setProfileInfo({...profileInfo, dirutTitle: e.target.value})}
                    placeholder="Contoh: Direktur Utama & Pembina Gada Utama"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Foto Direktur Utama</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/60 p-4 border border-slate-200 rounded-2xl">
                     {profileInfo.dirutPhotoUrl ? (
                        <div className="relative group shrink-0 w-16 h-16 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shadow-lg">
                           <img src={profileInfo.dirutPhotoUrl} alt="Foto Direktur" className="w-full h-full object-cover rounded-lg" />
                           <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <label className="cursor-pointer text-[9px] text-white font-bold tracking-wider uppercase">Ubah<input type="file" hidden accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 1024 * 1024 * 1.5) {
                                  toast.error('Ukuran maksimal foto adalah 1.5MB');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setProfileInfo(prev => ({ ...prev, dirutPhotoUrl: event.target?.result as string }));
                                  toast.success('Foto Direktur Utama siap disimpan');
                                };
                                reader.readAsDataURL(file);
                              }} /></label>
                           </div>
                        </div>
                     ) : (
                        <label className="w-16 h-16 rounded-xl bg-white border border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#0C2461] transition-colors shrink-0">
                          <ImageIcon className="w-5 h-5 text-slate-600 mb-1" />
                          <span className="text-[8px] text-slate-500 font-bold tracking-wider uppercase">UPLOAD</span>
                          <input type="file" hidden accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 1024 * 1024 * 1.5) {
                              toast.error('Ukuran maksimal foto adalah 1.5MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setProfileInfo(prev => ({ ...prev, dirutPhotoUrl: event.target?.result as string }));
                              toast.success('Foto Direktur Utama siap disimpan');
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </label>
                     )}
                     <div className="flex-1 space-y-2 w-full">
                       <input 
                         type="text"
                         value={profileInfo.dirutPhotoUrl || ''}
                         onChange={(e) => setProfileInfo({...profileInfo, dirutPhotoUrl: e.target.value})}
                         placeholder="Atau tautkan URL Foto langsung..."
                         className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-mono rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                       />
                       <p className="text-[9px] text-slate-500 font-medium font-semibold">Resolusi 1:1 direkomendasikan. Maksimal ukuran file 1.5MB.</p>
                     </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Kata Sambutan / Pesan Utama</label>
                  <textarea 
                    rows={4}
                    value={profileInfo.dirutQuote}
                    onChange={(e) => setProfileInfo({...profileInfo, dirutQuote: e.target.value})}
                    placeholder="Tulis pesan sambutan direktur utama di sini..."
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-4 text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* TEKS DESKRIPSI UTAMA */}
            <div className="bg-white/40 rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-200 text-blue-600">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Teks Deskripsi Profil Utama</h3>
                  <p className="text-[10px] text-slate-500">Narasi sejarah atau profil komprehensif kami.</p>
                </div>
              </div>

              <div className="space-y-2">
                <textarea 
                  rows={10}
                  value={profileInfo.content}
                  onChange={(e) => setProfileInfo({...profileInfo, content: e.target.value})}
                  placeholder="Tulis sejarah/profil di sini..."
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-4 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors leading-relaxed text-justify"
                />
              </div>
            </div>

            {/* Save profile button wrapper */}
            <div className="bg-white/40 border border-slate-200 rounded-2xl p-4 flex gap-4 items-center justify-between">
              <div className="text-[10px] text-slate-500 font-mono font-bold">
                SINKRONISASI_LANDING_PAGE
              </div>
              <button 
                onClick={handleSaveProfile}
                className="flex items-center gap-2.5 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan Profil & Layanan
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 2: ANNOUNCEMENTS PUBLISHING */}
        {activeTab === 'announcements' && (
          <motion.div
            key="announcements-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white/40 rounded-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-md">Arsip Berita & Pemberitahuan</h3>
                <p className="text-xs text-slate-600 mt-1">Buat, modifikasi, dan hapus pengumuman internal/eksternal untuk pangkalan.</p>
              </div>

              <button 
                onClick={() => {
                  setEditId(null);
                  setFormData({ title: '', content: '', type: 'PENGUMUMAN', mediaUrl: '', isPopup: false });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-850 text-slate-900 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Tambah Publikasi Baru
              </button>
            </div>

            <div className="overflow-x-auto">
              {announcements.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <Newspaper className="w-12 h-12 opacity-15" />
                  <p className="text-xs italic font-semibold">Belum ada bulletin atau pengumuman terdaftar di server.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-mono tracking-wider font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Tipe Label</th>
                      <th className="px-6 py-4">Judul Artikel</th>
                      <th className="px-6 py-4">Lampiran Media</th>
                      <th className="px-6 py-4">Tanggal Rilis</th>
                      <th className="px-6 py-4 text-right">Opsi Operasional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-700">
                    {announcements.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 bg-slate-50 border border-slate-200 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md text-blue-600">
                            {item.type || 'PENGUMUMAN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 max-w-[280px] truncate">{item.title}</td>
                        <td className="px-6 py-4">
                          {item.mediaUrl ? (
                             <span className="text-blue-600 font-semibold flex items-center gap-1">✔️ Terlampir</span>
                          ) : (
                             <span className="text-slate-500">❌ Kosong</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => openEditModal(item)}
                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Ubah Pengumuman"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteAnnouncement(item.id)}
                                className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Permanen"
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
          </motion.div>
        )}

        {/* TAB 3: GALLERY MEDIA */}
        {activeTab === 'gallery' && (
          <motion.div
            key="gallery-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white/40 rounded-2xl border border-slate-200 flex flex-col"
          >
            <div className="p-6 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-md">Galeri Aktivitas Publik</h3>
                <p className="text-xs text-slate-600 mt-1">Daftar momen jepretan, kunjungan lapangan, serta kepatuhan keselamatan.</p>
              </div>

              <button 
                onClick={() => {
                  setGalleryFormData({ title: '', mediaUrl: '' });
                  setShowGalleryModal(true);
                }}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-850 text-slate-900 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Unggah File Media Galeri
              </button>
            </div>

            <div className="p-6">
              {galleries.length === 0 ? (
                 <div className="flex flex-col items-center justify-center text-slate-500 py-16 border border-dashed border-slate-200 rounded-2xl bg-white/20 gap-3">
                   <Building className="w-12 h-12 opacity-15" />
                   <p className="text-xs font-semibold">Media album galeri kosong. Unggah momen seremonial pangkalan.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                   {galleries.map(gal => (
                     <div key={gal.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-white shadow-md">
                        {gal.mediaUrl?.startsWith('data:video') || gal.mediaUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video src={gal.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={gal.mediaUrl} className="w-full h-full object-cover" alt={gal.title} />
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 to-transparent flex flex-col justify-end">
                          <p className="text-slate-900 text-xs font-bold truncate">{gal.title || 'Tanpa Judul'}</p>
                          <p className="text-[8px] font-mono text-slate-500 uppercase font-black mt-0.5">DOKUMENTASI_PT_GTP</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteGallery(gal.id)}
                          className="absolute top-2.5 right-2.5 w-8 h-8 bg-rose-600/90 hover:bg-rose-600 text-slate-900 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                          title="Hapus media"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: AGENDAS & JADWAL KEGIATAN */}
        {activeTab === 'agendas' && (
          <motion.div
            key="agendas-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white/40 rounded-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800"
          >
            <div className="p-6 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-md">Arsip Agenda & Jadwal Kegiatan</h3>
                <p className="text-xs text-slate-600 mt-1">Buat, modifikasi, dan hapus jadwal kegiatan, sertifikasi, apel bulanan, dan audit K3.</p>
              </div>

              <button 
                onClick={() => {
                  setEditAgendaId(null);
                  setAgendaFormData({ title: '', date: '', type: 'OPERASIONAL' });
                  setShowAgendaModal(true);
                }}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-850 text-slate-900 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Tambah Agenda Baru
              </button>
            </div>

            <div className="overflow-x-auto">
              {agendas.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <Calendar className="w-12 h-12 opacity-15" />
                  <p className="text-xs italic font-semibold">Belum ada agenda atau jadwal kegiatan pangkalan yang terdaftar.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-mono tracking-wider font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Tipe Label</th>
                      <th className="px-6 py-4">Nama Kegiatan / Agenda</th>
                      <th className="px-6 py-4">Tanggal Pelaksanaan</th>
                      <th className="px-6 py-4 text-right">Opsi Operasional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {agendas.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 bg-slate-50 border border-slate-200 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md text-red-600">
                            {item.type || 'OPERASIONAL'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 max-w-[400px] truncate">{item.title}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-600">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => openEditAgendaModal(item)}
                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Ubah Agenda"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteAgenda(item.id)}
                                className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Agenda"
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
          </motion.div>
        )}

      </AnimatePresence>

      {/* DIALOG PUBLISHING: ANNOUNCEMENT FORM WITH LIVE DRAFT PREVIEW */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-3xl border border-slate-200 w-full ${showPreviewPane ? 'max-w-5xl' : 'max-w-lg'} shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all duration-300`}
            >
              <div className="p-5 border-b border-slate-200/80 flex justify-between items-center bg-slate-50">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {editId ? 'Ubah Materi Publikasi' : 'Buat Publikasi Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-600 font-medium">Lengkapi isi data buletin perusahaan.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPreviewPane(!showPreviewPane)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showPreviewPane ? 'Sembunyikan Simulasi' : 'Lihat Simulasi Tampilan'}</span>
                  </button>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grid content editor + draft preview */}
              <div className="flex-1 overflow-y-auto grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-900">
                
                {/* Form Input fields */}
                <div className="p-6 space-y-4 lg:col-span-6">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Tipe Label Kategori</label>
                        <select 
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="PENGUMUMAN">PENGUMUMAN</option>
                          <option value="BERITA">BERITA</option>
                          <option value="OPERASIONAL">OPERASIONAL</option>
                          <option value="K3">K3</option>
                        </select>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Custom Label (Opsi)</label>
                        <input 
                          type="text" 
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                          placeholder="Misal: K3"
                        />
                     </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Judul Pengumuman</label>
                      <input 
                        type="text" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        placeholder="Contoh: Protokol Baru K3 Shift Malam"
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Konten Pengumuman</label>
                      <textarea 
                        rows={7}
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors leading-relaxed"
                        placeholder="Tulis pesan lengkap di sini..."
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block">Media URL / Unggahan Gambar & Video</label>
                      <input 
                        type="text" 
                        value={formData.mediaUrl}
                        onChange={(e) => setFormData({...formData, mediaUrl: e.target.value})}
                        placeholder="Tempel tautan eksternal foto/video (Google Drive/Url)..."
                        className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-mono rounded-xl px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                      
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[9px] text-slate-500 font-bold">ATAU</span>
                        <input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error('Maksimal ukuran file lokal adalah 10MB. Silakan gunakan link URL jika berkas sangat besar.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setFormData({...formData, mediaUrl: ev.target?.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-[10px] text-slate-600 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-start gap-3 bg-red-500/5 p-4 border border-red-500/10 rounded-2xl mt-4">
                        <input 
                          type="checkbox"
                          id="isPopup"
                          checked={formData.isPopup || false}
                          onChange={(e) => setFormData({...formData, isPopup: e.target.checked})}
                          className="w-4.5 h-4.5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer mt-0.5"
                        />
                        <label htmlFor="isPopup" className="cursor-pointer select-none">
                          <span className="text-[11px] font-black text-[#0C2461] uppercase tracking-wide block">Tampilkan Pop-up Pengumuman</span>
                          <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Jika aktif, pengumuman ini akan otomatis muncul sebagai modal interaktif yang menarik perhatian saat pegawai masuk/membuka portal.</span>
                        </label>
                      </div>
                   </div>
                </div>

                {/* Simulated Live Preview Card on right side */}
                {showPreviewPane && (
                  <div className="p-6 bg-slate-100 lg:col-span-6 flex flex-col justify-center items-center gap-4">
                     <span className="text-[9px] font-mono text-slate-500 tracking-widest font-black uppercase self-start">PREVIEW_SIMULATED_PUBLISH</span>
                     
                     <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl select-none">
                       <div className="h-40 bg-slate-50 relative flex flex-col justify-end p-4 border-b border-slate-200">
                          {formData.mediaUrl ? (
                             <img src={formData.mediaUrl} alt="Preview Attachment" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                          ) : (
                             <div className="absolute inset-0 bg-slate-50/30" />
                          )}
                          <span className="relative z-10 inline-block px-2.5 py-1 bg-white border border-slate-850 text-blue-600 text-[8px] font-bold uppercase tracking-widest rounded">
                            {formData.type || 'PENGUMUMAN'}
                          </span>
                       </div>

                       <div className="p-4 space-y-3">
                         <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                           <span>9 Juli 2026</span>
                         </div>
                         <h4 className="text-sm font-bold text-slate-900 truncate">{formData.title || 'Ketik Judul Pengumuman...'}</h4>
                         <p className="text-[10px] text-slate-600 line-clamp-3 text-justify">{formData.content || 'Ketik materi konten pengumuman di samping untuk memulai simulasi rancangan.'}</p>
                         
                         <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-[9px] font-semibold text-slate-500">
                           <span className="font-mono">BY_HRD_ADMIN</span>
                           <span className="text-blue-600/50">Baca Selengkapnya</span>
                         </div>
                       </div>
                     </div>
                  </div>
                )}

              </div>

              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                 <button 
                   onClick={() => setShowModal(false)}
                   className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                 >
                   Batal
                 </button>
                 <button 
                   onClick={handleSaveAnnouncement}
                   className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-600 text-slate-900 transition-colors cursor-pointer"
                 >
                   Publikasikan Pengumuman
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GALLERY UPLOAD MODAL */}
      <AnimatePresence>
        {showGalleryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-900">Tambahkan Momen Galeri Baru</h3>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block font-bold">Judul / Label Deskripsi Singkat</label>
                    <input 
                      type="text" 
                      value={galleryFormData.title}
                      onChange={(e) => setGalleryFormData({...galleryFormData, title: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="Misal: Audit K3 Triwulan 3"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block font-bold">Foto / Media URL *Wajib</label>
                    <input 
                      type="text" 
                      value={galleryFormData.mediaUrl}
                      onChange={(e) => setGalleryFormData({...galleryFormData, mediaUrl: e.target.value})}
                      placeholder="Masukkan Tautan URL foto..."
                      className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-mono rounded-xl px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-1"
                    />
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-bold">ATAU</span>
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error('Ukuran file maksimal 10MB. Silakan gunakan input URL.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setGalleryFormData({...galleryFormData, mediaUrl: ev.target?.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-[10px] text-slate-600 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                 </div>
              </div>

              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                 <button 
                   onClick={() => setShowGalleryModal(false)}
                   className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                 >
                   Batal
                 </button>
                 <button 
                   onClick={handleSaveGallery}
                   className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-600 text-slate-900 transition-colors cursor-pointer"
                 >
                   Simpan Galeri
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AGENDA CRUD MODAL */}
      <AnimatePresence>
        {showAgendaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-800"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editAgendaId ? 'Ubah Agenda Kegiatan' : 'Tambahkan Agenda Baru'}
                </h3>
                <button 
                  onClick={() => setShowAgendaModal(false)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block font-bold">Kategori / Tipe Agenda</label>
                    <select 
                      value={agendaFormData.type}
                      onChange={(e) => setAgendaFormData({...agendaFormData, type: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:border-blue-500 outline-none"
                    >
                      <option value="OPERASIONAL">OPERASIONAL</option>
                      <option value="DIKLAT">DIKLAT</option>
                      <option value="K3">K3</option>
                      <option value="IT">IT</option>
                    </select>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block font-bold">Nama Kegiatan / Agenda *Wajib</label>
                    <input 
                      type="text" 
                      value={agendaFormData.title}
                      onChange={(e) => setAgendaFormData({...agendaFormData, title: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                      placeholder="Misal: Apel Bulanan & Pembinaan Sikap Tampang"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono block font-bold">Tanggal Pelaksanaan *Wajib</label>
                    <input 
                      type="text" 
                      value={agendaFormData.date}
                      onChange={(e) => setAgendaFormData({...agendaFormData, date: e.target.value})}
                      placeholder="Misal: 18 Jul 2026 atau Setiap Senin"
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                    />
                 </div>
              </div>

              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                 <button 
                   onClick={() => setShowAgendaModal(false)}
                   className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                 >
                   Batal
                 </button>
                 <button 
                   onClick={handleSaveAgenda}
                   className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white transition-colors cursor-pointer"
                 >
                   {editAgendaId ? 'Perbarui Agenda' : 'Simpan Agenda'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router';
import { db } from '../lib/firestoreClient';
import { collection, getDocs, query, where } from '../lib/firestoreClient';
import { 
  Lock, 
  MapPin, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  User, 
  Clock, 
  Search, 
  Filter, 
  BookOpen, 
  ChevronRight, 
  Building2, 
  Award, 
  TrendingUp, 
  X, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileText,
  Megaphone,
  Briefcase,
  Users,
  Shield,
  Fingerprint,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LandingPage() {
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
  
  const [news, setNews] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [agendas, setAgendas] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'PENGUMUMAN' | 'BERITA' | 'OPERASIONAL' | 'K3'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('profil');
  const [activePopupAnnouncement, setActivePopupAnnouncement] = useState<any | null>(null);

  useEffect(() => {
    if (news.length > 0) {
      const popup = news.find((item: any) => item.isPopup === true);
      if (popup) {
        const seenKey = `gtp_dismissed_popup_${popup.id}`;
        const hasSeen = localStorage.getItem(seenKey);
        if (!hasSeen) {
          setActivePopupAnnouncement(popup);
        }
      }
    }
  }, [news]);

  const [stats, setStats] = useState({
    totalBranches: 0,
    activeGuards: 0,
    complianceRate: '99.8%',
    incidentFreeDays: 450
  });

  // Default hardcoded agendas to use as a fallback
  const fallbackAgendas = [
    { id: '1', date: '18 Jul 2026', title: 'Apel Bulanan & Pembinaan Sikap Tampang Personel', type: 'OPERASIONAL' },
    { id: '2', date: '25 Jul 2026', title: 'Pelatihan Sertifikasi Gada Pratama Gelombang III', type: 'DIKLAT' },
    { id: '3', date: '01 Agu 2026', title: 'Audit Sistem Manajemen Pengamanan (SMP) Kemenaker', type: 'K3' },
    { id: '4', date: '10 Agu 2026', title: 'Sosialisasi Geofencing Presisi & Roster Baru di App Mobile', type: 'IT' }
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const infoSnapshot = await getDocs(query(collection(db, 'company_info'), where("key", "==", "profile")));
        if (!infoSnapshot.empty) {
          const data = infoSnapshot.docs[0].data();
          setProfileInfo(prev => ({
            ...prev,
            name: data.name || prev.name,
            logoUrl: data.logoUrl || prev.logoUrl,
            tagline: data.tagline || prev.tagline,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            website: data.website || prev.website,
            address: data.address || prev.address,
            content: data.content || prev.content,
            visiTitle: data.visiTitle || prev.visiTitle,
            visiDesc: data.visiDesc || prev.visiDesc,
            misiTitle: data.misiTitle || prev.misiTitle,
            misiDesc: data.misiDesc || prev.misiDesc,
            nilaiTitle: data.nilaiTitle || prev.nilaiTitle,
            nilaiDesc: data.nilaiDesc || prev.nilaiDesc,
            layanan1Title: data.layanan1Title || prev.layanan1Title,
            layanan1Desc: data.layanan1Desc || prev.layanan1Desc,
            layanan2Title: data.layanan2Title || prev.layanan2Title,
            layanan2Desc: data.layanan2Desc || prev.layanan2Desc,
            layanan3Title: data.layanan3Title || prev.layanan3Title,
            layanan3Desc: data.layanan3Desc || prev.layanan3Desc,
            layanan4Title: data.layanan4Title || prev.layanan4Title,
            layanan4Desc: data.layanan4Desc || prev.layanan4Desc,
            dirutName: data.dirutName || prev.dirutName,
            dirutTitle: data.dirutTitle || prev.dirutTitle,
            dirutQuote: data.dirutQuote || prev.dirutQuote,
            dirutPhotoUrl: data.dirutPhotoUrl || prev.dirutPhotoUrl,
          }));
        }

        const newsSnapshot = await getDocs(collection(db, 'announcements'));
        const newsList = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setNews(newsList);

        const gallerySnapshot = await getDocs(collection(db, 'galleries'));
        const galleryList = gallerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setGalleries(galleryList);

        const locSnapshot = await getDocs(collection(db, 'locations'));
        const locs = locSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        const today = new Date().toISOString().split('T')[0];
        const attSnapshot = await getDocs(query(collection(db, 'attendances'), where("date", "==", today)));
        
        const activeCounts: Record<string, number> = {};
        let totalActive = 0;
        attSnapshot.docs.forEach(doc => {
           const data = doc.data();
           if (data.status === 'Hadir' && data.locationId) {
               activeCounts[data.locationId] = (activeCounts[data.locationId] || 0) + 1;
               totalActive++;
           }
        });
        
        const locationsWithCounts = locs.map((loc: any) => ({
           ...loc,
           activeWorkers: activeCounts[loc.id] || 0
        }));
        setLocations(locationsWithCounts);

        // Fetch dynamic agendas
        const agendaSnapshot = await getDocs(collection(db, 'agendas'));
        const agendaList = agendaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        if (agendaList.length > 0) {
          setAgendas(agendaList);
        } else {
          setAgendas(fallbackAgendas);
        }

        setStats(prev => ({
          ...prev,
          totalBranches: locs.length,
          activeGuards: totalActive
        }));
      } catch (error) {
        console.error("Error fetching landing data: ", error);
      }
    }
    fetchData();
  }, []);

  const handleDismissPopup = () => {
    if (activePopupAnnouncement) {
      localStorage.setItem(`gtp_dismissed_popup_${activePopupAnnouncement.id}`, 'true');
      setActivePopupAnnouncement(null);
    }
  };

  // Set up an IntersectionObserver to detect the current scroll section and highlight it in the tab bar!
  useEffect(() => {
    const sections = ['profil', 'layanan', 'operasional', 'agenda', 'berita', 'galeri'];
    const observers = sections.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        });
      }, {
        rootMargin: '-20% 0px -60% 0px' // High trigger window for the visible middle area
      });
      
      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach(item => {
        if (item) item.observer.unobserve(item.el);
      });
    };
  }, []);

  const filteredNews = news.filter(item => {
    const matchesTab = activeTab === 'all' || item.type?.toUpperCase() === activeTab.toUpperCase();
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Direct, highly robust scrollIntoView with start alignment
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setActiveSection(id);
    }
  };

  const handleTickerClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    setSelectedAnnouncement(item);
    const element = document.getElementById('berita');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setActiveSection('berita');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans selection:bg-[#0C2461]/20 overflow-x-hidden antialiased scroll-smooth">
      
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-white border-b border-slate-200/80 shadow-md transition-all duration-300">

        {/* Main Navbar & Elegant Tab-bar */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="h-20 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-3">
               {profileInfo.logoUrl ? (
                  <img 
                    src={profileInfo.logoUrl} 
                    alt="Logo" 
                    className="w-11 h-11 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-sm" 
                  />
               ) : (
                  <div className="w-11 h-11 bg-[#0C2461] rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md border-b-4 border-red-600">
                    {profileInfo.name ? profileInfo.name.charAt(0).toUpperCase() : 'G'}
                  </div>
               )}
               <div className="flex flex-col">
                 <span className="text-md sm:text-lg font-black tracking-tight text-[#0C2461] leading-tight">{profileInfo.name}</span>
                 <span className="text-[9px] font-bold text-red-600 tracking-wider uppercase flex items-center gap-1">
                   <Shield className="w-2.5 h-2.5 text-red-600" /> BADAN USAHA JASA PENGAMANAN (BUJP)
                 </span>
               </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <a 
                href="/app-release.apk" 
                download="app-release.apk"
                className="group flex items-center gap-1.5 bg-red-600 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-md hover:shadow-lg border-b-4 border-red-800"
              >
                <Smartphone className="w-4 h-4 text-white group-hover:scale-110 transition-transform animate-pulse" />
                <span>Download APK</span>
              </a>
              <Link 
                to="/login" 
                className="group flex items-center gap-1.5 bg-[#0C2461] text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all shadow-md hover:shadow-lg border-b-4 border-red-700 hover:border-red-800"
              >
                <Lock className="w-4 h-4 text-slate-200 group-hover:rotate-12 transition-transform" />
                <span>HRD Portal</span>
              </Link>
            </div>
          </div>

          {/* DYNAMIC NAVIGATION TAB BAR (Centrally focused, visible and scrollable on ALL devices) */}
          <div className="py-2.5 flex items-center justify-start sm:justify-center overflow-x-auto gap-1 sm:gap-2 no-scrollbar scroll-smooth">
            {[
              { id: 'profil', label: 'Profil Pangkalan', icon: Shield },
              { id: 'layanan', label: 'Pilar Solusi', icon: Fingerprint },
              { id: 'operasional', label: 'Pos & Geofence', icon: MapPin },
              { id: 'agenda', label: 'Jadwal Agenda', icon: Calendar },
              { id: 'berita', label: 'Media Center', icon: BookOpen },
              { id: 'galeri', label: 'Dokumentasi', icon: ShieldCheck }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isSelected = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => handleScroll(e, tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                    isSelected 
                      ? 'bg-[#0C2461] text-white border-[#0C2461] shadow-sm font-black' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-[#0C2461] hover:bg-slate-100'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-red-500' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      
      <main className="flex-grow pt-32 sm:pt-36">

        {/* DYNAMIC NEWS TICKER */}
        <div className="bg-[#E1E8F5] border-y border-slate-300 text-slate-800 text-xs py-2 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center shadow-sm">
          <div className="bg-red-600 text-white font-black px-3 py-1 rounded text-[10px] tracking-widest uppercase shrink-0 mr-4 z-10 flex items-center gap-1 shadow-sm">
            <Megaphone className="w-3.5 h-3.5 animate-bounce" /> INFO TERBARU
          </div>
          <div className="w-full overflow-hidden whitespace-nowrap relative flex items-center">
            <div className="inline-block animate-[marquee_45s_linear_infinite] hover:pause text-xs font-bold tracking-wide text-[#0C2461] space-x-8">
              {news.length > 0 ? (
                news.slice(0, 6).map((item) => (
                  <button 
                    key={item.id}
                    onClick={(e) => handleTickerClick(e, item)}
                    className="hover:text-red-600 hover:underline cursor-pointer transition-colors inline-flex items-center gap-1.5 focus:outline-none"
                  >
                    <span className="text-red-600 font-black">•</span>
                    <span className="bg-[#0C2461] text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase shrink-0">{item.type || 'PENGUMUMAN'}</span>
                    <span className="uppercase">{item.title}</span>
                  </button>
                ))
              ) : (
                <span>⭐ [HARI INI] Personel Siaga Aktif: {stats.activeGuards} Pengawal di {stats.totalBranches} Pos Pengamanan Regional • Tingkat Kepatuhan SOP Pengamanan Mencapai {stats.complianceRate} • Hubungi Command Center GTP apabila terjadi kendala teknis sistem absensi mobile • Gada Utama bersinergi penuh dengan kepolisian negara Republik Indonesia •</span>
              )}
            </div>
          </div>
        </div>
        
        {/* HERO SLIDER & WELCOME BANNER (100% Full-Width Vertically Stacked) */}
        <section className="bg-white border-b border-slate-200 py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-transparent to-red-50/20 pointer-events-none" />
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
            
            <div className="space-y-6 text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-[#0C2461] text-[10px] font-black tracking-widest uppercase shadow-sm">
                <Award className="w-4 h-4 text-[#0C2461]" /> PAM SWAKARSA STRATEGIS NASIONAL
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0C2461] tracking-tight leading-tight uppercase">
                Sinergi, Tangguh & <span className="text-red-600">Profesional</span> Melayani Keamanan Nusantara
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed text-center mx-auto font-medium max-w-3xl">
                {profileInfo.content}
              </p>

              {/* Slogan Badges */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {profileInfo.tagline.split('•').map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-4 py-2 bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-[#0C2461] tracking-widest uppercase rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Sambutan Direktur Utama - Stacked Vertically beneath the Hero text */}
            <div className="w-full max-w-[1400px] mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden border-t-4 border-t-red-600 mt-8">
              <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
                <Shield className="w-40 h-40 text-blue-900" />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-[#0C2461] border-2 border-red-600 rounded-full flex items-center justify-center font-bold text-white text-sm overflow-hidden shadow-md shrink-0">
                  {profileInfo.dirutPhotoUrl ? (
                    <img src={profileInfo.dirutPhotoUrl} alt="Direktur Utama" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black uppercase tracking-wider">DIRUT</span>
                  )}
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0C2461] uppercase tracking-wide">
                        {profileInfo.dirutName || 'H. Sugeng Triyono, S.H.'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        {profileInfo.dirutTitle || 'Direktur Utama & Pembina Gada Utama'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium italic leading-relaxed text-justify whitespace-pre-wrap">
                    {profileInfo.dirutQuote || '"Selamat datang di Portal Informasi Terpadu PT. Garuda Trisula Perkasa. Kami berdedikasi tinggi membangun sistem pengamanan modern yang memadukan keandalan fisik personel Gada Pratama dengan teknologi geofencing presisi real-time demi kenyamanan operasional seluruh klien strategis kami."'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* PROFIL PERUSAHAAN SECTION (`id="profil"`) - FULL WIDTH (VERTICALLY STACKED) */}
        <section id="profil" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-16 border-b border-slate-200 scroll-mt-36">
          <div className="space-y-8 max-w-[1600px] mx-auto text-center">
            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">PROFIL PERUSAHAAN</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0C2461] tracking-tight uppercase">Komitmen Layanan Tanpa Batas</h2>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                Kami berkomitmen menciptakan ekosistem keamanan yang unggul dengan memprioritaskan kualifikasi, integritas, dan pengawasan terintegrasi.
              </p>
            </div>

            {/* Grid layout for Visi, Misi, Nilai on wider screens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
              
              {/* VISI CARD */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm border-l-4 border-l-[#0C2461] transition-transform duration-200 hover:scale-[1.01]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0C2461]/10 rounded-xl flex items-center justify-center text-[#0C2461] shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-md text-[#0C2461] uppercase tracking-wider">{profileInfo.visiTitle}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed text-justify">
                      {profileInfo.visiDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* MISI CARD */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm border-l-4 border-l-red-600 transition-transform duration-200 hover:scale-[1.01]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-md text-[#0C2461] uppercase tracking-wider">{profileInfo.misiTitle}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed text-justify">
                      {profileInfo.misiDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* NILAI KEPEMINPINAN CARD */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm border-l-4 border-l-[#0C2461] transition-transform duration-200 hover:scale-[1.01]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0C2461]/10 rounded-xl flex items-center justify-center text-[#0C2461] shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-md text-[#0C2461] uppercase tracking-wider">{profileInfo.nilaiTitle}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed text-justify">
                      {profileInfo.nilaiDesc}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* LAYANAN UNGGULAN SECTION (`id="layanan"`) - FULL WIDTH (VERTICALLY STACKED) */}
        <section id="layanan" className="bg-white border-b border-slate-200 py-16 scroll-mt-36">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">LAYANAN UNGGULAN KAMI</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0C2461] tracking-tight uppercase">Pilar Solusi Keamanan Terpadu</h2>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                Layanan keamanan profesional bersertifikasi yang dirancang untuk perlindungan aset vital secara presisi.
              </p>
            </div>

            {/* Grid-based Pillars - 4 columns side-by-side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
              
              {/* LAYANAN 1 */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-[#0C2461] flex flex-col gap-4">
                <div className="w-12 h-12 bg-[#0C2461]/10 rounded-xl flex items-center justify-center text-[#0C2461] shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-[#0C2461] uppercase tracking-wider">{profileInfo.layanan1Title || 'Personel Gada Pratama'}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed text-justify">
                    {profileInfo.layanan1Desc || 'Satyawan bersertifikasi resmi kepolisian RI, terlatih fisik, tanggap darurat, penegakan disiplin K3, dan etika pelayanan prima.'}
                  </p>
                </div>
              </div>

              {/* LAYANAN 2 */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-red-600 flex flex-col gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-[#0C2461] uppercase tracking-wider">{profileInfo.layanan2Title || 'Sistem Absensi Geofencing'}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed text-justify">
                    {profileInfo.layanan2Desc || 'Presensi dinas berbasis titik GPS presisi tinggi dan verifikasi kamera swafoto yang terintegrasi real-time ke Command Center.'}
                  </p>
                </div>
              </div>

              {/* LAYANAN 3 */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-[#0C2461] flex flex-col gap-4">
                <div className="w-12 h-12 bg-[#0C2461]/10 rounded-xl flex items-center justify-center text-[#0C2461] shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-[#0C2461] uppercase tracking-wider">{profileInfo.layanan3Title || 'Command Center 24/7'}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed text-justify">
                    {profileInfo.layanan3Desc || 'Layanan monitoring keamanan terpadu 24 jam penuh yang siap mendeteksi dan merespons kendala keamanan di lapangan secara instan.'}
                  </p>
                </div>
              </div>

              {/* LAYANAN 4 */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-red-600 flex flex-col gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-[#0C2461] uppercase tracking-wider">{profileInfo.layanan4Title || 'Kepatuhan Standar K3'}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed text-justify">
                    {profileInfo.layanan4Desc || 'Audit rutin alat pelindung diri (APD), patroli bahaya kebakaran, serta kepatuhan keselamatan kerja di area industri strategis.'}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* STATUS OPERASIONAL SECTION (`id="operasional"`) - FULL WIDTH */}
        <section id="operasional" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-16 border-b border-slate-200 scroll-mt-36">
          <div className="space-y-8 max-w-6xl mx-auto">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">STATUS OPERASIONAL REAL-TIME</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0C2461] tracking-tight uppercase">Monitoring Cabang & Pos Siaga</h2>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                Sistem dashboard terintegrasi memantau presensi, koordinat geofence, dan keaktifan personel di seluruh wilayah penugasan secara berkala.
              </p>
            </div>

            {/* Grid Stats Cards - Side-by-side on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0C2461] flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pos Cabang</p>
                    <p className="text-sm font-bold text-[#0C2461]">Lokasi Terpantau Sistem Geofence</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-[#0C2461] pr-4">{stats.totalBranches}</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Personel Siaga Hari Ini</p>
                    <p className="text-sm font-bold text-green-600">Terverifikasi Absensi Face ID & GPS</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-green-600 pr-4">{stats.activeGuards} Aktif</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kepatuhan Patroli Lapangan</p>
                    <p className="text-sm font-bold text-red-600">Audit Kepatuhan SOP Pengamanan</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-[#0C2461] pr-4">{stats.complianceRate}</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kejadian Zero Incident</p>
                    <p className="text-sm font-bold text-yellow-600">Konsistensi Aman Bebas Musibah</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-green-600 pr-4">{stats.incidentFreeDays} Hari</p>
              </div>

            </div>

            {/* Vertically Stacked List of Pos/Cabang Geofence */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <h3 className="font-black text-sm uppercase text-[#0C2461] tracking-wider">Daftar Titik Koordinat Pos Pengamanan</h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-100 text-[10px] font-black text-blue-800 uppercase tracking-widest self-start sm:self-auto">
                  Status Kehadiran Lapangan
                </span>
              </div>

              <div className="flex flex-row overflow-x-auto gap-4 pb-4 custom-scrollbar scroll-smooth snap-x">
                {locations.length > 0 ? (
                  locations.map(loc => (
                    <div key={loc.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex justify-between items-center hover:shadow-md transition-all min-w-[280px] sm:min-w-[340px] max-w-sm snap-start shrink-0">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0C2461] flex items-center justify-center shrink-0">
                          <MapPin className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LOKASI PENUGASAN GEOFENCE</p>
                          <h4 className="text-sm font-bold text-[#0C2461] uppercase leading-tight truncate">{loc.name}</h4>
                          <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">RADIUS AREA: {loc.radius || 100} METERS</p>
                        </div>
                      </div>

                      <div className="text-right pr-4 shrink-0 flex items-center gap-3">
                        <span className="text-sm font-black text-green-600 uppercase tracking-wider whitespace-nowrap">{loc.activeWorkers} HADIR</span>
                        <span className="w-3 h-3 rounded-full relative flex">
                          {loc.activeWorkers > 0 && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${loc.activeWorkers > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Tidak ada data pos atau lokasi operasional terdaftar.
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* AGENDA & JADWAL DIKLAT SECTION (`id="agenda"`) - FULL WIDTH (VERTICALLY STACKED) */}
        <section id="agenda" className="bg-white border-b border-slate-200 py-16 scroll-mt-36">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">AGENDA KORPORAT & DIKLAT</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0C2461] tracking-tight uppercase">Jadwal Kegiatan & Sosialisasi</h2>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                Sistem kalender kegiatan pelatihan sertifikasi Gada Pratama, audit operasional K3, dan pengarahan harian.
              </p>
            </div>

            {/* Horizontal Scroll Calendars */}
            <div className="flex flex-row overflow-x-auto gap-4 pb-4 custom-scrollbar scroll-smooth snap-x">
              {agendas.map(agenda => (
                <div key={agenda.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between min-w-[280px] sm:min-w-[340px] max-w-sm snap-start shrink-0">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 animate-bounce" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{agenda.type || 'KEGIATAN KORPORAT'}</p>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0C2461] uppercase tracking-tight leading-tight truncate">
                        {agenda.title}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right pr-4 shrink-0 font-sans ml-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">TANGGAL PELAKSANAAN</p>
                    <p className="text-xs sm:text-sm font-black text-red-600 uppercase tracking-wider whitespace-nowrap">{agenda.date}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* MEDIA CENTER & BERITA SECTION (`id="berita"`) - FULL WIDTH (VERTICALLY STACKED) */}
        <section id="berita" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-16 border-b border-slate-200 scroll-mt-36">
          <div className="space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">MEDIA CENTER & INFORMASI</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0C2461] tracking-tight uppercase">Berita, Publikasi & Regulasi</h2>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                Ikuti terus perkembangan regulasi kepolisian terbaru, kegiatan sosial perusahaan, dan pengumuman administratif personel.
              </p>
            </div>

            {/* Tab/Category Filter bar with Search bar (fully stacked visually) */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex flex-col gap-4">
                
                {/* Search query input */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Masukkan kata kunci pencarian berita korporat..."
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl pl-11 pr-10 py-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C2461] focus:border-[#0C2461] transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Pills (Fully horizontal-scrollable pill row) */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full no-scrollbar">
                  {(['all', 'PENGUMUMAN', 'BERITA', 'OPERASIONAL', 'K3'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === tab 
                          ? 'bg-[#0C2461] text-white shadow-sm' 
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0C2461] hover:bg-slate-100'
                      }`}
                    >
                      {tab === 'all' ? 'Semua Publikasi' : tab}
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* News Output - Horizontal Scroll Row */}
            <div className="flex flex-row overflow-x-auto gap-4 pb-4 custom-scrollbar scroll-smooth snap-x">
              <AnimatePresence mode="popLayout">
                {filteredNews.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full py-16 text-center border border-dashed border-slate-300 rounded-2xl bg-white"
                  >
                     <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tidak ada publikasi resmi yang cocok dengan kriteria pencarian Anda.</p>
                  </motion.div>
                ) : (
                  filteredNews.map((item) => (
                    <motion.div 
                      key={item.id} 
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => setSelectedAnnouncement(item)}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4 cursor-pointer group min-w-[280px] sm:min-w-[440px] max-w-lg snap-start shrink-0"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {item.mediaUrl ? (
                          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                            {item.mediaUrl.startsWith('data:video') || item.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video src={item.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <Megaphone className="w-6 h-6 animate-pulse" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span>{item.type || 'PENGUMUMAN'}</span>
                            <span>•</span>
                            <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Draft'}</span>
                          </p>
                          <h4 className="text-xs sm:text-sm font-bold text-[#0C2461] uppercase tracking-tight leading-tight mt-0.5 group-hover:text-red-600 transition-colors truncate">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 truncate leading-relaxed">
                            {item.content}
                          </p>
                        </div>
                      </div>

                      <div className="text-right pr-4 shrink-0 flex items-center gap-1.5 text-red-600 group-hover:text-red-700 font-sans">
                        <span className="text-[9px] font-black uppercase tracking-widest block font-mono">BACA PESAN</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* GALLERIES DOCUMENTATION SECTION (`id="galeri"`) - FULL WIDTH (VERTICALLY STACKED) */}
        <section id="galeri" className="py-16 bg-white border-t border-slate-200 scroll-mt-36">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">DOKUMENTASI KESELAMATAN</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0C2461] tracking-tight uppercase">Galeri Kegiatan Lapangan</h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-semibold">
                Arsip foto & dokumentasi resmi kegiatan patroli wilayah, apel kesiapsiagaan, dan sinergi kemitraan.
              </p>
            </div>
            
            {/* Gallery Media List - Horizontal Scroll Row */}
            {galleries.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50 max-w-xl mx-auto">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Belum ada dokumentasi visual resmi yang diunggah.</p>
              </div>
            ) : (
              <div className="flex flex-row overflow-x-auto gap-4 pb-4 custom-scrollbar scroll-smooth snap-x">
                 {galleries.map(gal => (
                   <div 
                     key={gal.id} 
                     onClick={() => !gal.mediaUrl?.startsWith('data:video') && setSelectedImage(gal.mediaUrl)}
                     className={`relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-md aspect-square border border-slate-200 bg-slate-50 ${!gal.mediaUrl?.startsWith('data:video') ? 'cursor-pointer' : ''} transition-all shrink-0 w-64 h-64 snap-start`}
                   >
                      {gal.mediaUrl?.startsWith('data:video') || gal.mediaUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={gal.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" controls />
                      ) : (
                        <img src={gal.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={gal.title} />
                      )}
                      
                      {/* Persistent Overlay Title for clarity */}
                      {gal.title && (
                         <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
                           <p className="text-white text-xs font-black uppercase tracking-wider truncate">{gal.title}</p>
                           <p className="text-[8px] font-mono text-red-500 uppercase tracking-widest font-black mt-0.5">DOKUMENTASI_PT_GTP</p>
                         </div>
                      )}
                   </div>
                 ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* FOOTER */}
      <footer className="bg-[#0C2461] text-white border-t-8 border-red-600 pt-16 pb-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-slate-800">
            
            {/* Logo, Description */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                {profileInfo.logoUrl ? (
                   <img src={profileInfo.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                ) : (
                   <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-black text-[#0C2461] text-xl shadow-md border-b-4 border-red-600">{profileInfo.name ? profileInfo.name.charAt(0).toUpperCase() : 'G'}</div>
                )}
                <span className="font-black text-white tracking-tight text-lg uppercase">{profileInfo.name}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed text-justify max-w-sm font-semibold">
                Badan Usaha Jasa Pengamanan (BUJP) resmi terpercaya di bawah kepengawasan Gada Utama dengan dedikasi penuh mewujudkan lingkungan bisnis klien yang aman, kondusif, dan terkontrol.
              </p>
            </div>

            {/* Hubungi kami */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white tracking-widest uppercase border-b-2 border-red-600 inline-block pb-1">Kontak Kami</h4>
              <ul className="space-y-3 text-xs text-slate-300 font-semibold">
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{profileInfo.phone}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="lowercase">{profileInfo.email}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="lowercase">{profileInfo.website}</span>
                </li>
              </ul>
            </div>

            {/* Kantor pusat */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white tracking-widest uppercase border-b-2 border-red-600 inline-block pb-1">Kantor Operasional</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold whitespace-pre-line">
                {profileInfo.address}
              </p>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold">
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} {profileInfo.name}. All rights reserved. Registered Jasa Keamanan Negara RI.
            </p>
            <div className="flex items-center gap-6 text-[10px] uppercase tracking-wider text-slate-400">
              <Link to="/login" className="hover:text-white transition-colors">Portal HRD</Link>
              <button onClick={(e) => handleScroll(e, 'profil')} className="hover:text-white transition-colors cursor-pointer">Informasi</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ANNOUNCEMENT DETAIL VIEW MODAL */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-850"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="inline-flex px-3 py-1 bg-red-100 border border-red-200 text-red-700 text-[9px] font-black uppercase tracking-widest rounded-md">
                  {selectedAnnouncement.type || 'PENGUMUMAN'}
                </span>
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                
                {/* Media attachments */}
                {selectedAnnouncement.mediaUrl && (
                  <div className="w-full h-60 sm:h-80 bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner">
                    {selectedAnnouncement.mediaUrl.startsWith('data:video') || selectedAnnouncement.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={selectedAnnouncement.mediaUrl} className="w-full h-full object-cover" controls autoPlay playsInline />
                    ) : (
                      <img src={selectedAnnouncement.mediaUrl} className="w-full h-full object-cover" alt="Announcement Media" />
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-red-500" /> {selectedAnnouncement.createdAt ? new Date(selectedAnnouncement.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Draft'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-red-500" /> Manajemen Korporat</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-[#0C2461] tracking-tight leading-snug uppercase">{selectedAnnouncement.title}</h3>
                  
                  <div className="w-12 h-1 bg-red-600 rounded-full"></div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap font-medium">
                    {selectedAnnouncement.content}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                >
                  Tutup Informasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX FOR IMAGES */}
      <AnimatePresence>
        {selectedImage && (
          <div 
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-white"
            >
              <img src={selectedImage} alt="Fullscreen Doc" className="max-w-full max-h-[85vh] object-contain" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP PENGUMUMAN PENTING PEGAWAI */}
      <AnimatePresence>
        {activePopupAnnouncement && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-t-8 border-t-red-600"
            >
              <div className="p-4 sm:p-5 bg-gradient-to-r from-red-50 to-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/20">
                    <Megaphone className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-red-600 uppercase block font-mono">PEMBERITAHUAN PENTING</span>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pesan Terpusat Manajemen</h3>
                  </div>
                </div>
                <button 
                  onClick={handleDismissPopup}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {activePopupAnnouncement.mediaUrl && (
                  <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200">
                    <img 
                      src={activePopupAnnouncement.mediaUrl} 
                      alt="Lampiran Pengumuman" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex px-2 py-0.5 bg-red-100 border border-red-200 text-[8px] font-mono font-bold uppercase tracking-wider rounded text-red-600 font-bold">
                      {activePopupAnnouncement.type || 'PENGUMUMAN'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {activePopupAnnouncement.createdAt ? new Date(activePopupAnnouncement.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-[#0C2461] tracking-tight leading-snug uppercase">
                    {activePopupAnnouncement.title}
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap font-medium border-t border-slate-100 pt-3">
                  {activePopupAnnouncement.content}
                </p>
              </div>

              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-end items-center">
                <span className="text-[9px] text-slate-400 font-mono font-semibold text-center sm:text-left">Harap konfirmasi setelah membaca pengumuman ini.</span>
                <button 
                  onClick={handleDismissPopup}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg shadow-red-600/10 cursor-pointer text-center font-bold"
                >
                  Saya Mengerti & Konfirmasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

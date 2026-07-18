import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from '../../providers/AuthProvider';
import { auth, db } from '../../lib/firestoreClient';
import { collection, query, where, onSnapshot } from '../../lib/firestoreClient';
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  PieChart, 
  CheckSquare, 
  WalletCards, 
  Briefcase,
  LogOut,
  ArrowLeft,
  Settings,
  ShieldAlert,
  ChevronRight,
  Clock,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [companyProfile, setCompanyProfile] = useState({
    name: 'PT. GARUDA TRISULA PERKASA',
    logoUrl: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Sync company profile
    const unsub = onSnapshot(query(collection(db, 'company_info'), where("key", "==", "profile")), (snapshot) => {
      if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setCompanyProfile({
            name: data.name || 'PT. GARUDA TRISULA PERKASA',
            logoUrl: data.logoUrl || ''
          });
      }
    });

    // Real-time Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const navigation = [
    { name: 'Dashboard & Log Absen', href: '/admin', icon: PieChart, desc: 'Ringkasan presensi & radar geofencing' },
    { name: 'Struktur & Data Pegawai', href: '/admin/organization', icon: Users, desc: 'Kelola divisi, jabatan & NIK pegawai' },
    { name: 'Rostering Bulanan', href: '/admin/rostering', icon: Calendar, desc: 'Atur shift jadwal kerja mingguan' },
    { name: 'Sistem Approval', href: '/admin/approvals', icon: CheckSquare, desc: 'Validasi dokumen pengajuan cuti' },
    { name: 'Payroll Manager (Gaji)', href: '/admin/payroll', icon: WalletCards, desc: 'Rekap slip gaji otomatis & tunjangan' },
    { name: 'Multi-Cabang Geofencing', href: '/admin/geofencing', icon: MapPin, desc: 'Radius toleransi GPS pos regional' },
    { name: 'Laporan Kerja Pegawai', href: '/admin/reports', icon: Briefcase, desc: 'Arsip log harian & progres dinas' },
    { name: 'Manajemen Akun HRD', href: '/admin/hr-users', icon: UserCheck, desc: 'Otorisasi kredensial tim operasional' },
    { name: 'CMS Profil & Pengaturan', href: '/admin/settings', icon: Settings, desc: 'Modifikasi landing page & info kantor' },
  ];

  const currentRouteName = navigation.find(item => {
    if (item.href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(item.href);
  })?.name || 'Administrator Panel';

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600/20 overflow-hidden">
      
      {/* Top Banner Control Line */}
      <div className="h-11 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] text-blue-700 font-bold tracking-widest uppercase">
            Sistem Operasional HRD Aktif
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Live system clock */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium tracking-wider uppercase">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} • {currentTime.toLocaleTimeString('id-ID')}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase hidden lg:block">
            KONSOL ADMINISTRATOR
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-sm relative">
          
          {/* Corporate Profile Area */}
          <div className="p-6 border-b border-slate-100 flex flex-col gap-5">
            <div className="flex items-center gap-3.5">
              {companyProfile.logoUrl ? (
                <img 
                  src={companyProfile.logoUrl} 
                  alt="Company Logo" 
                  className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-sm" 
                />
              ) : (
                <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center shadow-md text-white font-black text-xl">
                  {companyProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-blue-900 tracking-tight text-sm truncate leading-tight uppercase">
                  {companyProfile.name}
                </h1>
                <p className="text-[10px] text-red-600 font-bold tracking-wider uppercase mt-0.5">
                  COMMAND ROOM
                </p>
              </div>
            </div>

            {/* Admin User Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
               <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-200 text-blue-700">
                 <Building2 className="w-5 h-5" />
               </div>
               <div className="overflow-hidden flex flex-col justify-center">
                 <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Session Operator</p>
                 <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">
                   {user?.displayName || user?.email?.split('@')[0] || 'Administrator'}
                 </p>
                 <p className="text-[10px] text-slate-500 font-medium truncate">Pengelola HRD & Operasional</p>
               </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-800 border border-blue-100 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
                  }`}
                >
                  {/* Left Active border bar indicator */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeBar"
                      className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} strokeWidth={2.2} />
                  
                  <div className="flex flex-col">
                    <span className="font-bold">{item.name}</span>
                    <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-blue-600/70' : 'text-slate-400 group-hover:text-blue-500/70'}`}>
                      {item.desc}
                    </span>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer Logout Section */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <button 
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-100 hover:border-red-600 shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Akhiri Sesi Operasional</span>
            </button>
          </div>
        </aside>

        {/* WORKSPACE CANVAS / MAIN CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col relative">
          
          {/* Main Top Header details */}
          <header className="px-6 lg:px-8 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white sticky top-0 z-10 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Beranda Konsol</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-blue-700">{currentRouteName}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{currentRouteName}</h2>
            </div>

            {/* Quick Actions / Diagnostic bar */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                <span>AKSES AMAN 256-BIT</span>
              </div>
              <button 
                onClick={() => window.history.back()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            </div>
          </header>

          {/* Page Contents Canvas */}
          <div className="p-6 lg:p-8 flex-1 max-w-[1500px] w-full mx-auto">
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  );
}

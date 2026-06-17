import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from '../../providers/AuthProvider';
import { auth, db } from '../../lib/firestoreClient';
import { collection, query, where, getDocs, onSnapshot } from '../../lib/firestoreClient';
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
  Settings
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'company_info'), where("key", "==", "profile")), (snapshot) => {
      if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.logoUrl) {
            setCompanyLogo(data.logoUrl);
          }
      }
    });
    return () => unsub();
  }, []);

  const navigation = [
    { name: 'Dashboard & Log Hari Ini', href: '/admin', icon: PieChart },
    { name: 'Struktur & Data Pegawai', href: '/admin/organization', icon: Users },
    { name: 'Dynamic Monthly Rostering', href: '/admin/rostering', icon: Calendar },
    { name: 'Sistem Approval (Izin/Lembur)', href: '/admin/approvals', icon: CheckSquare },
    { name: 'Payroll Manager (Gaji)', href: '/admin/payroll', icon: WalletCards },
    { name: 'Multi-Cabang Geofencing', href: '/admin/geofencing', icon: MapPin },
    { name: 'Laporan Kerja Pegawai', href: '/admin/reports', icon: Briefcase },
    { name: 'Manajemen Akun HRD', href: '/admin/hr-users', icon: Users },
    { name: 'CMS Profil & Setelan HRD', href: '/admin/settings', icon: Settings }, // assuming settings might be a future route, we just add the link
  ];

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col font-sans text-slate-300">
      {/* Top Navbar */}
      <div className="h-10 bg-[#0a111a] border-b border-slate-800/50 flex items-center justify-between px-4">
        <button 
          onClick={signOut}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2 rounded hover:bg-slate-800/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Log Out dari Dashboard Admin
        </button>
        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase hidden sm:block">
          ANDA SEDANG MENGOPERASIKAN KONSOL ADMINISTRATOR HRD
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-[#0d141f] border-r border-slate-800/60 flex flex-col shrink-0">
          
          <div className="p-5 border-b border-slate-800/60">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {companyLogo ? (
                  <img src={companyLogo} alt="Corporate Logo" className="w-10 h-10 rounded object-contain bg-white p-0.5 shadow-lg shadow-teal-500/20" />
                ) : (
                  <div className="w-10 h-10 bg-teal-600 rounded flex items-center justify-center shadow-lg shadow-teal-500/20">
                    <span className="text-white font-bold text-lg">HR</span>
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-white tracking-wide text-md leading-tight">COMMAND</h1>
                  <p className="text-[10px] text-slate-400">Admin Control Room</p>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded border border-teal-500/30 text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                AKTIF
              </div>
            </div>

            <div className="bg-[#151f2e] border border-slate-700/50 rounded-xl p-3 flex gap-3 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-xl"></div>
               <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 text-amber-500">
                 <Building2 className="w-5 h-5" />
               </div>
               <div className="overflow-hidden">
                 <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">PETUGAS HARI INI:</p>
                 <p className="text-sm font-bold text-slate-200 truncate">{user?.displayName || user?.email?.split('@')[0] || 'Administrator'}</p>
                 <p className="text-xs text-slate-400 truncate">(HR Director)</p>
               </div>
            </div>
          </div>
          
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hidden-scrollbar">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-800/80 text-white border border-slate-700/50 shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#070b14]">
          <div className="p-6 lg:p-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

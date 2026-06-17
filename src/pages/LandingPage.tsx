import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { db } from '../lib/firestoreClient';
import { collection, getDocs, query, where, orderBy } from '../lib/firestoreClient';
import { Lock, MapPin, ShieldCheck, Mail, Phone, Globe, Calendar, User, Clock } from 'lucide-react';

export default function LandingPage() {
  const [profileInfo, setProfileInfo] = useState({
    name: 'PT. GARUDA TRISULA PERKASA',
    logoUrl: '',
    tagline: 'INTEGRITAS • TANGGUH • PROFESIONAL • DISIPLIN',
    phone: '+62 811-1234-5678',
    email: 'admin@garudatrisula.com',
    website: 'www.garudatrisula.com',
    address: 'Jl. Jendral Sudirman Kav. 21, Jakarta Pusat, DKI Jakarta',
    content: "PT. GARUDA TRISULA PERKASA was established as a company focused on professional security (PAM Suwakarsa). With 10 years of experience in the security field and a Gada Utama qualification, we have achieved this. The various challenges we have faced have been invaluable resources and the best teachers in building this company. We are determined and committed to leading a professional security company."
  });
  const [news, setNews] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Profile
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
          content: data.content || "PT. GARUDA TRISULA PERKASA was established as a company focused on professional security (PAM Suwakarsa). With 10 years of experience in the security field and a Gada Utama qualification, we have achieved this. The various challenges we have faced have been invaluable resources and the best teachers in building this company. We are determined and committed to leading a professional security company."
        });
      }

      // 2. Fetch News/Announcements
      const newsSnapshot = await getDocs(collection(db, 'announcements'));
      const newsList = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setNews(newsList);

      // 3. Fetch Galleries
      const gallerySnapshot = await getDocs(collection(db, 'galleries'));
      const galleryList = gallerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setGalleries(galleryList);

      // 4. Fetch Locations and Attendance for Today
      const locSnapshot = await getDocs(collection(db, 'locations'));
      const locs = locSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const today = new Date().toISOString().split('T')[0];
      const attSnapshot = await getDocs(query(collection(db, 'attendances'), where("date", "==", today)));
      
      const activeCounts: Record<string, number> = {};
      attSnapshot.docs.forEach(doc => {
         const data = doc.data();
         if (data.status === 'Hadir' && data.locationId) {
             activeCounts[data.locationId] = (activeCounts[data.locationId] || 0) + 1;
         }
      });
      
      const locationsWithCounts = locs.map((loc: any) => ({
         ...loc,
         activeWorkers: activeCounts[loc.id] || 0
      }));
      setLocations(locationsWithCounts);
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a111a] text-slate-300 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#0a111a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
             {profileInfo.logoUrl ? (
                <img src={profileInfo.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white p-1 shadow-[0_0_15px_rgba(20,184,166,0.4)]" />
             ) : (
                <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-[0_0_15px_rgba(20,184,166,0.4)]">
                  {profileInfo.name ? profileInfo.name.charAt(0).toUpperCase() : 'H'}
                </div>
             )}
             <div className="flex flex-col">
               <span className="text-lg font-bold text-white leading-tight">{profileInfo.name}</span>
               <span className="text-[10px] font-semibold text-teal-400 tracking-widest uppercase">Official Corporate Portal</span>
             </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#tentang" className="hover:text-white transition-colors">Tentang Kami</a>
            <a href="#berita" className="hover:text-white transition-colors">Berita & Informasi</a>
            <a href="#galeri" className="hover:text-white transition-colors">Galeri Perusahaan</a>
          </div>

          <Link 
            to="/login" 
            className="group flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-teal-500 transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] hover:shadow-[0_0_25px_rgba(13,148,136,0.5)]"
          >
            <Lock className="w-4 h-4" />
            Akses HRD Portal
          </Link>
        </div>
      </nav>
      
      <main className="flex-grow pt-32 pb-20">
        {/* Banner Section */}
        <section id="tentang" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 flex flex-col lg:flex-row items-center gap-16 relative">
           
           <div className="lg:w-1/2 space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                TEKNOLOGI GEOFENCING CERDAS
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-sans">
                {profileInfo.tagline}
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed text-justify whitespace-pre-line">
                {profileInfo.content}
              </p>
           </div>

           {/* Dashboard Mockup Panel */}
           <div className="lg:w-1/2 relative w-full z-10">
              <div className="w-full bg-[#111827] rounded-3xl border border-slate-800 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-6">
                
                {/* Header Mockup */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-teal-400" />
                    <span className="font-bold text-white">Terminal Data Kehadiran Publik</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-[#0f172a] border border-blue-900/50 text-[10px] font-mono text-blue-400 tracking-wider">
                    LIVE TRACK
                  </span>
                </div>

                <p className="text-sm text-slate-400">
                  Akurasi deteksi radius presensi yang diawasi di seluruh lokasi operasional dinas terlindungi.
                </p>

                {/* Track Items */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {locations.length > 0 ? (
                    locations.map(loc => (
                      <div key={loc.id} className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 flex justify-between items-center group hover:bg-slate-800 transition-all hover:border-slate-600">
                        <div>
                          <h4 className="text-white font-bold text-sm tracking-wide uppercase">{loc.name}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-1">Radius {loc.radius} meter</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <div className="flex items-center gap-2">
                             <span className="relative flex h-2 w-2">
                               {loc.activeWorkers > 0 ? (
                                 <>
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                 </>
                               ) : (
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                               )}
                             </span>
                             <span className="text-sm font-bold text-white">{loc.activeWorkers}</span>
                           </div>
                           <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Hadir</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-600 border border-dashed border-slate-800 rounded-xl bg-[#0a111a]">
                       Belum ada data geofencing terdaftar.
                    </div>
                  )}
                </div>

              </div>

              {/* Glowing backdrops for the card */}
              <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-teal-600/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
              <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
           </div>
        </section>

        {/* News Section */}
        <section id="berita" className="py-24 relative bg-[#070b14]/50 border-t border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest mb-4 block">BULLETIN & UPDATES</span>
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Berita & Pengumuman Perusahaan</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Ikuti perkembangan ekspansi unit, pengesahan regulasi K3, serta laporan pencapaian operasional terbaru kami.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {news.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                   <p className="text-slate-500 italic font-medium">Belum ada pengumuman saat ini.</p>
                </div>
              ) : (
                news.map((item) => (
                  <div key={item.id} className="bg-[#111827] rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all group flex flex-col h-full shadow-lg">
                    
                    {/* Placeholder image area */}
                    <div className="h-48 bg-slate-800 relative overflow-hidden flex flex-col justify-end p-4">
                      {item.mediaUrl ? (
                        item.mediaUrl.startsWith('data:video') || item.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                           <video src={item.mediaUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen" autoPlay muted loop playsInline />
                        ) : (
                           <img src={item.mediaUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-70 hover:scale-105 transition-transform duration-700" />
                        )
                      ) : (
                         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                      )}
                      <span className="relative z-10 inline-block px-3 py-1 bg-teal-900/80 backdrop-blur-sm border border-teal-700/50 text-teal-300 text-[10px] font-bold uppercase tracking-widest rounded self-start">
                        {item.type || 'PENGUMUMAN'}
                      </span>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : 'Draft'}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-3 leading-snug group-hover:text-teal-400 transition-colors">{item.title}</h4>
                      <p className="text-sm text-slate-400 flex-grow leading-relaxed line-clamp-3">{item.content}</p>
                      
                      <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] font-medium text-slate-500">
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> HRD Admin</span>
                        <span className="text-teal-500/50">PT. GTP</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="galeri" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[10px] font-mono text-teal-500 uppercase tracking-widest mb-4 block">VISUAL MOMENTS</span>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Galeri Aktivitas Perusahaan</h2>
            <p className="text-slate-400 max-w-2xl mx-auto pb-12 border-b border-slate-800/50">
              Potret kolaborasi, audit keselamatan berkala, dan kebersamaan tim di berbagai pangkalan regional.
            </p>
            
            {/* Gallery Content */}
            {galleries.length === 0 ? (
              <div className="py-20 flex items-center justify-center">
                <p className="text-slate-600 font-medium">Galeri belum tersedia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-12 pb-12">
                 {galleries.map(gal => (
                   <div key={gal.id} className="relative group rounded-2xl overflow-hidden shadow-xl aspect-square border border-slate-800 bg-[#0f172a]">
                      {gal.mediaUrl?.startsWith('data:video') || gal.mediaUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={gal.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" controls />
                      ) : (
                        <img src={gal.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={gal.title} />
                      )}
                      
                      {gal.title && (
                         <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#0a111a] via-[#0a111a]/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                           <p className="text-white text-sm font-bold truncate drop-shadow-md">{gal.title}</p>
                         </div>
                      )}
                   </div>
                 ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#05080f] py-16 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 lg:gap-24">
            
            {/* Logo Col */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                {profileInfo.logoUrl ? (
                   <img src={profileInfo.logoUrl} alt="Logo" className="w-8 h-8 rounded object-contain bg-white p-0.5" />
                ) : (
                   <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center font-bold text-white text-sm">{profileInfo.name ? profileInfo.name.charAt(0).toUpperCase() : 'H'}</div>
                )}
                <span className="font-bold text-white text-lg">{profileInfo.name}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sistem HRIS Terintegrasi Dynamic Shift Roster & Geofencing Toleransi Radius Multi-Cabang NKRI.
              </p>
            </div>

            {/* Contact Col */}
            <div>
              <h4 className="text-white font-bold text-sm tracking-wider mb-6">HUBUNGI KAMI</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex items-center gap-3 hover:text-teal-400 transition-colors cursor-default">
                  <Phone className="w-4 h-4 text-teal-500" />
                  {profileInfo.phone}
                </li>
                <li className="flex items-center gap-3 hover:text-teal-400 transition-colors cursor-default">
                  <Mail className="w-4 h-4 text-teal-500" />
                  {profileInfo.email}
                </li>
                <li className="flex items-center gap-3 hover:text-teal-400 transition-colors cursor-default">
                  <Globe className="w-4 h-4 text-teal-500" />
                  {profileInfo.website}
                </li>
              </ul>
            </div>

            {/* Office Col */}
            <div>
              <h4 className="text-white font-bold text-sm tracking-wider mb-6">KANTOR PUSAT</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 whitespace-pre-line">
                {profileInfo.address}
              </p>
              <p className="text-[10px] font-mono text-slate-600">
                Sistem Sandboxed Lokal © {new Date().getFullYear()} {profileInfo.name}. Semua hak cipta dilindungi.
              </p>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}

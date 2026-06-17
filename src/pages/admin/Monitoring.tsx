import { useEffect, useState } from 'react';
import { db } from '../../lib/firestoreClient';
import { collection, query, where, getDocs, onSnapshot } from '../../lib/firestoreClient';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Download, Search, MapPin, ChevronDown, Bell, ArrowRight, Layers } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { auth } from '../../lib/firestoreClient';
import { useToast } from '../../providers/ToastProvider';

const COLORS = ['#14b8a6', '#f59e0b', '#ef4444']; // Hadir/Telat, Izin/Sakit, Alpa

export default function Monitoring() {
  const toast = useToast();
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, any>>({});
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [attendances, setAttendances] = useState<any[]>([]);

  useEffect(() => {
    const unsubLocs = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error(error);
    });

    const unsubEmps = onSnapshot(collection(db, 'employees'), (snap) => {
      const empList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const map: Record<string, any> = {};
      empList.forEach(e => {
        map[e.id] = e;
      });
      setEmployees(empList);
      setEmployeesMap(map);
    }, (error) => {
      console.error(error);
    });

    return () => {
      unsubLocs();
      unsubEmps();
    };
  }, []);

  useEffect(() => {
    const fromStr = dateFrom;
    const toStr = dateTo >= dateFrom ? dateTo : dateFrom;
    
    const q = query(
      collection(db, 'attendances'),
      where('date', '>=', fromStr),
      where('date', '<=', toStr)
    );
    
    const unsubscribeAttendances = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAttendances(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendances', auth);
    });

    return () => {
      unsubscribeAttendances();
    };
  }, [dateFrom, dateTo]);

  const getDaysArray = (startStr: string, endStr: string) => {
    const dates: string[] = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      dates.push(format(dt, 'yyyy-MM-dd'));
    }
    return dates;
  };

  const activeDays = getDaysArray(dateFrom, dateTo >= dateFrom ? dateTo : dateFrom);
  const activeDaysCount = activeDays.length || 1;

  // Filter employees according to location
  const filteredEmployees = selectedLocationId === 'all' 
    ? employees 
    : employees.filter(e => e.locationId === selectedLocationId);

  // Filter attendances according to location matching
  const isAttendanceInSelectedLocation = (a: any) => {
    if (selectedLocationId === 'all') return true;
    if (a.locationId && a.locationId === selectedLocationId) return true;
    const emp = employeesMap[a.employeeId];
    if (emp && emp.locationId === selectedLocationId) return true;
    return false;
  };

  const visibleAttendances = attendances.filter(isAttendanceInSelectedLocation);

  // Derive stats dynamically
  let hadir = 0;
  let izin = 0;
  let sakit = 0;
  let telat = 0;

  visibleAttendances.forEach(a => {
    const status = (a.status || '').toLowerCase().trim();
    if (status === 'hadir') hadir++;
    else if (status === 'izin') izin++;
    else if (status === 'sakit') sakit++;
    if (a.isLate === true || a.isLate === 'true' || a.isLate === 1) {
      telat++;
    }
  });

  const recorded = hadir + izin + sakit;
  const expectedTotal = filteredEmployees.length * activeDaysCount;
  let calculatedAlpa = expectedTotal - recorded;
  if (calculatedAlpa < 0 || expectedTotal === 0) calculatedAlpa = 0;

  const stats = {
    hadir,
    izin,
    sakit,
    alpa: calculatedAlpa,
    telat
  };

  const data = [
    { name: 'Hadir / Telat', value: hadir },
    { name: 'Izin / Sakit', value: izin + sakit },
    { name: 'Tidak Hadir (Alpa)', value: calculatedAlpa },
  ];

  const handleExport = async () => {
    try {
      // 1. Fetch Employees
      const empSnap = await getDocs(collection(db, 'employees'));
      let allEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      if (selectedLocationId !== 'all') {
         allEmployees = allEmployees.filter(e => e.locationId === selectedLocationId);
      }

      // 2. Fetch Attendances for date range
      const attSnap = await getDocs(query(
        collection(db, 'attendances'),
        where('date', '>=', dateFrom),
        where('date', '<=', dateTo)
      ));
      const allAttendances = attSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

      // 3. Prepare dates
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      const dates: string[] = [];
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        dates.push(format(dt, 'yyyy-MM-dd'));
      }

      const aoa: any[][] = [];
      
      // Row 1
      const row1 = ['Lap.Absen (' + (selectedLocationId === 'all' ? 'Semua Lokasi' : 'Lokasi Terpilih') + ')'];
      aoa.push(row1);
      
      // Row 2
      aoa.push([]);

      // Row 3
      aoa.push(['Jadwal Tgl', '', '', '', `${format(start, 'dd-MM-yyyy')} s/d ${format(end, 'dd-MM-yyyy')}`]);

      // Row 4
      const row4 = ['NIK', 'Nama', 'DIVISI', 'REGU'];
      dates.forEach(d => {
          const dayStr = d.split('-')[2]; // just the day
          row4.push(dayStr, '', '', '', '');
      });
      row4.push('TOTAL');
      aoa.push(row4);

      // Row 5
      const row5 = ['', '', '', ''];
      dates.forEach(() => {
          row5.push('Jam masuk', 'Jam Pulang', 'Lembur masuk', 'Lembur Pulang', 'Ket');
      });
      row5.push('masuk', 'telat', 'izin', 'tanpa keterangan');
      aoa.push(row5);

      // Rows 6+ Data
      allEmployees.forEach(emp => {
          const row: any[] = [
              emp.nik || emp.id.substring(0, 8), 
              emp.name || '-', 
              emp.departmentName || '-', 
              emp.rosterId || 'REGU A' 
          ];

          let masuk = 0;
          let telat = 0;
          let izinCount = 0;
          let alpaCount = 0;

          dates.forEach(d => {
              const att = allAttendances.find(a => (a.employeeId === emp.id || a.employeeId === emp.name) && a.date === d);
              
              if (att) {
                  row.push(att.timeIn || '');
                  row.push(att.timeOut || '');
                  row.push(''); // lembur masuk
                  row.push(''); // lembur pulang
                  row.push(att.status || 'Hadir');

                  const statusStr = (att.status || '').toLowerCase();
                  if (statusStr === 'hadir') masuk++;
                  if (att.isLate) telat++;
                  if (statusStr === 'izin' || statusStr === 'sakit') izinCount++;
                  if (statusStr === 'alpa') alpaCount++;
              } else {
                  row.push('', '', '', '', '');
                  alpaCount++;
              }
          });

          row.push(masuk, telat, izinCount, alpaCount);
          aoa.push(row);
      });

      if (allEmployees.length === 0) {
          // If no employees, at least output attendances as fallback
          allAttendances.forEach(a => {
              aoa.push([a.employeeId, '-', '-', '-', a.date, a.timeIn, a.timeOut, '', '', a.status]);
          });
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
      XLSX.writeFile(wb, `Laporan_Absensi_${dateFrom}_${dateTo}.xlsx`);
      toast.success('Pengeksporan laporan absensi berhasil!');
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengekspor data: ' + err.message);
    }
  };

  const totalAll = stats.hadir + stats.izin + stats.sakit + stats.alpa;
  const attendanceRate = totalAll > 0 ? Math.round((stats.hadir / totalAll) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto text-slate-300 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase mb-2 flex items-center gap-2">
            PORTAL ADMINISTRATOR HRD <span className="text-slate-300">•</span> SISTEM SINKRON UTAMA
          </p>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard & Log Hari Ini</h2>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
           <span className="tracking-wider">Date Frame:</span> 
           <span className="text-white">{format(new Date(dateFrom), 'MMMM yyyy')} (Live Track)</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Pie Chart Card */}
        <div className="lg:col-span-4 bg-[#0f172a] rounded-xl border border-slate-800/80 p-5 shadow-lg flex flex-col">
          <h3 className="font-bold text-white text-sm mb-1">Pie Chart Kehadiran Hari Ini</h3>
          <p className="text-xs text-slate-400 font-mono mb-6">Tanggal Aktif: {dateFrom}</p>

          <div className="flex-1 flex items-center justify-between">
            <div className="w-32 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ fontWeight: 600, color: '#fff' }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white leading-none">{totalAll}</span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider">ABSEN</span>
                </div>
            </div>

            <div className="flex-1 pl-6 space-y-3">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded bg-teal-500 shrink-0" />
                 <div>
                   <p className="text-xs font-bold text-white leading-none mb-0.5">Hadir / Telat</p>
                   <p className="text-[10px] text-slate-400 font-mono">{stats.hadir} orang ({totalAll ? Math.round((stats.hadir/totalAll)*100) : 0}%)</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded bg-amber-900/200 shrink-0" />
                 <div>
                   <p className="text-xs font-bold text-white leading-none mb-0.5">Izin / Sakit</p>
                   <p className="text-[10px] text-slate-400 font-mono">{stats.izin + stats.sakit} orang ({totalAll ? Math.round(((stats.izin+stats.sakit)/totalAll)*100) : 0}%)</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
                 <div>
                   <p className="text-xs font-bold text-white leading-none mb-0.5">Tidak Hadir (Alpa)</p>
                   <p className="text-[10px] text-slate-400 font-mono">{stats.alpa} orang ({totalAll ? Math.round((stats.alpa/totalAll)*100) : 0}%)</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <p className="text-xs text-slate-400 font-mono text-center">
              *Tingkat Kehadiran: {attendanceRate}% dari total {totalAll} regu staf.
            </p>
          </div>
        </div>

        {/* Stats Details Card */}
        <div className="lg:col-span-8 bg-[#0f172a] rounded-xl border border-slate-800/80 p-5 shadow-lg flex flex-col">
          <h3 className="font-bold text-white text-sm mb-1">Rincian Kehadiran Tim Kerja</h3>
          <p className="text-xs text-slate-400 mb-6">Grafik pantauan kehadiran di semua pabrik/cabang pada {dateFrom}</p>

          <div className="grid grid-cols-4 gap-4 flex-1">
             {/* Hadir Tepat */}
             <div className="bg-[#f0fdfa]/5 border border-teal-900/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-teal-400 tracking-wide uppercase">Hadir Tepat</span>
                <div>
                   <p className="text-3xl font-bold text-teal-400 tracking-tight leading-none mb-1">{Math.max(0, stats.hadir - stats.telat)}</p>
                   <p className="text-[10px] text-teal-600/70">Sesuai jam shift</p>
                </div>
             </div>
             
             {/* Terlambat */}
             <div className="bg-[#fff1f2]/5 border border-rose-900/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-rose-400 tracking-wide uppercase">Terlambat</span>
                <div>
                   <p className="text-3xl font-bold text-rose-400 tracking-tight leading-none mb-1">{stats.telat}</p>
                   <p className="text-[10px] text-rose-600/70">Dicatat otomatis</p>
                </div>
             </div>

             {/* Izin Sakit */}
             <div className="bg-[#fffbeb]/5 border border-amber-900/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-amber-500 tracking-wide uppercase">Izin Sakit</span>
                <div>
                   <p className="text-3xl font-bold text-amber-500 tracking-tight leading-none mb-1">{stats.izin + stats.sakit}</p>
                   <p className="text-[10px] text-amber-600/70">Sertakan dokumen</p>
                </div>
             </div>

             {/* Alpa */}
             <div className="bg-[#0f172a]/50 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">Alfa (Alpa)</span>
                <div>
                   <p className="text-3xl font-bold text-white tracking-tight leading-none mb-1">{stats.alpa}</p>
                   <p className="text-[10px] text-slate-400">Mangkir tanpa izin</p>
                </div>
             </div>
          </div>

          <div className="mt-4 flex items-center justify-between bg-[#0f172a]/30 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2">
               <Bell className="w-4 h-4 text-amber-500" />
               <span className="text-xs text-slate-300"><strong className="text-white">Lembur Pending:</strong> 0 pengajuan belum ditinjau.</span>
             </div>
             <button className="text-xs font-semibold text-teal-500 hover:text-teal-400 flex items-center gap-1 transition-colors">
               Proses Sekarang <ArrowRight className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>
      </div>

      {/* Geofence Grouping */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-base">Pengelompokan Pegawai Per Unit Kerja & Status Live Hari Ini</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">Pilah penempatan staf per lokasi geofence dengan rincian kehadiran real-time hari ini.</p>

        <div className="grid md:grid-cols-2 gap-4">
          {locations.map(loc => {
            // Calculate stats for this location today (using dateFrom)
            const locEmployees = employees.filter(e => e.locationId === loc.id);
            const locAttendances = attendances.filter(a => a.date === dateFrom && (a.locationId === loc.id || employeesMap[a.employeeId]?.locationId === loc.id));
            
            let locHadir = 0;
            let locIzinSakit = 0;
            locAttendances.forEach(a => {
              const status = (a.status || '').toLowerCase().trim();
              if (status === 'hadir') locHadir++;
              if (status === 'izin' || status === 'sakit') locIzinSakit++;
            });
            
            const locTotal = locEmployees.length;
            const locBelumAbsen = Math.max(0, locTotal - (locHadir + locIzinSakit));

            return (
              <div 
                key={loc.id} 
                onClick={() => setSelectedLocationId(loc.id)}
                className={`bg-[#0f172a] rounded-xl border p-4 flex items-center justify-between cursor-pointer hover:bg-[#151f32] transition-all duration-200 ${
                  selectedLocationId === loc.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-indigo-900/10 border border-indigo-500/20 flex items-center justify-center">
                     <MapPin className="w-5 h-5 text-indigo-400" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h4 className="font-bold text-white text-sm uppercase">{loc.name}</h4>
                       <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[10px] text-slate-400 font-mono">Radius: {loc.radius || 100}m</span>
                     </div>
                     <p className="text-xs text-slate-400 font-mono">GPS: {loc.latitude || 0}, {loc.longitude || 0}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="px-2 py-1 rounded bg-teal-500/10 border border-teal-500/25 text-xs font-semibold text-teal-400">{locHadir} Hadir</span>
                   <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-xs font-semibold text-amber-500">{locIzinSakit} Izin</span>
                   <span className="px-2 py-1 rounded bg-[#1e293b] border border-slate-700 text-xs font-semibold text-slate-400">{locBelumAbsen} Belum Absen</span>
                </div>
              </div>
            );
          })}
          {locations.length === 0 && (
            <div className="col-span-full px-4 py-8 text-center text-sm text-slate-600 border border-dashed border-slate-800 rounded-xl bg-[#0a111a]">
               Belum ada lokasi geofencing yang dibuat. Silakan tambahkan lokasi di menu Geofencing.
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col mt-6">
         {/* Filters Header */}
         <div className="p-4 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between bg-[#111827]/80">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, status..." 
                  className="bg-[#0f172a] border border-slate-700 text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-64"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Dari:</span>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-[#0f172a] border border-slate-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-teal-500"
                />
                <span className="text-slate-400 ml-2">Sampai:</span>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-[#0f172a] border border-slate-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Cabang/Pabrik:</span>
                <select 
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="bg-[#0f172a] border border-slate-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">🌍 Semua Lokasi Kerja</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-500 transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export to Excel (CSV)
            </button>
         </div>

         {/* Actual Table */}
         <div className="overflow-x-auto">
           <table className="w-full text-left text-xs whitespace-nowrap">
             <thead className="bg-[#151f32] border-b border-slate-800 uppercase font-mono tracking-wider text-slate-400">
               <tr>
                 <th className="px-6 py-4 font-semibold">Karyawan</th>
                 <th className="px-6 py-4 font-semibold">Tanggal</th>
                 <th className="px-6 py-4 font-semibold">Roster Shift</th>
                 <th className="px-6 py-4 font-semibold">Absen Masuk</th>
                 <th className="px-6 py-4 font-semibold">Absen Pulang</th>
                 <th className="px-6 py-4 font-semibold">Status</th>
                 <th className="px-6 py-4 font-semibold">Lembur Masuk</th>
                 <th className="px-6 py-4 font-semibold">Lembur Pulang</th>
                 <th className="px-6 py-4 font-semibold">Lokasi GPS & Radius</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-800/80">
               {attendances.length === 0 ? (
                 <tr>
                   <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">
                     Tidak ada data terekam untuk parameter ini.
                   </td>
                 </tr>
               ) : (
                 visibleAttendances.filter(a => {
                   if (!searchQuery) return true;
                   const s = searchQuery.toLowerCase();
                   const emp = employeesMap[a.employeeId];
                   const empName = emp ? (emp.name || '').toLowerCase() : '';
                   const empNik = emp ? (emp.nik || '').toLowerCase() : '';
                   const dateStr = (a.date || '').toLowerCase();
                   const statusStr = (a.status || '').toLowerCase();
                   return empName.includes(s) || empNik.includes(s) || dateStr.includes(s) || statusStr.includes(s) || a.employeeId.toLowerCase().includes(s);
                 }).map((a) => {
                   const emp = employeesMap[a.employeeId];
                   return (
                   <tr key={a.id} className="hover:bg-[#151f32]/50 transition-colors">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         {emp?.profilePicUrl ? (
                           <img src={emp.profilePicUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold">
                             {emp?.name ? emp.name.charAt(0).toUpperCase() : '?'}
                           </div>
                         )}
                         {emp ? (
                           <div>
                             <div className="font-bold text-white">{emp.name}</div>
                             <div className="text-[10px] text-slate-400 font-mono">NIK: {emp.nik || '-'}</div>
                           </div>
                         ) : (
                           <div>
                             <div className="font-bold text-white">ID Pegawai</div>
                             <div className="text-[10px] text-slate-500 font-mono">{a.employeeId}</div>
                           </div>
                         )}
                       </div>
                     </td>
                     <td className="px-6 py-4 font-mono text-slate-400">{a.date}</td>
                     <td className="px-6 py-4 text-slate-400">{a.shiftName || (a.shiftStart ? `${a.shiftStart} - ${a.shiftEnd}` : '-')}</td>
                     <td className="px-6 py-4 font-mono text-teal-400">
                        <div className="flex items-center gap-2">
                          <span>{a.timeIn || '--:--'}</span>
                          {(a.photoUrlIn || a.photoUrl) && (
                            <a href={a.photoUrlIn || a.photoUrl} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                              <img src={a.photoUrlIn || a.photoUrl} alt="Selfie In" referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover border border-slate-700 hover:border-teal-500" />
                            </a>
                          )}
                        </div>
                     </td>
                     <td className="px-6 py-4 font-mono text-slate-400">
                        <div className="flex items-center gap-2">
                          <span>{a.timeOut || '--:--'}</span>
                          {a.photoUrlOut && (
                            <a href={a.photoUrlOut} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                              <img src={a.photoUrlOut} alt="Selfie Out" referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover border border-slate-700 hover:border-teal-500" />
                            </a>
                          )}
                        </div>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase
                         ${a.status === 'Hadir' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                           a.status === 'Izin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                           a.status === 'Sakit' ? 'bg-amber-900/200/10 text-amber-400 border border-amber-500/20' :
                           'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                         }`}>
                         {a.status}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-slate-400 font-mono">
                        <div className="flex items-center gap-2">
                          <span>{a.overtimeIn || '--:--'}</span>
                          {a.photoUrlOvertimeIn && (
                            <a href={a.photoUrlOvertimeIn} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                              <img src={a.photoUrlOvertimeIn} alt="Selfie OT In" referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover border border-slate-700 hover:border-teal-500" />
                            </a>
                          )}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-slate-400 font-mono">
                        <div className="flex items-center gap-2">
                          <span>{a.overtimeOut || '--:--'}</span>
                          {a.photoUrlOvertimeOut && (
                            <a href={a.photoUrlOvertimeOut} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                              <img src={a.photoUrlOvertimeOut} alt="Selfie OT Out" referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover border border-slate-700 hover:border-teal-500" />
                            </a>
                          )}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
                       {a.latitude && a.longitude ? (
                         <div>
                           <div>{Number(a.latitude).toFixed(5)}, {Number(a.longitude).toFixed(5)}</div>
                           {a.distanceMeter !== undefined && (
                             <div className={a.distanceMeter <= (a.allowedRadius || 100) ? 'text-teal-400' : 'text-rose-400'}>
                               Jarak: {Math.round(a.distanceMeter)}m ({a.distanceMeter <= (a.allowedRadius || 100) ? 'Radius ✓' : 'Luar Radius ✗'})
                             </div>
                           )}
                         </div>
                       ) : (
                         <span>GPS N/A</span>
                       )}
                     </td>
                   </tr>
                 );
               })
               )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}

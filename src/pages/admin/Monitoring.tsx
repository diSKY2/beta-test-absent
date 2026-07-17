import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firestoreClient';
import { collection, query, where, getDocs, onSnapshot } from '../../lib/firestoreClient';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Download, Search, MapPin, ChevronDown, ChevronRight, Bell, ArrowRight, Layers, Building, Users } from 'lucide-react';
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

  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);
  
  const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [expandedSubDepts, setExpandedSubDepts] = useState<Record<string, boolean>>({});

  const toggleLoc = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedLocs(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleDept = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleSubDept = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedSubDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const unsubLocs = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error(error);
    });

    const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => {
      setDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error(error);
    });

    const unsubSubDepts = onSnapshot(collection(db, 'sub_departments'), (snap) => {
      setSubDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      unsubDepts();
      unsubSubDepts();
      unsubEmps();
    };
  }, []);

  useEffect(() => {
    const fromStr = dateFrom;
    const toStr = dateTo >= dateFrom ? dateTo : dateFrom;
    
    const q = query(
      collection(db, 'attendances'),
      where('attendanceDate', '>=', fromStr),
      where('attendanceDate', '<=', toStr)
    );
    
    const unsubscribeAttendances = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let formattedDate = data.date;
        if (!formattedDate && data.attendanceDate) {
          formattedDate = new Date(data.attendanceDate).toISOString().split('T')[0];
        }
        list.push({ id: doc.id, ...data, date: formattedDate });
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
        where('attendanceDate', '>=', dateFrom),
        where('attendanceDate', '<=', dateTo)
      ));
      const allAttendances = attSnap.docs.map(d => {
        const data = d.data() as any;
        let formattedDate = data.date;
        if (!formattedDate && data.attendanceDate) {
          formattedDate = new Date(data.attendanceDate).toISOString().split('T')[0];
        }
        return { id: d.id, ...data, date: formattedDate };
      });

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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto text-slate-700 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-[0.2em] text-slate-600 uppercase mb-2 flex items-center gap-2">
            PORTAL ADMINISTRATOR HRD <span className="text-slate-700">•</span> SISTEM SINKRON UTAMA
          </p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard & Log Hari Ini</h2>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
           <span className="tracking-wider">Date Frame:</span> 
           <span className="text-slate-900">{format(new Date(dateFrom), 'MMMM yyyy')} (Live Track)</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Pie Chart Card */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-5 shadow-lg flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Pie Chart Kehadiran Hari Ini</h3>
          <p className="text-xs text-slate-600 font-mono mb-6">Tanggal Aktif: {dateFrom}</p>

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
                  <span className="text-xl font-bold text-slate-900 leading-none">{totalAll}</span>
                  <span className="text-[9px] font-bold text-slate-600 tracking-wider">ABSEN</span>
                </div>
            </div>

            <div className="flex-1 pl-6 space-y-3">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded bg-blue-600 shrink-0" />
                 <div>
                   <p className="text-xs font-bold text-slate-900 leading-none mb-0.5">Hadir / Telat</p>
                   <p className="text-[10px] text-slate-600 font-mono">{stats.hadir} orang ({totalAll ? Math.round((stats.hadir/totalAll)*100) : 0}%)</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded bg-whitember-900/200 shrink-0" />
                 <div>
                   <p className="text-xs font-bold text-slate-900 leading-none mb-0.5">Izin / Sakit</p>
                   <p className="text-[10px] text-slate-600 font-mono">{stats.izin + stats.sakit} orang ({totalAll ? Math.round(((stats.izin+stats.sakit)/totalAll)*100) : 0}%)</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
                 <div>
                   <p className="text-xs font-bold text-slate-900 leading-none mb-0.5">Tidak Hadir (Alpa)</p>
                   <p className="text-[10px] text-slate-600 font-mono">{stats.alpa} orang ({totalAll ? Math.round((stats.alpa/totalAll)*100) : 0}%)</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80">
            <p className="text-xs text-slate-600 font-mono text-center">
              *Tingkat Kehadiran: {attendanceRate}% dari total {totalAll} regu staf.
            </p>
          </div>
        </div>

        {/* Stats Details Card */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 p-5 shadow-lg flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Rincian Kehadiran Tim Kerja</h3>
          <p className="text-xs text-slate-600 mb-6">Grafik pantauan kehadiran di semua pabrik/cabang pada {dateFrom}</p>

          <div className="grid grid-cols-4 gap-4 flex-1">
             {/* Hadir Tepat */}
             <div className="bg-teal-50 border border-teal-900/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-blue-600 tracking-wide uppercase">Hadir Tepat</span>
                <div>
                   <p className="text-3xl font-bold text-blue-600 tracking-tight leading-none mb-1">{Math.max(0, stats.hadir - stats.telat)}</p>
                   <p className="text-[10px] text-teal-600/70">Sesuai jam shift</p>
                </div>
             </div>
             
             {/* Terlambat */}
             <div className="bg-rose-50 border border-rose-900/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-rose-400 tracking-wide uppercase">Terlambat</span>
                <div>
                   <p className="text-3xl font-bold text-rose-400 tracking-tight leading-none mb-1">{stats.telat}</p>
                   <p className="text-[10px] text-rose-600/70">Dicatat otomatis</p>
                </div>
             </div>

             {/* Izin Sakit */}
             <div className="bg-amber-50 border border-amber-900/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-amber-500 tracking-wide uppercase">Izin Sakit</span>
                <div>
                   <p className="text-3xl font-bold text-amber-500 tracking-tight leading-none mb-1">{stats.izin + stats.sakit}</p>
                   <p className="text-[10px] text-amber-600/70">Sertakan dokumen</p>
                </div>
             </div>

             {/* Alpa */}
             <div className="bg-white/50 border border-slate-300/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">Alfa (Alpa)</span>
                <div>
                   <p className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-1">{stats.alpa}</p>
                   <p className="text-[10px] text-slate-600">Mangkir tanpa izin</p>
                </div>
             </div>
          </div>

          <div className="mt-4 flex items-center justify-between bg-white/30 p-3 rounded-lg border border-slate-200">
             <div className="flex items-center gap-2">
               <Bell className="w-4 h-4 text-amber-500" />
               <span className="text-xs text-slate-700"><strong className="text-slate-900">Lembur Pending:</strong> 0 pengajuan belum ditinjau.</span>
             </div>
             <button className="text-xs font-semibold text-blue-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
               Proses Sekarang <ArrowRight className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>
      </div>

      {/* Hierarchical Grouping & Status Live Hari Ini */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-900 text-base">Pengelompokan Pegawai Per Unit Kerja & Status Live Hari Ini</h3>
        </div>
        <p className="text-xs text-slate-600 mb-6">Pilah penempatan staf dengan gaya drop down (Kantor Cabang {'>'} Departemen {'>'} Sub Bagian/Regu). Pilih tanggal di atas untuk melihat status harian.</p>

        {/* Filters Header (Moved from Table) */}
        <div className="p-4 border border-slate-200 rounded-xl mb-6 flex flex-wrap gap-4 items-center justify-between bg-slate-50/80 shadow-lg">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIK..." 
                className="bg-white border border-slate-300 text-sm text-slate-900 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-1 focus:ring-teal-500 w-64"
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">Dari:</span>
              <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-600 ml-2">Sampai (Export):</span>
              <input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">Cabang/Pabrik:</span>
              <select 
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export to Excel (CSV)
          </button>
        </div>

        <div className="space-y-4">
          {locations.filter(loc => selectedLocationId === 'all' || loc.id === selectedLocationId).map(loc => {
            const isLocExpanded = expandedLocs[loc.id] !== false;
            
            // Calculate stats for loc
            const locEmployees = employees.filter(e => e.locationId === loc.id);
            if (locEmployees.length === 0) return null;
            
            const locAttendances = attendances.filter(a => a.date === dateFrom && employeesMap[a.employeeId]?.locationId === loc.id);
            let locHadir = 0; let locIzinSakit = 0;
            locAttendances.forEach(a => {
              const st = (a.status || '').toLowerCase().trim();
              if (st === 'hadir') locHadir++;
              if (st === 'izin' || st === 'sakit') locIzinSakit++;
            });
            const locBelumAbsen = Math.max(0, locEmployees.length - (locHadir + locIzinSakit));
            
            const deptsInLoc = departments.filter(d => locEmployees.some(e => e.departmentId === d.id));

            return (
              <div key={loc.id} className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden transition-all">
                <div onClick={(e) => toggleLoc(loc.id, e)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white select-none bg-slate-50">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-indigo-900/10 border border-indigo-500/20 flex items-center justify-center">
                       <Building className="w-5 h-5 text-indigo-400" />
                     </div>
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         {isLocExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                         <h4 className="font-bold text-slate-900 text-sm uppercase">{loc.name}</h4>
                         <span className="px-1.5 py-0.5 rounded bg-slate-50 text-[10px] text-slate-600 font-mono">Radius: {loc.radius || 100}m</span>
                       </div>
                       <p className="text-xs text-slate-600 font-mono">GPS: {loc.latitude || 0}, {loc.longitude || 0}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="px-2 py-1 rounded bg-blue-50 border border-teal-500/25 text-xs font-semibold text-blue-600">{locHadir} Hadir</span>
                     <span className="px-2 py-1 rounded bg-whitember-500/10 border border-amber-500/25 text-xs font-semibold text-amber-500">{locIzinSakit} Izin</span>
                     <span className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-600">{locBelumAbsen} Belum Absen</span>
                  </div>
                </div>

                {isLocExpanded && (
                  <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
                    {deptsInLoc.length === 0 ? (
                       <p className="text-slate-500 text-xs text-center py-4">Tidak ada departemen / karyawan di lokasi ini.</p>
                    ) : deptsInLoc.map(dept => {
                      const isDeptExpanded = expandedDepts[dept.id] !== false;
                      const deptEmployees = locEmployees.filter(e => e.departmentId === dept.id);
                      if(deptEmployees.length === 0) return null;

                      const subDeptsInDept = subDepartments.filter(sd => deptEmployees.some(e => e.subDepartmentId === sd.id));

                      return (
                        <div key={dept.id} className="bg-white/50 rounded-lg border border-slate-300/50 overflow-hidden">
                          <div onClick={(e) => toggleDept(dept.id, e)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/50 select-none">
                            <div className="flex items-center gap-3 pl-2">
                               <Layers className="w-4 h-4 text-blue-400" />
                               <div className="flex items-center gap-2">
                                 {isDeptExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                                 <h5 className="font-bold text-slate-900 text-sm">{dept.name}</h5>
                                 <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Departemen</span>
                               </div>
                            </div>
                            <span className="text-xs font-mono text-slate-600 pr-2">{deptEmployees.length} Pegawai</span>
                          </div>

                          {isDeptExpanded && (
                            <div className="border-t border-slate-300/50 p-3 space-y-3 bg-slate-100">
                              {subDeptsInDept.map(subDept => {
                                const isSubDeptExpanded = expandedSubDepts[subDept.id] !== false;
                                const subDeptEmployees = deptEmployees.filter(e => e.subDepartmentId === subDept.id);
                                if(subDeptEmployees.length === 0) return null;

                                const filteredSubDeptEmployees = subDeptEmployees.filter(emp => {
                                   if (!searchQuery) return true;
                                   const s = searchQuery.toLowerCase();
                                   return (emp.name || '').toLowerCase().includes(s) || (emp.nik || '').toLowerCase().includes(s);
                                });

                                return (
                                  <div key={subDept.id} className="bg-white/40 rounded border border-slate-300/30 overflow-hidden">
                                    <div onClick={(e) => toggleSubDept(subDept.id, e)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-200 select-none">
                                      <div className="flex items-center gap-3 pl-4">
                                         <Users className="w-4 h-4 text-emerald-400" />
                                         <div className="flex items-center gap-2">
                                           {isSubDeptExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                                           <h6 className="font-semibold text-slate-800 text-xs">{subDept.name}</h6>
                                           <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Sub Bagian / Regu</span>
                                         </div>
                                      </div>
                                      <span className="text-xs font-mono text-slate-600 pr-2">{subDeptEmployees.length} Pegawai</span>
                                    </div>

                                    {isSubDeptExpanded && (
                                      <div className="border-t border-slate-300/30 overflow-x-auto bg-white">
                                        <table className="w-full text-left text-xs whitespace-nowrap table-fixed">
                                          <thead className="bg-slate-50 border-b border-slate-200 uppercase font-mono tracking-wider text-slate-600">
                                            <tr>
                                              <th className="px-4 py-3 font-semibold w-64">Karyawan</th>
                                              <th className="px-4 py-3 font-semibold w-24">Tanggal</th>
                                              <th className="px-4 py-3 font-semibold w-32">Roster Shift</th>
                                              <th className="px-4 py-3 font-semibold w-36">Absen Masuk</th>
                                              <th className="px-4 py-3 font-semibold w-36">Absen Pulang</th>
                                              <th className="px-4 py-3 font-semibold w-24">Status</th>
                                              <th className="px-4 py-3 font-semibold w-36">Lembur Masuk</th>
                                              <th className="px-4 py-3 font-semibold w-36">Lembur Pulang</th>
                                              <th className="px-4 py-3 font-semibold w-48">Lokasi GPS & Radius</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-200/80">
                                            {filteredSubDeptEmployees.length === 0 ? (
                                              <tr>
                                                <td colSpan={9} className="px-4 py-6 text-center text-slate-500 italic">
                                                  Pencarian tidak menemukan karyawan di regu ini.
                                                </td>
                                              </tr>
                                            ) : filteredSubDeptEmployees.map(emp => {
                                               const a = attendances.find(attn => attn.date === dateFrom && attn.employeeId === emp.id) || {
                                                 status: 'Belum Absen',
                                                 employeeId: emp.id,
                                                 date: dateFrom
                                               };

                                               return (
                                                 <tr key={emp.id} className="hover:bg-white/50 transition-colors">
                                                   <td className="px-4 py-3">
                                                     <div className="flex items-center gap-3">
                                                       {emp?.profilePicUrl ? (
                                                         <img src={emp.profilePicUrl} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-slate-300" referrerPolicy="no-referrer" />
                                                       ) : (
                                                         <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                                           {emp?.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                                         </div>
                                                       )}
                                                       <div className="truncate w-40">
                                                         <div className="font-bold text-slate-900 text-xs truncate">{emp.name}</div>
                                                         <div className="text-[10px] text-slate-600 font-mono truncate">NIK: {emp.nik || '-'}</div>
                                                       </div>
                                                     </div>
                                                   </td>
                                                   <td className="px-4 py-3 font-mono text-slate-600 text-[10px]">{a.date}</td>
                                                   <td className="px-4 py-3 text-slate-600 text-[10px] truncate">{a.shiftName || (a.shiftStart ? `${a.shiftStart} - ${a.shiftEnd}` : '-')}</td>
                                                   <td className="px-4 py-3 font-mono text-blue-600 text-[10px]">
                                                      <div className="flex items-center gap-2">
                                                        <span>{a.timeIn || '--:--'}</span>
                                                        {(a.photoUrlIn || a.photoUrl) ? (
                                                          <a href={a.photoUrlIn || a.photoUrl} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                                                            <img src={a.photoUrlIn || a.photoUrl} alt="Selfie In" referrerPolicy="no-referrer" className="w-7 h-7 rounded object-cover border border-slate-300 hover:border-teal-500" />
                                                          </a>
                                                        ) : (
                                                          <span className="text-[9px] text-slate-600 bg-slate-100 px-1 py-0.5 rounded">No Photo</span>
                                                        )}
                                                      </div>
                                                   </td>
                                                   <td className="px-4 py-3 font-mono text-slate-600 text-[10px]">
                                                      <div className="flex items-center gap-2">
                                                        <span>{a.timeOut || '--:--'}</span>
                                                        {a.photoUrlOut ? (
                                                          <a href={a.photoUrlOut} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                                                            <img src={a.photoUrlOut} alt="Selfie Out" referrerPolicy="no-referrer" className="w-7 h-7 rounded object-cover border border-slate-300 hover:border-teal-500" />
                                                          </a>
                                                        ) : (
                                                          <span className="text-[9px] text-slate-600 bg-slate-100 px-1 py-0.5 rounded">No Photo</span>
                                                        )}
                                                      </div>
                                                   </td>
                                                   <td className="px-4 py-3">
                                                     <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase
                                                       ${a.status === 'Hadir' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                                         a.status === 'Izin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                         a.status === 'Sakit' ? 'bg-whitember-900/200/10 text-amber-400 border border-amber-500/20' :
                                                         a.status === 'Belum Absen' ? 'bg-slate-100 text-slate-600 border border-slate-300' :
                                                         'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                       }`}>
                                                       {a.status}
                                                     </span>
                                                   </td>
                                                   <td className="px-4 py-3 text-slate-600 font-mono text-[10px]">
                                                      <div className="flex items-center gap-2">
                                                        <span>{a.overtimeIn || '--:--'}</span>
                                                        {a.photoUrlOvertimeIn ? (
                                                          <a href={a.photoUrlOvertimeIn} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                                                            <img src={a.photoUrlOvertimeIn} alt="Selfie OT In" referrerPolicy="no-referrer" className="w-7 h-7 rounded object-cover border border-slate-300 hover:border-teal-500" />
                                                          </a>
                                                        ) : (
                                                          <span className="text-[9px] text-slate-600 bg-slate-100 px-1 py-0.5 rounded">No Photo</span>
                                                        )}
                                                      </div>
                                                   </td>
                                                   <td className="px-4 py-3 text-slate-600 font-mono text-[10px]">
                                                      <div className="flex items-center gap-2">
                                                        <span>{a.overtimeOut || '--:--'}</span>
                                                        {a.photoUrlOvertimeOut ? (
                                                          <a href={a.photoUrlOvertimeOut} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                                                            <img src={a.photoUrlOvertimeOut} alt="Selfie OT Out" referrerPolicy="no-referrer" className="w-7 h-7 rounded object-cover border border-slate-300 hover:border-teal-500" />
                                                          </a>
                                                        ) : (
                                                          <span className="text-[9px] text-slate-600 bg-slate-100 px-1 py-0.5 rounded">No Photo</span>
                                                        )}
                                                      </div>
                                                   </td>
                                                   <td className="px-4 py-3 text-slate-600 font-mono text-[9px] truncate">
                                                     {a.latitude && a.longitude ? (
                                                       <div className="truncate w-32">
                                                         <div>{Number(a.latitude).toFixed(5)}, {Number(a.longitude).toFixed(5)}</div>
                                                         {a.distanceMeter !== undefined && (
                                                           <div className={a.distanceMeter <= (a.allowedRadius || 100) ? 'text-blue-600' : 'text-rose-400'}>
                                                             Jarak: {Math.round(a.distanceMeter)}m ({a.distanceMeter <= (a.allowedRadius || 100) ? 'Radius ✓' : 'Luar Radius ✗'})
                                                           </div>
                                                         )}
                                                       </div>
                                                     ) : (
                                                       <span className="text-slate-600 italic">GPS N/A</span>
                                                     )}
                                                   </td>
                                                 </tr>
                                               );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {locations.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-600 border border-dashed border-slate-200 rounded-xl bg-slate-50">
               Belum ada lokasi geofencing yang dibuat. Silakan tambahkan lokasi di menu Geofencing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

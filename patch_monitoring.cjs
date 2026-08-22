const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

const targetLoop = `      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      const dates: string[] = [];
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        dates.push(format(dt, 'yyyy-MM-dd'));
      }`;

const newLoop = `      const dates: string[] = [];
      let current = new Date(dateFrom + 'T12:00:00Z');
      const last = new Date(dateTo + 'T12:00:00Z');
      while (current <= last) {
        dates.push(format(current, 'yyyy-MM-dd'));
        current.setDate(current.getDate() + 1);
      }`;
code = code.replace(targetLoop, newLoop);

const getDaysTarget = `  const getDaysArray = (startStr: string, endStr: string) => {
    const dates: string[] = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      dates.push(format(dt, 'yyyy-MM-dd'));
    }
    return dates;
  };`;
  
const newGetDays = `  const getDaysArray = (startStr: string, endStr: string) => {
    const dates: string[] = [];
    let current = new Date(startStr + 'T12:00:00Z');
    const last = new Date(endStr + 'T12:00:00Z');
    while (current <= last) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };`;
code = code.replace(getDaysTarget, newGetDays);

const handleExportStart = `  const handleExport = async () => {
    try {
      // 1. Use loaded Employees
      let allEmployees = filteredEmployees;

      // 2. Use loaded Attendances
      const allAttendances = attendances;`;

const newHandleExportStart = `  const handleExport = async () => {
    try {
      toast.triggerToast('Menyiapkan data export, mohon tunggu...');
      
      // Ambil data fresh dari API untuk memastikan semua range tanggal ikut (bukan cuma state saat ini)
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(baseUrl + '/api/admin/monitoring-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom,
          dateTo: dateTo >= dateFrom ? dateTo : dateFrom
        })
      });
      if (!res.ok) throw new Error('Gagal memuat data terbaru dari server');
      const freshData = await res.json();
      
      const allAttendances = (freshData.attendances || []).map((a: any) => {
        let formattedDate = a.date;
        if (!formattedDate && a.attendanceDate) {
          formattedDate = format(new Date(a.attendanceDate), 'yyyy-MM-dd');
        }
        return { ...a, date: formattedDate };
      });
      
      const freshSchedules = (freshData.schedules || []).map((s: any) => {
        return { ...s, dateFormatted: s.date ? format(new Date(s.date), 'yyyy-MM-dd') : null };
      });

      // 1. Use loaded Employees
      let allEmployees = filteredEmployees;`;

code = code.replace(handleExportStart, newHandleExportStart);

const targetSchedMatch = `              const sched = schedules.find(s => s.employeeId === emp.id && s.dateFormatted === d);`;
const newSchedMatch = `              const sched = freshSchedules.find((s: any) => s.employeeId === emp.id && s.dateFormatted === d);`;
code = code.replace(targetSchedMatch, newSchedMatch);


fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

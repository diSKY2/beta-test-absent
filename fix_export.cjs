const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

const oldExport = `  const handleExport = async () => {
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

      // 3. Prepare dates`;

const newExport = `  const handleExport = async () => {
    try {
      // 1. Use loaded Employees
      let allEmployees = filteredEmployees;

      // 2. Use loaded Attendances
      const allAttendances = attendances;

      // 3. Prepare dates`;

code = code.replace(oldExport, newExport);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

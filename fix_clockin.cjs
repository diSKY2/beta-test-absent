const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const oldLogic = `    if (attendanceModalType === 'masuk') {
      // Clock In
      const payload = {
        action: 'addDoc',
        collection: 'attendances',
        data: {
          employeeId: targetEmployeeId,
          attendanceDate: new Date(),
          status: 'Hadir',
          timeIn: currentTimeStr,
          timeOut: null,
          isLate: calculatedIsLate,
          photoUrl: selfiePreview,
        }
      };

      // --- OPTIMISTIC UI UPDATE ---
      const optimisticAtt = {
        id: 'temp-' + Date.now(),
        ...payload.data,
        attendanceDate: payload.data.attendanceDate.toISOString(),
      };
      
      if (!isGroupAttendance) {
        setTodayAttendance(optimisticAtt as any);
        setAttendancesHistory(prev => [optimisticAtt as any, ...prev]);
      } else {
        setTeamAttendances(prev => [optimisticAtt as any, ...prev]);
      }`;

const newLogic = `    if (attendanceModalType === 'masuk') {
      // Clock In
      const isRetrying = !isGroupAttendance && todayAttendance?.status === 'Ditolak';
      const payload = {
        action: isRetrying ? 'updateDoc' : 'addDoc',
        collection: 'attendances',
        docId: isRetrying ? todayAttendance.id : undefined,
        data: {
          employeeId: targetEmployeeId,
          attendanceDate: new Date(),
          status: 'Hadir',
          timeIn: currentTimeStr,
          timeOut: null,
          isLate: calculatedIsLate,
          photoUrl: selfiePreview,
        }
      };

      // --- OPTIMISTIC UI UPDATE ---
      const optimisticAtt = {
        id: isRetrying ? todayAttendance.id : 'temp-' + Date.now(),
        ...payload.data,
        attendanceDate: payload.data.attendanceDate.toISOString(),
      };
      
      if (!isGroupAttendance) {
        setTodayAttendance(optimisticAtt as any);
        if (isRetrying) {
          setAttendancesHistory(prev => prev.map(a => a.id === todayAttendance.id ? (optimisticAtt as any) : a));
        } else {
          setAttendancesHistory(prev => [optimisticAtt as any, ...prev]);
        }
      } else {
        setTeamAttendances(prev => [optimisticAtt as any, ...prev]);
      }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

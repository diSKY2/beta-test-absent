const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// Replace getAttendanceButtonState
code = code.replace(/const getAttendanceButtonState = \(\) => \{[\s\S]*?\};\n\n  const getClockOutButtonState = \(\) => \{[\s\S]*?\};/m, 
`const getAttendanceButtonState = () => {
    const sch = getTodayScheduleDetails();
    if (sch.isOffDay) {
      return { isEnabled: false, reason: "Hari ini adalah jadwal libur (Off Day)." };
    }

    const [startH, startM] = sch.shiftStart.split(':').map(Number);
    const startObj = new Date();
    startObj.setHours(startH, startM, 0, 0);

    const [endH, endM] = sch.shiftEnd.split(':').map(Number);
    const endObj = new Date();
    endObj.setHours(endH, endM, 0, 0);

    // Jika sudah lewat jam pulang (Bug 2)
    if (currentTime.getTime() >= endObj.getTime()) {
      return { 
        isEnabled: false, 
        reason: \`Shift telah berakhir (\${sch.shiftEnd}). Anda dihitung mangkir karena tidak absen masuk.\` 
      };
    }

    const timeDiffMinutes = (startObj.getTime() - currentTime.getTime()) / (60 * 1000);

    // Timing check: can only click 10 minutes before the shift start (Bug 1)
    if (timeDiffMinutes > 10) {
      return { 
        isEnabled: false, 
        reason: \`Tombol hanya aktif mulai 10 menit sebelum jam masuk shift (\${sch.shiftStart}).\` 
      };
    }

    return { isEnabled: true, reason: "" };
  };

  const getClockOutButtonState = () => {
    const sch = getTodayScheduleDetails();
    if (sch.isOffDay) {
      return { isEnabled: false, reason: "Hari ini adalah jadwal libur (Off Day)." };
    }

    const [endH, endM] = sch.shiftEnd.split(':').map(Number);
    const endObj = new Date();
    endObj.setHours(endH, endM, 0, 0);

    const hasPassedShiftEnd = currentTime.getTime() >= endObj.getTime();

    if (!hasPassedShiftEnd) {
      return { 
        isEnabled: false, 
        reason: \`Tombol hanya aktif setelah memasuki waktu pulang (\${sch.shiftEnd}).\` 
      };
    }

    return { isEnabled: true, reason: "" };
  };`);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

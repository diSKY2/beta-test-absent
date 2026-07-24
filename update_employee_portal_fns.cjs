const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const fetchExchangeCode = `
  const fetchShiftExchanges = async () => {
    if (!employee) return;
    try {
      const res = await fetch(API_BASE_URL + '/api/shift-exchanges/me/' + employee.id);
      if (res.ok) {
        setExchangeList(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const res = await fetch(API_BASE_URL + '/api/employees-list'); // Need this endpoint or just fetch from /api/employees ? 
      // I'll create a lightweight endpoint for employee dropdown or reuse existing if there is one.
    } catch (err) { }
  };
  
  useEffect(() => {
    if (showExchangeModal) {
      fetchShiftExchanges();
      fetch(API_BASE_URL + '/api/employees')
        .then(res => res.json())
        .then(data => setAllEmployees(data.filter((e: any) => e.id !== employee?.id)))
        .catch(console.error);
    }
  }, [showExchangeModal, employee]);

  useEffect(() => {
    if (exchangeReplacerId) {
      fetch(API_BASE_URL + '/api/schedules/employee/' + exchangeReplacerId)
        .then(res => res.json())
        .then(data => {
            const future = data.filter((s: any) => new Date(s.date) >= new Date() && !s.isOffDay);
            setReplacerSchedules(future);
        })
        .catch(console.error);
    } else {
      setReplacerSchedules([]);
    }
  }, [exchangeReplacerId]);

  useEffect(() => {
    if (schedulesList.length > 0) {
      const future = schedulesList.filter(s => new Date(s.date) >= new Date() && !s.isOffDay);
      setMyFutureSchedules(future);
    }
  }, [schedulesList]);

  const handleSubmitExchange = async () => {
    if (!exchangeReplacerId || !exchangeDateReplace || !exchangeDatePayback || !exchangeReason) {
      return triggerToast('Mohon lengkapi semua form tukar jadwal');
    }
    
    // Find the dates from schedule IDs
    const mySchedule = myFutureSchedules.find(s => s.id === exchangeDateReplace);
    const repSchedule = replacerSchedules.find(s => s.id === exchangeDatePayback);
    
    if (!mySchedule || !repSchedule) return;

    try {
      const res = await fetch(API_BASE_URL + '/api/shift-exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: employee?.id,
          replacerId: exchangeReplacerId,
          dateToReplace: mySchedule.date,
          dateToPayback: repSchedule.date,
          reason: exchangeReason
        })
      });
      if (res.ok) {
        triggerToast('Pengajuan tukar jadwal terkirim ke rekan Anda');
        setExchangeReplacerId('');
        setExchangeDateReplace('');
        setExchangeDatePayback('');
        setExchangeReason('');
        setExchangeTab('history');
        fetchShiftExchanges();
      } else {
        triggerToast('Gagal mengajukan tukar jadwal');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal terhubung ke server');
    }
  };

  const handleUpdateExchangeStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(API_BASE_URL + '/api/shift-exchanges/' + id + '/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerToast('Status tukar jadwal berhasil diperbarui');
        fetchShiftExchanges();
      }
    } catch (err) {
      console.error(err);
    }
  };
`;

code = code.replace(/const triggerToast = \(msg: string\) => \{/, fetchExchangeCode + "\n  const triggerToast = (msg: string) => {");

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

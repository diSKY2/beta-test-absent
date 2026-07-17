import { useState, useEffect } from 'react';
import { db } from '../../lib/firestoreClient';
import { collection, query, where, getDocs } from '../../lib/firestoreClient';
import { Calculator, Download } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { format } from 'date-fns';
import { auth } from '../../lib/firestoreClient';
import * as XLSX from 'xlsx';

export default function Payroll() {
  const [month, setMonth] = useState(format(new Date(), 'MM'));
  const [year, setYear] = useState(format(new Date(), 'yyyy'));
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const calculatePayroll = async () => {
    setIsLoading(true);
    try {
      const EMPLOYEES = await getDocs(collection(db, 'employees'));
      
      const startPrefix = `${year}-${month}`; // matches yyyy-MM
      
      const ATTENDANCES = await getDocs(collection(db, 'attendances'));
      const OVERTIMES = await getDocs(query(collection(db, 'overtime_requests'), where('status', '==', 'Approved')));
      
      const results: any[] = [];
      EMPLOYEES.docs.forEach(empDoc => {
        const emp = { id: empDoc.id, ...empDoc.data() } as any;
        
        let hadirCount = 0;
        ATTENDANCES.docs.forEach(attDoc => {
           const att = attDoc.data();
           let isDateMatch = false;
           
           if (att.date && typeof att.date === 'string') {
              isDateMatch = att.date.startsWith(startPrefix);
           } else if (att.date && att.date instanceof Date) {
              const dt = new Date(att.date);
              isDateMatch = dt.getFullYear().toString() === year && (dt.getMonth() + 1).toString().padStart(2, '0') === month;
           } else if (att.date && typeof att.date === 'object' && att.date.seconds) { // Firebase Timestamp
              const dt = new Date(att.date.seconds * 1000);
              isDateMatch = dt.getFullYear().toString() === year && (dt.getMonth() + 1).toString().padStart(2, '0') === month;
           }

           if (att.employeeId === emp.id && isDateMatch && att.status === 'Hadir') {
             hadirCount++;
           }
        });
        
        let lemburJam = 0;
        OVERTIMES.docs.forEach(otDoc => {
           const ot = otDoc.data();
           let isDateMatch = false;
           
           if (ot.date && typeof ot.date === 'string') {
              isDateMatch = ot.date.startsWith(startPrefix);
           } else if (ot.date && ot.date instanceof Date) {
              const dt = new Date(ot.date);
              isDateMatch = dt.getFullYear().toString() === year && (dt.getMonth() + 1).toString().padStart(2, '0') === month;
           } else if (ot.date && typeof ot.date === 'object' && ot.date.seconds) {
              const dt = new Date(ot.date.seconds * 1000);
              isDateMatch = dt.getFullYear().toString() === year && (dt.getMonth() + 1).toString().padStart(2, '0') === month;
           }

           if (ot.employeeId === emp.id && isDateMatch) {
             lemburJam += ot.hours;
           }
        });
        
        const gajiPokok = Number(emp.baseSalary) || 0;
        const tunjanganLembur = lemburJam * 100000;
        
        let totalTunjanganTetap = 0;
        const employeeAllowances = emp.allowances || [];
        if (Array.isArray(employeeAllowances)) {
           employeeAllowances.forEach((a: any) => totalTunjanganTetap += Number(a.amount || 0));
        }

        let totalPotongan = 0;
        const employeeDeductions = emp.deductions || [];
        if (Array.isArray(employeeDeductions)) {
           employeeDeductions.forEach((d: any) => totalPotongan += Number(d.amount || 0));
        }

        const total = gajiPokok + tunjanganLembur + totalTunjanganTetap - totalPotongan;
        
        results.push({
          id: emp.id,
          name: emp.name,
          baseSalary: gajiPokok,
          hadirCount,
          lemburJam,
          tunjanganLembur,
          totalTunjanganTetap,
          totalPotongan,
          allowances: employeeAllowances,
          deductions: employeeDeductions,
          total
        });
      });
      
      setPayrolls(results);
    } catch(e) {
       console.error(e);
       handleFirestoreError(e, OperationType.GET, 'payroll_calc', auth);
    }
    setIsLoading(false);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(payrolls.map(p => ({
      'ID Pegawai': p.id,
      'Nama': p.name,
      'Gaji Pokok': p.baseSalary,
      'Tunjangan Tetap': p.totalTunjanganTetap,
      'Potongan': p.totalPotongan,
      'Kehadiran (Hari)': p.hadirCount,
      'Lembur (Jam)': p.lemburJam,
      'Tunjangan Lembur': p.tunjanganLembur,
      'Total Gaji Bersih': p.total
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    XLSX.writeFile(wb, `Payroll_${year}_${month}.xlsx`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Payroll Manager</h2>
        <p className="text-slate-600">Kalkulasi gaji otomatis berdasarkan kehadiran dan lembur.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-medium text-slate-700">Bulan</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-lg">
            {Array.from({length: 12}).map((_, i) => {
               const m = (i + 1).toString().padStart(2, '0');
               return <option key={m} value={m}>{format(new Date(2000, i, 1), 'MMMM')}</option>
            })}
          </select>
        </div>
        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-medium text-slate-700">Tahun</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-lg" />
        </div>
        <button 
          onClick={calculatePayroll} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg flex items-center justify-center gap-2 transition-colors w-full md:w-auto h-[42px]"
        >
          <Calculator className="w-5 h-5" />
          {isLoading ? 'Menghitung...' : 'Kalkulasi Gaji'}
        </button>
      </div>

      {payrolls.length > 0 && (
         <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">Hasil Perhitungan ({month}/{year})</h3>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-900/20 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Pegawai</th>
                    <th className="px-6 py-4 font-medium text-right">Gaji Pokok</th>
                    <th className="px-6 py-4 font-medium text-center">Kehadiran (Hari)</th>
                    <th className="px-6 py-4 font-medium text-right">Lembur (x 100rb)</th>
                    <th className="px-6 py-4 font-medium text-right text-teal-600">Total Tunjangan</th>
                    <th className="px-6 py-4 font-medium text-right text-rose-600">Total Potongan</th>
                    <th className="px-6 py-4 font-bold text-slate-900 text-right text-base">Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-600">{p.id}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">Rp {p.baseSalary.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-center text-green-600 font-medium">
                        {p.hadirCount}
                      </td>
                      <td className="px-6 py-4 text-right text-orange-600 font-medium">
                        {p.lemburJam}jam<br/>
                        <span className="text-xs">Rp {p.tunjanganLembur.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-teal-600">
                        {p.allowances?.map((a: any, i: number) => (
                           <div key={i} className="text-xs">{a.name}: <span className="font-medium inline-block min-w-[70px]">Rp {Number(a.amount).toLocaleString('id-ID')}</span></div>
                        ))}
                        {(!p.allowances || p.allowances.length === 0) && <div className="text-xs text-slate-500">-</div>}
                        <div className="border-t border-slate-300/50 mt-1 pt-1 font-bold text-sm">Rp {p.totalTunjanganTetap.toLocaleString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-rose-600">
                        {p.deductions?.map((d: any, i: number) => (
                           <div key={i} className="text-xs">{d.name}: <span className="font-medium inline-block min-w-[70px]">Rp {Number(d.amount).toLocaleString('id-ID')}</span></div>
                        ))}
                        {(!p.deductions || p.deductions.length === 0) && <div className="text-xs text-slate-500">-</div>}
                        <div className="border-t border-slate-300/50 mt-1 pt-1 font-bold text-sm">Rp {p.totalPotongan.toLocaleString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 text-base">
                        Rp {p.total.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
         </div>
      )}
    </div>
  );
}

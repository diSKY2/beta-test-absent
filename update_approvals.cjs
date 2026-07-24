const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Approvals.tsx', 'utf8');

const target = `<div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Permintaan Izin & Sakit</h3>`;

const shiftExchangeUI = `
            {/* SHIFT EXCHANGES */}
            {shiftExchanges && shiftExchanges.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Pengajuan Tukar Jadwal</h3>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">{shiftExchanges.length} Pending Danru</span>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {shiftExchanges.map(ex => (
                    <div key={ex.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{ex.requesterName} &#8594; {ex.replacerName}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">Alasan: {ex.reason || '-'}</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl mb-4 text-xs font-medium text-slate-700 shadow-sm border border-slate-100">
                        <p className="mb-1"><strong className="text-blue-700">Tgl Digantikan (Libur):</strong> {new Date(ex.dateToReplace).toLocaleDateString('id-ID')}</p>
                        <p><strong className="text-green-700">Tgl Pelunasan (Masuk):</strong> {new Date(ex.dateToPayback).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleExchangeApproval(ex.id, 'Approved')} className="flex-1 bg-[#0C2461] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors">Setujui Tukar Jadwal</button>
                        <button onClick={() => handleExchangeApproval(ex.id, 'Rejected')} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
`;

code = code.replace(target, shiftExchangeUI + "\n\n" + target);

fs.writeFileSync('src/pages/admin/Approvals.tsx', code);

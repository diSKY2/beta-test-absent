const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// I will add a button in 'jadwal' tab
const jadwalTarget = `<h3 className="text-sm font-black text-[#0C2461] uppercase tracking-tight">Schedules & Shift Roster</h3>`;
const jadwalReplace = `
<div className="flex items-center justify-between">
  <h3 className="text-sm font-black text-[#0C2461] uppercase tracking-tight">Schedules & Shift Roster</h3>
  <button onClick={() => setShowExchangeModal(true)} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg shadow-sm border border-blue-200 active:scale-95 transition-all">
    Tukar Jadwal
  </button>
</div>
`;

code = code.replace(jadwalTarget, jadwalReplace);

const modalUI = `
      {/* EXCHANGE MODAL */}
      <AnimatePresence>
        {showExchangeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight tracking-tight">Tukar Jadwal Shift</h3>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Pengajuan Perubahan Jadwal</p>
                  </div>
                </div>
                <button onClick={() => setShowExchangeModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300">
                  <Check className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center border-b border-slate-100 text-xs font-bold uppercase tracking-widest bg-white sticky top-[72px] z-10 shrink-0">
                <button onClick={() => setExchangeTab('request')} className={\`flex-1 py-3 text-center transition-colors \${exchangeTab === 'request' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-slate-400'}\`}>Pengajuan</button>
                <button onClick={() => setExchangeTab('incoming')} className={\`flex-1 py-3 text-center transition-colors \${exchangeTab === 'incoming' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-slate-400'}\`}>Permintaan</button>
                <button onClick={() => setExchangeTab('history')} className={\`flex-1 py-3 text-center transition-colors \${exchangeTab === 'history' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-slate-400'}\`}>Riwayat</button>
              </div>

              <div className="p-5 overflow-y-auto no-scrollbar bg-slate-50/50 flex-grow">
                {exchangeTab === 'request' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Jadwal Anda (Tanggal Digantikan)</label>
                      <select 
                        value={exchangeDateReplace} 
                        onChange={e => setExchangeDateReplace(e.target.value)}
                        className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white"
                      >
                        <option value="">Pilih Jadwal Anda</option>
                        {myFutureSchedules.map(s => (
                          <option key={s.id} value={s.id}>
                            {new Date(s.date).toLocaleDateString('id-ID', {weekday:'short', day:'2-digit', month:'short'})} - {s.shiftName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Rekan Pengganti</label>
                      <select 
                        value={exchangeReplacerId} 
                        onChange={e => setExchangeReplacerId(e.target.value)}
                        className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white"
                      >
                        <option value="">Pilih Pegawai Pengganti</option>
                        {allEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>

                    {replacerSchedules.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wider">Jadwal Rekan (Pelunasan)</label>
                        <select 
                          value={exchangeDatePayback} 
                          onChange={e => setExchangeDatePayback(e.target.value)}
                          className="w-full text-sm p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                        >
                          <option value="">Pilih Tanggal Anda Mengganti</option>
                          {replacerSchedules.map(s => (
                            <option key={s.id} value={s.id}>
                              {new Date(s.date).toLocaleDateString('id-ID', {weekday:'short', day:'2-digit', month:'short'})} - {s.shiftName}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-blue-700 mt-2 font-medium">Pilih jadwal dimana rekan Anda masuk, dan Anda akan menggantikannya di hari tersebut.</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Alasan Tukar Jadwal</label>
                      <textarea 
                        value={exchangeReason}
                        onChange={e => setExchangeReason(e.target.value)}
                        placeholder="Berikan alasan yang jelas..."
                        className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white"
                        rows={3}
                      />
                    </div>

                    <button 
                      onClick={handleSubmitExchange}
                      className="w-full bg-[#0C2461] text-white font-bold text-sm py-3.5 rounded-xl uppercase tracking-widest shadow-md hover:bg-blue-900 transition-colors"
                    >
                      Ajukan Tukar Jadwal
                    </button>
                  </div>
                )}

                {exchangeTab === 'incoming' && (
                  <div className="space-y-3">
                    {exchangeList.filter(e => e.replacerId === employee?.id && e.status === 'Pending_Replacer').length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm font-medium">
                        Tidak ada permintaan tukar jadwal
                      </div>
                    ) : exchangeList.filter(e => e.replacerId === employee?.id && e.status === 'Pending_Replacer').map(ex => (
                      <div key={ex.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{ex.requesterName} meminta tukar jadwal</p>
                            <p className="text-[10px] text-slate-500 font-medium">Alasan: {ex.reason || '-'}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl text-xs font-medium space-y-1 text-slate-700">
                          <p><span className="text-slate-400 uppercase tracking-widest text-[9px] block">Anda Menggantikan:</span> {new Date(ex.dateToReplace).toLocaleDateString('id-ID')}</p>
                          <p><span className="text-slate-400 uppercase tracking-widest text-[9px] block">Dilunasi Pada:</span> {new Date(ex.dateToPayback).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateExchangeStatus(ex.id, 'Pending_Danru')} className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">Terima</button>
                          <button onClick={() => handleUpdateExchangeStatus(ex.id, 'Rejected')} className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">Tolak</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {exchangeTab === 'history' && (
                  <div className="space-y-3">
                    {exchangeList.filter(e => e.status !== 'Pending_Replacer' || e.requesterId === employee?.id).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm font-medium">
                        Belum ada riwayat tukar jadwal
                      </div>
                    ) : exchangeList.filter(e => e.status !== 'Pending_Replacer' || e.requesterId === employee?.id).map(ex => (
                      <div key={ex.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2">
                         <div className="flex justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {ex.requesterId === employee?.id ? \`Tukar dgn \${ex.replacerName}\` : \`Permintaan dr \${ex.requesterName}\`}
                            </span>
                            <span className={\`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest \${
                              ex.status === 'Approved' ? 'bg-green-100 text-green-700' :
                              ex.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }\`}>
                              {ex.status.replace('Pending_', 'Menunggu ')}
                            </span>
                         </div>
                         <div className="text-[10px] text-slate-500 font-medium bg-slate-50 p-2 rounded-lg">
                           <p>Digantikan: {new Date(ex.dateToReplace).toLocaleDateString('id-ID')}</p>
                           <p>Pelunasan: {new Date(ex.dateToPayback).toLocaleDateString('id-ID')}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

code = code.replace("{/* === BOTTOM NAVIGATION === */}", modalUI + "\n\n      {/* === BOTTOM NAVIGATION === */}");

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

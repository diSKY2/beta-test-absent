const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const modalCode = `
      {/* ========================================================================= */}
      {/* --- 6. SHIFT EXCHANGE MODAL --- */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showExchangeModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-[#0C2461] flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                  Pengajuan Tukar Jadwal
                </h3>
                <button onClick={() => setShowExchangeModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-0 overflow-y-auto shrink-1 min-h-0 bg-slate-50">
                <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
                  <button
                    onClick={() => setExchangeTab('request')}
                    className={\`flex-1 py-3 text-xs font-bold uppercase tracking-wider \${
                      exchangeTab === 'request'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                        : 'text-slate-500 hover:bg-slate-50'
                    }\`}
                  >
                    Buat Pengajuan
                  </button>
                  <button
                    onClick={() => setExchangeTab('history')}
                    className={\`flex-1 py-3 text-xs font-bold uppercase tracking-wider \${
                      exchangeTab === 'history'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                        : 'text-slate-500 hover:bg-slate-50'
                    }\`}
                  >
                    Riwayat
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {exchangeTab === 'request' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Rekan Pengganti</label>
                        <select
                          value={exchangeReplacerId}
                          onChange={e => setExchangeReplacerId(e.target.value)}
                          className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white p-2.5 border"
                        >
                          <option value="">-- Pilih Rekan --</option>
                          {allEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                          ))}
                        </select>
                      </div>

                      {exchangeReplacerId && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-blue-900 mb-1">Jadwal Anda (yang akan digantikan)</label>
                            <select
                              value={exchangeDateReplace}
                              onChange={e => setExchangeDateReplace(e.target.value)}
                              className="w-full text-sm border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white p-2 border"
                            >
                              <option value="">-- Pilih Jadwal Anda --</option>
                              {myFutureSchedules.map(s => (
                                <option key={s.id} value={s.id}>
                                  {new Date(s.date).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })} - {s.shiftName || 'Shift'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-blue-900 mb-1">Jadwal Pengganti (Anda yang menggantikan)</label>
                            <select
                              value={exchangeDatePayback}
                              onChange={e => setExchangeDatePayback(e.target.value)}
                              className="w-full text-sm border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white p-2 border"
                            >
                              <option value="">-- Pilih Jadwal Rekan --</option>
                              {replacerSchedules.map(s => (
                                <option key={s.id} value={s.id}>
                                  {new Date(s.date).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })} - {s.shiftName || 'Shift'}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Tukar Jadwal</label>
                        <textarea
                          value={exchangeReason}
                          onChange={e => setExchangeReason(e.target.value)}
                          className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white p-3 border"
                          rows={2}
                          placeholder="Contoh: Ada keperluan keluarga mendadak"
                        ></textarea>
                      </div>

                      <button
                        onClick={handleSubmitExchange}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors mt-2"
                      >
                        Kirim Pengajuan Tukar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exchangeList.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">Belum ada riwayat tukar jadwal.</div>
                      ) : (
                        exchangeList.map(item => {
                          const isRequester = item.requesterId === currentEmployee?.id;
                          return (
                            <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    {isRequester ? 'Anda meminta ke' : 'Permintaan dari'}
                                  </span>
                                  <span className="font-semibold text-sm text-slate-800">
                                    {isRequester ? item.replacerName : item.requesterName}
                                  </span>
                                </div>
                                <span className={\`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider \${
                                  item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                  item.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }\`}>
                                  {item.status}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div>
                                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Jadwal Anda</span>
                                  <span>{isRequester ? new Date(item.dateToReplace).toLocaleDateString('id-ID') : new Date(item.dateToPayback).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Jadwal Rekan</span>
                                  <span>{isRequester ? new Date(item.dateToPayback).toLocaleDateString('id-ID') : new Date(item.dateToReplace).toLocaleDateString('id-ID')}</span>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-500 italic border-l-2 border-slate-200 pl-2">
                                "{item.reason}"
                              </div>
                              
                              {/* If I am the replacer and it's pending, I can approve/reject */}
                              {!isRequester && item.status === 'Pending' && (
                                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                                  <button onClick={() => handleUpdateExchangeStatus(item.id, 'Approved')} className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors">Terima</button>
                                  <button onClick={() => handleUpdateExchangeStatus(item.id, 'Rejected')} className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-lg transition-colors">Tolak</button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

code = code.replace("      </div>\n    </div>\n  );\n}", modalCode + "\n      </div>\n    </div>\n  );\n}");

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

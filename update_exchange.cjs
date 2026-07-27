const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// The new tukar_jadwal tab UI to be injected right before </main>
const newTabContent = `
              {activeTab === 'tukar_jadwal' && (
                <div className="flex-1 p-0 overflow-y-auto bg-slate-50 flex flex-col h-full">
                  {/* Header */}
                  <div className="bg-white px-4 py-3 border-b border-slate-200 sticky top-0 z-10">
                    <h3 className="font-black text-[#0C2461] text-lg">Menu Tukar Jadwal</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono mt-0.5">Pengajuan & Persetujuan</p>
                  </div>

                  <div className="flex border-b border-slate-200 bg-white sticky top-[60px] z-10 shadow-sm">
                    <button
                      onClick={() => setExchangeTab('request')}
                      className={\`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors \${
                        exchangeTab === 'request'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                          : 'text-slate-500 hover:bg-slate-50'
                      }\`}
                    >
                      Buat Pengajuan
                    </button>
                    <button
                      onClick={() => setExchangeTab('history')}
                      className={\`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors \${
                        exchangeTab === 'history'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                          : 'text-slate-500 hover:bg-slate-50'
                      }\`}
                    >
                      Riwayat & Approval
                    </button>
                  </div>

                  <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
                    {exchangeTab === 'request' ? (
                      <div className="space-y-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm shadow-indigo-900/5">
                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1.5">Pilih Rekan Pengganti</label>
                          <select
                            value={exchangeReplacerId}
                            onChange={e => setExchangeReplacerId(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-slate-50 p-3 border font-semibold text-slate-800"
                          >
                            <option value="">-- Pilih Rekan --</option>
                            {allEmployees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                            ))}
                          </select>
                        </div>
                        {exchangeReplacerId && (
                          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                            <div>
                              <label className="block text-[11px] font-black text-blue-900 uppercase tracking-wide mb-1.5">Jadwal Anda (yang akan digantikan)</label>
                              <select
                                value={exchangeDateReplace}
                                onChange={e => setExchangeDateReplace(e.target.value)}
                                className="w-full text-sm border-blue-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white p-3 border font-medium text-slate-800 shadow-sm"
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
                              <label className="block text-[11px] font-black text-blue-900 uppercase tracking-wide mb-1.5">Jadwal Pengganti (Anda yang menggantikan)</label>
                              <select
                                value={exchangeDatePayback}
                                onChange={e => setExchangeDatePayback(e.target.value)}
                                className="w-full text-sm border-blue-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white p-3 border font-medium text-slate-800 shadow-sm"
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
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1.5">Alasan Tukar Jadwal</label>
                          <textarea
                            value={exchangeReason}
                            onChange={e => setExchangeReason(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-slate-50 p-3 border font-medium text-slate-800"
                            rows={3}
                            placeholder="Contoh: Ada keperluan keluarga mendadak"
                          ></textarea>
                        </div>
                        <button
                          onClick={handleSubmitExchange}
                          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-95 text-white font-black rounded-2xl shadow-lg shadow-blue-900/20 transition-all mt-4 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Kirim Pengajuan Tukar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {exchangeList.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <RefreshCw className="w-6 h-6 text-slate-300" />
                            </div>
                            <span className="font-bold text-sm block">Belum ada riwayat tukar jadwal.</span>
                            <span className="text-xs text-slate-500">Pengajuan akan muncul di sini.</span>
                          </div>
                        ) : (
                          exchangeList.map(item => {
                            const isRequester = item.requesterId === currentEmployee?.id;
                            const isReplacer = item.replacerId === currentEmployee?.id;
                            const isDanru = currentEmployee?.role && (currentEmployee.role.toLowerCase().includes('ketua') || currentEmployee.role.toLowerCase().includes('leader') || currentEmployee.role.toLowerCase().includes('danru'));
                            
                            return (
                              <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm shadow-indigo-900/5 space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-100 to-transparent rounded-full blur-lg pointer-events-none" />
                                
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">
                                      {isRequester ? 'Anda meminta ke' : isReplacer ? 'Permintaan dari' : 'Permintaan dari anggota'}
                                    </span>
                                    <span className="font-black text-sm text-[#0C2461]">
                                      {isRequester ? item.replacerName : item.requesterName}
                                      {isDanru && !isRequester && !isReplacer && \` -> \${item.replacerName}\`}
                                    </span>
                                  </div>
                                  <span className={\`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border \${
                                    item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    item.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }\`}>
                                    {item.status === 'Pending_Replacer' ? 'Menunggu Rekan' : 
                                     item.status === 'Pending_Danru' ? 'Menunggu Danru' : item.status}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-600 grid grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider mb-0.5 font-mono">
                                      {isRequester ? 'Jadwal Anda' : 'Jadwal Peminta'}
                                    </span>
                                    <span className="text-slate-700">{new Date(item.dateToReplace).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider mb-0.5 font-mono">
                                      {isRequester ? 'Jadwal Rekan' : 'Jadwal Anda'}
                                    </span>
                                    <span className="text-slate-700">{new Date(item.dateToPayback).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })}</span>
                                  </div>
                                </div>
                                <div className="text-[11px] text-slate-600 italic border-l-4 border-slate-200 pl-3 py-1 font-medium bg-slate-50/50 rounded-r-lg">
                                  "{item.reason}"
                                </div>
                                
                                {/* Action Buttons for Approvals */}
                                {item.status === 'Pending_Replacer' && isReplacer && (
                                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                                    <button onClick={() => handleUpdateExchangeStatus(item.id, 'Pending_Danru')} className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-95 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-900/20">Setujui Tukar</button>
                                    <button onClick={() => handleUpdateExchangeStatus(item.id, 'Rejected')} className="flex-1 py-2 bg-white hover:bg-slate-50 text-red-600 border border-red-200 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors">Tolak</button>
                                  </div>
                                )}
                                
                                {item.status === 'Pending_Danru' && isDanru && (
                                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                                    <button onClick={() => handleUpdateExchangeStatus(item.id, 'Approved')} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-95 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-900/20">Danru Approve</button>
                                    <button onClick={() => handleUpdateExchangeStatus(item.id, 'Rejected')} className="flex-1 py-2 bg-white hover:bg-slate-50 text-red-600 border border-red-200 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors">Danru Tolak</button>
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
              )}
`;

// Inject before </main>
code = code.replace("</main>", newTabContent + "\n        </main>");

// Now let's remove the modal.
// We must find the comment `{/* --- 6. SHIFT EXCHANGE MODAL --- */}` and remove everything until `{/* --- 4. SUCCESS / CONFIRMATION MODALS --- */}` or just remove the specific block.
// To be safe, I'll regex it out.
code = code.replace(/\{\/\* --- 6\. SHIFT EXCHANGE MODAL --- \*\/\}[\s\S]*?(?=\{\/\* --- 7\. OR WHATEVER --- \*\/\}|<\/div>\s*\{\/\* ========================================================================= \*\/\}|$)/, "");

// Write it back
fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

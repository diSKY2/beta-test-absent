const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Approvals.tsx', 'utf-8');

const regexLeaveAction = /const handleLeaveAction = async \(id: string, action: 'Approved' \| 'Rejected'\) => \{\n\s*try \{\n\s*await updateDoc\(doc\(db, 'leave_requests', id\), \{ status: action, updatedAt: Date\.now\(\) \}\);\n\s*const req = leaves\.find\(l => l\.id === id\);/;
const replaceLeaveAction = `const handleLeaveAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      await updateDoc(doc(db, 'leave_requests', id), { status: action, updatedAt: Date.now() });
      const req = [...leaves, ...historyLeaves].find(l => l.id === id);
      if (req && action === 'Rejected') {
         let datePart = '';
         if (typeof req.requestDate === 'string') {
           datePart = req.requestDate.split('T')[0];
         } else if (typeof req.requestDate === 'number') {
           datePart = new Date(req.requestDate).toISOString().split('T')[0];
         } else if (req.requestDate && typeof (req.requestDate as any).toDate === 'function') {
           datePart = (req.requestDate as any).toDate().toISOString().split('T')[0];
         } else if (req.requestDate instanceof Date) {
           datePart = req.requestDate.toISOString().split('T')[0];
         } else {
           datePart = new Date().toISOString().split('T')[0];
         }
         const attId = \`\${req.employeeId}_\${datePart}\`;
         // To delete the attendance record that was automatically created
         try {
             await fetch(import.meta.env.VITE_API_BASE_URL + '/api/sql/rpc', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  action: 'deleteDoc',
                  collection: 'attendances',
                  docId: attId
               })
            });
         } catch(e) {}
      }
`;
code = code.replace(regexLeaveAction, replaceLeaveAction);

const regexOvertimeAction = /const handleOvertimeAction = async \(id: string, action: 'Approved' \| 'Rejected'\) => \{\n\s*try \{\n\s*await updateDoc\(doc\(db, 'overtime_requests', id\), \{ status: action, updatedAt: Date\.now\(\) \}\);\n\s*const req = overtimes\.find\(l => l\.id === id\);/;
const replaceOvertimeAction = `const handleOvertimeAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      await updateDoc(doc(db, 'overtime_requests', id), { status: action, updatedAt: Date.now() });
      const req = [...overtimes, ...historyOvertimes].find(l => l.id === id);
`;
code = code.replace(regexOvertimeAction, replaceOvertimeAction);


const historyLeaveRender = /<span className=\{\`text-\[10px\] uppercase tracking-wider px-2 py-1 rounded font-bold \$\{req\.status === 'Approved' \? 'bg-green-500\/10 text-green-700 border border-green-500\/20' : 'bg-red-500\/10 text-red-700 border border-red-500\/20'\}\`\}>\{req\.status\}<\/span>/;
const replaceHistoryLeaveRender = `<div className="flex flex-col items-end gap-2">
                            <span className={\`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold \${req.status === 'Approved' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20'}\`}>{req.status}</span>
                            {req.status === 'Approved' && (
                                <button onClick={() => handleLeaveAction(req.id, 'Rejected')} className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors">Batalkan (Tolak)</button>
                            )}
                         </div>`;
code = code.replace(historyLeaveRender, replaceHistoryLeaveRender);

const historyOvertimeRender = /<span className=\{\`text-\[10px\] uppercase tracking-wider px-2 py-1 rounded font-bold \$\{req\.status === 'Approved' \? 'bg-green-500\/10 text-green-700 border border-green-500\/20' : 'bg-red-500\/10 text-red-700 border border-red-500\/20'\}\`\}>\{req\.status\}<\/span>/;
const replaceHistoryOvertimeRender = `<div className="flex flex-col items-end gap-2">
                            <span className={\`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold \${req.status === 'Approved' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20'}\`}>{req.status}</span>
                            {req.status === 'Approved' && (
                                <button onClick={() => handleOvertimeAction(req.id, 'Rejected')} className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors">Batalkan (Tolak)</button>
                            )}
                         </div>`;
code = code.replace(historyOvertimeRender, replaceHistoryOvertimeRender);

fs.writeFileSync('src/pages/admin/Approvals.tsx', code);
console.log('Done');

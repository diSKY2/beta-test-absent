const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

// Add deleteDoc to imports if not there
if (!code.includes('deleteDoc')) {
  code = code.replace(/import { handleFirestoreError, OperationType } from '\.\.\/\.\.\/lib\/utils';/, "import { handleFirestoreError, OperationType } from '../../lib/utils';\nimport { deleteDoc, doc } from '../../lib/firestoreClient';");
}

// Add handleResetAbsen in Monitoring component
const handleResetCode = `
  const handleResetAbsen = async (attendanceId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan/mereset absensi karyawan ini?")) return;
    try {
      await deleteDoc(doc(db, 'attendances', attendanceId));
      toast.triggerToast('Absensi berhasil direset/dihapus.');
      // Update state directly for quick UI update
      setAttendances(prev => prev.filter(a => a.id !== attendanceId));
    } catch (err: any) {
      toast.triggerToast('Gagal mereset absensi: ' + err.message);
    }
  };
`;

code = code.replace("const [expandedSubDepts, setExpandedSubDepts] = useState<Record<string, boolean>>({});", "const [expandedSubDepts, setExpandedSubDepts] = useState<Record<string, boolean>>({});" + handleResetCode);

// Add Aksi column in header
code = code.replace('<th className="px-4 py-3 font-semibold w-48">Lokasi GPS & Radius</th>', '<th className="px-4 py-3 font-semibold w-48">Lokasi GPS & Radius</th>\n<th className="px-4 py-3 font-semibold w-24">Aksi</th>');

// Add Aksi column in body
code = code.replace('</TR_END_REPLACE>', ''); // dummy

const tdActionCode = `
  <td className="px-4 py-3 text-center">
    {a.id && (
      <button
        onClick={() => handleResetAbsen(a.id)}
        className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded text-[10px] uppercase tracking-wider transition-colors"
      >
        Tolak / Reset
      </button>
    )}
  </td>
`;

code = code.replace('</span>\n                                                     )}\n                                                   </td>\n                                                 </tr>', '</span>\n                                                     )}\n                                                   </td>\n' + tdActionCode + '\n                                                 </tr>');

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

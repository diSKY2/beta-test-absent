const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(/employee\.id/g, 'currentEmployee.id');
code = code.replace(/employee\?/g, 'currentEmployee?');
code = code.replace(/employee\./g, 'currentEmployee.');

const stateHookAnchor = "const [replacerSchedules, setReplacerSchedules] = useState<any[]>([]);";
const newStates = `\n  const [myFutureSchedules, setMyFutureSchedules] = useState<any[]>([]);`;
code = code.replace(stateHookAnchor, stateHookAnchor + newStates);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

let code2 = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');
code2 = code2.replace("import { doc, getDoc } from 'firebase/firestore';", "import { doc, getDoc } from 'firebase/firestore';\n// @ts-ignore");
code2 = code2.replace("const docRef = doc(db,", "// @ts-ignore\n        const docRef = doc(db,");
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code2);

const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const stateHookAnchor = "const [reportPhoto, setReportPhoto] = useState<string | null>(null);";
const newStates = `
  const [exchangeList, setExchangeList] = useState<any[]>([]);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeReplacerId, setExchangeReplacerId] = useState('');
  const [exchangeDateReplace, setExchangeDateReplace] = useState('');
  const [exchangeDatePayback, setExchangeDatePayback] = useState('');
  const [exchangeReason, setExchangeReason] = useState('');
  const [exchangeTab, setExchangeTab] = useState<'request' | 'history'>('request');
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [replacerSchedules, setReplacerSchedules] = useState<any[]>([]);
`;

code = code.replace(stateHookAnchor, stateHookAnchor + newStates);

code = code.replace(/employee\.id/g, "currentEmployee.id");
code = code.replace(/if \(\!employee\)/g, "if (!currentEmployee)");
code = code.replace(/employee\.subDepartmentId/g, "currentEmployee.subDepartmentId");

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

const fs = require('fs');

let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// I will insert states for shift exchange
const exchangeStates = `
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeTab, setExchangeTab] = useState<'request' | 'incoming' | 'history'>('request');
  const [exchangeReplacerId, setExchangeReplacerId] = useState('');
  const [exchangeDateReplace, setExchangeDateReplace] = useState(''); // employee's schedule ID to replace
  const [exchangeDatePayback, setExchangeDatePayback] = useState(''); // replacer's schedule ID for payback
  const [exchangeReason, setExchangeReason] = useState('');
  
  const [exchangeList, setExchangeList] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [replacerSchedules, setReplacerSchedules] = useState<any[]>([]);
  const [myFutureSchedules, setMyFutureSchedules] = useState<any[]>([]);
`;

code = code.replace(/const \[schedulesList, setSchedulesList\] = useState<any\[\]>\(\[\]\);/, "const [schedulesList, setSchedulesList] = useState<any[]>([]);\n" + exchangeStates);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

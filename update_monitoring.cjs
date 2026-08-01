const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

code = code.replace(
  `  const [attendances, setAttendances] = useState<any[]>([]);`,
  `  const [attendances, setAttendances] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);`
);

code = code.replace(
  `          setAttendances(attList);
        }`,
  `          setAttendances(attList);
          
          const schedList = (data.schedules || []).map((s: any) => {
            let formattedDate = s.date;
            if (!formattedDate && s.date) {
              formattedDate = format(new Date(s.date), 'yyyy-MM-dd');
            }
            return { ...s, dateFormatted: formattedDate };
          });
          setSchedules(schedList);
        }`
);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

code = code.replace(
  `          const schedList = (data.schedules || []).map((s: any) => {
            let formattedDate = s.date;
            if (!formattedDate && s.date) {
              formattedDate = format(new Date(s.date), 'yyyy-MM-dd');
            }
            return { ...s, dateFormatted: formattedDate };
          });`,
  `          const schedList = (data.schedules || []).map((s: any) => {
            return { ...s, dateFormatted: s.date ? format(new Date(s.date), 'yyyy-MM-dd') : null };
          });`
);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);

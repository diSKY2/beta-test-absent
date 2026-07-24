const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

code = code.replace(
  "import { doc, getDoc } from 'firebase/firestore';",
  "import { doc, getDoc } from 'firebase/firestore';\n// @ts-ignore"
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);

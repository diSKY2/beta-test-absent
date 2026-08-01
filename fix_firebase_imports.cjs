const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf-8');

code = code.replace(/import \{ doc, getDoc \} from 'firebase\/firestore';/, "import { doc, getDoc } from '../../lib/firestoreClient';");
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);

code = fs.readFileSync('package.json', 'utf-8');
code = code.replace(/"firebase": ".*",/, "");
fs.writeFileSync('package.json', code);
console.log('Done');

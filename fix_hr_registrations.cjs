const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/HRRegistrations.tsx', 'utf8');

code = code.replace("const { auth } = useAuth();", "const { user } = useAuth();");
code = code.replace("headers: { 'Authorization': `Bearer ${auth.token}` }", "headers: {}");
code = code.replace("'Authorization': `Bearer ${auth.token}`", "");

fs.writeFileSync('src/pages/admin/HRRegistrations.tsx', code);

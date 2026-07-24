const fs = require('fs');

const fixFile = (path) => {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/import \{ API_BASE_URL \} from '\.\.\/App';\n/g, '');
  code = code.replace(/import \{ API_BASE_URL \} from '\.\.\/\.\.\/App';\n/g, '');
  
  if (!code.includes('const API_BASE_URL')) {
    const importMatch = code.match(/import.*\n\n/);
    if (importMatch) {
       code = code.replace(importMatch[0], importMatch[0] + 'const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://garudatrisulaperkasa.web.id";\n\n');
    } else {
       const lastImport = Array.from(code.matchAll(/import.*\n/g)).pop();
       if (lastImport) {
          code = code.replace(lastImport[0], lastImport[0] + '\nconst API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://garudatrisulaperkasa.web.id";\n\n');
       }
    }
  }
  fs.writeFileSync(path, code);
};

fixFile('src/pages/RegisterPage.tsx');
fixFile('src/pages/admin/HRRegistrations.tsx');

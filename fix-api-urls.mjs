import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/lib/firestoreClient.ts',
  'src/pages/EmployeePortal.tsx',
  'src/pages/admin/HRAdminManager.tsx',
  'src/pages/LoginPage.tsx'
];

// The user should set this to their Cloudflare domain (or IP)
// For now, let's inject a global window.API_BASE_URL or use an environment variable.
// Using import.meta.env.VITE_API_BASE_URL is the standard Vite way.

for (const file of filesToUpdate) {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if we already injected
    if (!content.includes('const API_BASE_URL')) {
        // Add API_BASE_URL at the top after imports
        const lines = content.split('\n');
        let importEndIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                importEndIndex = i;
            }
        }
        
        lines.splice(importEndIndex + 1, 0, `\nconst API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";\n`);
        content = lines.join('\n');
    }
    
    // Replace fetch('/api/ with fetch(API_BASE_URL + '/api/
    // But be careful not to replace it if it's already replaced
    content = content.replace(/fetch\(\s*['"]\/api\//g, "fetch(API_BASE_URL + '/api/");
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}

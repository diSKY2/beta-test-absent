const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/CMS.tsx', 'utf8');
const updateBlock = fs.readFileSync('update_tab.tsx', 'utf8');

// Replace the injected blocks with </AnimatePresence>
content = content.split(updateBlock).join('</AnimatePresence>\n');
fs.writeFileSync('src/pages/admin/CMS.tsx', content);

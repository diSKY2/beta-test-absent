const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// Find the last AnimatePresence
const lastIndex = code.lastIndexOf('</AnimatePresence>');
if (lastIndex !== -1) {
  code = code.substring(0, lastIndex + '</AnimatePresence>'.length);
  code += `\n      {/* ========================================================================= */}\n    </div>\n    </div>\n  );\n};\n\nexport default EmployeePortal;\n`;
  fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
}

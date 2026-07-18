const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// Replace everything after </AnimatePresence>
const idx = code.lastIndexOf('</AnimatePresence>');
if (idx !== -1) {
  code = code.substring(0, idx + '</AnimatePresence>'.length) + `
        </div>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
  console.log('Fixed end of file');
} else {
  console.log('Could not find </AnimatePresence>');
}

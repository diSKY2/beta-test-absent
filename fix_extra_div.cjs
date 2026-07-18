const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// The end of the file currently is:
//       </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }
// We want to remove the last </div>.
code = code.replace(/      <\/AnimatePresence>\n        <\/div>\n      <\/div>\n    <\/div>\n  \);\n}/g, `      </AnimatePresence>\n      </div>\n    </div>\n  );\n}`);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log('Fixed extra div');

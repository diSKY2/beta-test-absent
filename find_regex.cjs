const fs = require('fs');
const ts = require('typescript');

const code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');
const sf = ts.createSourceFile('EmployeePortal.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

let lastValid = null;
function visit(node) {
  ts.forEachChild(node, visit);
}
try {
  visit(sf);
  console.log("No throw from TS compiler");
} catch(e) {
  console.log("Error:", e);
}

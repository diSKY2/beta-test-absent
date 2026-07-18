const fs = require('fs');
const acorn = require('acorn');
const acornJsx = require('acorn-jsx');

const code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const parser = acorn.Parser.extend(acornJsx());
try {
  parser.parse(code, { sourceType: 'module', ecmaVersion: 2020 });
  console.log("Parsed OK!");
} catch (e) {
  console.error("Acorn Error:", e.message, "at line", e.loc.line, "col", e.loc.column);
}

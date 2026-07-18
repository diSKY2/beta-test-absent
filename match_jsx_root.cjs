const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');
const sf = ts.createSourceFile('EmployeePortal.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

let found = false;
function visit(node) {
  if (node.kind === ts.SyntaxKind.ReturnStatement && node.expression && node.expression.kind === ts.SyntaxKind.ParenthesizedExpression) {
    const expr = node.expression.expression;
    if (expr.kind === ts.SyntaxKind.JsxElement) {
       const start = sf.getLineAndCharacterOfPosition(expr.getStart());
       const end = sf.getLineAndCharacterOfPosition(expr.getEnd());
       console.log(`Root JSX Element starts at line ${start.line + 1} and ends at line ${end.line + 1}`);
       found = true;
    }
  }
  ts.forEachChild(node, visit);
}
visit(sf);
if (!found) console.log("Root JSX not found");

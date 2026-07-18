const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');
const sf = ts.createSourceFile('EmployeePortal.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function visit(node) {
  if (node.kind === ts.SyntaxKind.JsxExpression && node.expression && node.expression.kind === ts.SyntaxKind.BinaryExpression) {
    // console.log(node.getText());
  }
  ts.forEachChild(node, visit);
}

const diagnostics = sf.parseDiagnostics;
if (diagnostics && diagnostics.length > 0) {
  diagnostics.forEach(d => {
    const pos = sf.getLineAndCharacterOfPosition(d.start);
    console.log(`Error at line ${pos.line + 1}: ${d.messageText}`);
  });
} else {
  console.log("No syntax errors found by parser?!");
}

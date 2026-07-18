const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');
const sourceFile = ts.createSourceFile('EmployeePortal.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

let foundError = false;
function visit(node) {
  if (node.kind === ts.SyntaxKind.JsxElement) {
    const opening = node.openingElement.tagName.getText();
    const closing = node.closingElement.tagName.getText();
    if (opening !== closing) {
      console.log('Mismatch:', opening, closing, 'at line', sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    }
  }
  ts.forEachChild(node, visit);
}
visit(sourceFile);

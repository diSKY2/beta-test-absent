const fs = require('fs');
const code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const divOpen = (code.match(/<div(\s|>)/g) || []).length;
const divClose = (code.match(/<\/div>/g) || []).length;

const spanOpen = (code.match(/<span(\s|>)/g) || []).length;
const spanClose = (code.match(/<\/span>/g) || []).length;

const btnOpen = (code.match(/<button(\s|>)/g) || []).length;
const btnClose = (code.match(/<\/button>/g) || []).length;

const formOpen = (code.match(/<form(\s|>)/g) || []).length;
const formClose = (code.match(/<\/form>/g) || []).length;

console.log('div', divOpen, divClose);
console.log('span', spanOpen, spanClose);
console.log('button', btnOpen, btnClose);
console.log('form', formOpen, formClose);

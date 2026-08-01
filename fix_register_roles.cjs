const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf-8');

const roleRegex = /<option value="Danru">Danru \(Ketua Regu\)<\/option>/;
const roleReplacement = `<option value="Chief">Chief</option>
                  <option value="Wakachief">Wakachief</option>
                  <option value="Danru">Danru (Ketua Regu)</option>`;
code = code.replace(roleRegex, roleReplacement);

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
console.log('Done');

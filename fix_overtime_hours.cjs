const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf-8');

const regexOptions = /<option value="5">5 Jam<\/option>/;
const replacementOptions = `<option value="5">5 Jam</option>
                        <option value="6">6 Jam</option>
                        <option value="7">7 Jam</option>
                        <option value="8">8 Jam</option>
                        <option value="9">9 Jam</option>
                        <option value="10">10 Jam</option>
                        <option value="11">11 Jam</option>
                        <option value="12">12 Jam</option>`;

code = code.replace(regexOptions, replacementOptions);
fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log('Done');

const fs = require('fs');
let code = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');
code = code.replace(/<\/button>\s*<\/form>\s*<\/div>/, `</button>\n          <div className="mt-6 text-center">\n            <a href="/register" className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline">\n              Pegawai Baru? Daftar di sini\n            </a>\n          </div>\n        </form>\n      </div>`);
fs.writeFileSync('src/pages/LoginPage.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');
code = code.replace(/Masuk Aplikasi\s*<\/>\s*\)\}\s*<\/button>\s*<\/form>\s*<\/div>\s*\)\s*:\s*currentEmployee && currentEmployee.status && currentEmployee.status !== 'Aktif' \? \(/g, `Masuk Aplikasi
                    </>
                  )}
                </button>
                <div className="mt-5 text-center">
                  <a href="/register" className="text-xs font-semibold text-[#0C2461] hover:text-blue-800 underline decoration-[#0C2461]/30 underline-offset-4">
                    Belum punya akun? Daftar Pegawai Baru
                  </a>
                </div>
              </form>
            </div>
          ) : currentEmployee && currentEmployee.status && currentEmployee.status !== 'Aktif' ? (`);
fs.writeFileSync('src/pages/EmployeePortal.tsx', code);

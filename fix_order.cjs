const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const replacement = `{
      group: 'Operasional',
      icon: Briefcase,
      items: [
        { name: 'Rostering Bulanan', href: '/admin/rostering', desc: 'Atur shift jadwal kerja' },
        { name: 'Sistem Approval', href: '/admin/approvals', desc: 'Validasi dokumen pengajuan' },
        { name: 'Laporan Kerja', href: '/admin/reports', desc: 'Arsip log harian & dinas' },
      ]
    },
    {
      group: 'Pegawai',
      icon: Users,
      items: [
        { name: 'Struktur & Data Pegawai', href: '/admin/organization', desc: 'Kelola divisi, jabatan & NIK' },
        { name: 'Payroll Manager (Gaji)', href: '/admin/payroll', desc: 'Rekap slip gaji otomatis' },
        { name: 'Pendaftaran Pegawai', href: '/admin/registrations', desc: 'Tinjau registrasi akun baru' },
      ]
    },`;

const target = `{
      group: 'Pegawai',
      icon: Users,
      items: [
        { name: 'Struktur & Data Pegawai', href: '/admin/organization', desc: 'Kelola divisi, jabatan & NIK' },
        { name: 'Payroll Manager (Gaji)', href: '/admin/payroll', desc: 'Rekap slip gaji otomatis' },
        { name: 'Pendaftaran Pegawai', href: '/admin/registrations', desc: 'Tinjau registrasi akun baru' },
      ]
    },
    {
      group: 'Operasional',
      icon: Briefcase,
      items: [
        { name: 'Rostering Bulanan', href: '/admin/rostering', desc: 'Atur shift jadwal kerja' },
        { name: 'Sistem Approval', href: '/admin/approvals', desc: 'Validasi dokumen pengajuan' },
        { name: 'Laporan Kerja', href: '/admin/reports', desc: 'Arsip log harian & dinas' },
      ]
    },`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);

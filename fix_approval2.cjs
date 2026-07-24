const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');

const target = `apiRouter.put('/admin/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.update(employeeRegistrations).set({ status }).where(eq(employeeRegistrations.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

const replacement = `apiRouter.put('/admin/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // update status
    await db.update(employeeRegistrations).set({ status }).where(eq(employeeRegistrations.id, id));
    
    if (status === 'Approved') {
      const regRecord = await db.select().from(employeeRegistrations).where(eq(employeeRegistrations.id, id));
      if (regRecord.length > 0) {
        const reg = regRecord[0];
        
        // Cek jika NIK sudah ada untuk mencegah duplikasi
        const existingEmp = await db.select().from(employees).where(eq(employees.nik, reg.nik));
        if (existingEmp.length === 0) {
          const newEmp = {
            id: uuidv4(),
            nik: reg.nik,
            name: reg.name,
            password: reg.password,
            locationId: reg.locationId,
            departmentId: reg.departmentId,
            subDepartmentId: reg.subDepartmentId,
            role: reg.role,
            profilePicUrl: reg.profilePicUrl,
            status: 'Aktif',
            baseSalary: "0"
          };
          await db.insert(employees).values(newEmp);
        }
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

code = code.replace(target, replacement);
fs.writeFileSync('server/api.ts', code);

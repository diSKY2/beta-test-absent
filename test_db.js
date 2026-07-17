import { db } from './src/db/index.js';
import { employees } from './src/db/schema.js';

async function run() {
  try {
    await db.insert(employees).values({
      id: "test1",
      nik: "GT123",
      name: "ALDI GANS",
      password: "AAA",
      locationId: "17ee736e-171e-45b9-a05f-937436a38917",
      departmentId: "70d33e72-4f94-4761-bda6-8f3d0872fcfa",
      subDepartmentId: "2b118268-66ec-44b5-8900-5b15a6239e8d",
      baseSalary: 1760000,
      role: "Ketua",
      profilePicUrl: "data:image/jpeg;base64,123",
      status: "Aktif",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("Success");
  } catch (e) {
    console.log("Error:", e);
  }
  process.exit(0);
}
run();

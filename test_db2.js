import { db } from './src/db/index.js';
import { locations, departments, subDepartments } from './src/db/schema.js';

async function run() {
  const locs = await db.select().from(locations);
  const deps = await db.select().from(departments);
  const subs = await db.select().from(subDepartments);
  console.log("Locations:", locs);
  console.log("Departments:", deps);
  console.log("SubDepartments:", subs);
  process.exit(0);
}
run();

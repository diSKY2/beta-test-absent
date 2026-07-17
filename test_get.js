import { db } from './src/db/index.js';
import { employees } from './src/db/schema.js';

async function run() {
  try {
    const res = await db.select().from(employees);
    console.log("Success:", res.length);
  } catch (e) {
    console.log("Error:", e);
  }
  process.exit(0);
}
run();

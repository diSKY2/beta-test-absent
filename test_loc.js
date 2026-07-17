import { db } from './src/db/index.js';
import { locations } from './src/db/schema.js';

async function run() {
  try {
    const res = await db.select().from(locations);
    console.log("Locations:", res.length, res);
  } catch (e) {
    console.log("Error:", e);
  }
  process.exit(0);
}
run();

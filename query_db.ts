import { db } from './src/db/index';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees'`);
  console.log(res);
  process.exit(0);
}
run();

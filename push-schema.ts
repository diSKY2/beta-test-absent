import { config } from 'dotenv';
import { execSync } from 'child_process';

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_QmFNyc6B9MkD@ep-bitter-dust-ao9txd8z.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

try {
  console.log("Pushing schema...");
  execSync("npx drizzle-kit push --config=src/db/drizzle.config.ts", { 
    env: process.env, 
    stdio: 'inherit' 
  });
  console.log("Schema pushed successfully!");
} catch (e) {
  console.error("Failed to push schema:", e);
}

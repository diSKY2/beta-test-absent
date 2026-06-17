import { defineConfig } from 'drizzle-kit';
import * as dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

export default defineConfig({
  out: './src/db/drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: dbUrl ? {
    url: dbUrl
  } : {
    host: sqlHost || '',
    user: user || '',
    password: password || '',
    database: sqlDbName || '',
    ssl: false,
  },
});

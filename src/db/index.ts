import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const createPool = () => {
  const envVars = process.env;
  
  // Memeriksa berbagai format env var yang mungkin diberikan Vercel
  const dbUrl = 
    envVars.DATABASE_URL_POSTGRES_URL_NON_POOLING || 
    envVars.DATABASE_URL_POSTGRES_PRISMA_URL ||
    envVars.DATABASE_URL_UNPOOLED ||
    envVars.POSTGRES_URL_NON_POOLING ||
    envVars.POSTGRES_URL ||
    envVars.DATABASE_URL;
  
  console.log("DB URL Found:", !!dbUrl);

  if (dbUrl) {
    // Digunakan saat deploy ke Vercel jika menggunakan database gratis seperti Neon.tech atau Supabase 
    const useSsl = dbUrl.includes('neon.tech') || dbUrl.includes('supabase.co') || dbUrl.includes('vercel') || dbUrl.includes('koyeb') || dbUrl.includes('sslmode=require');
    
    return new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 15000,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });
  }

  // Fallback ke sistem database lokal dari AI Studio
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });

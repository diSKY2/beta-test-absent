require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT count(*) FROM employees', (err, res) => {
  if (err) console.error(err);
  else console.log("Employee count:", res.rows[0].count);
  pool.end();
});

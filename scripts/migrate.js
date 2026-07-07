require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL. Definila en .env.local o como variable de entorno.');
    process.exit(1);
  }
  const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: esLocal ? false : { rejectUnauthorized: false },
  });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Aplicando esquema...');
  await pool.query(sql);
  console.log('Listo. Tablas creadas/actualizadas.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

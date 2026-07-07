const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'Falta la variable de entorno DATABASE_URL. Configurala con la cadena de conexión de tu base de datos Postgres (Neon).'
      );
    }
    const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: esLocal ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function query(text, params) {
  const client = getPool();
  return client.query(text, params);
}

module.exports = { query, getPool };

require('dotenv').config({ path: '.env.local' });
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

function ask(rl, question, opts = {}) {
  return new Promise((resolve) => {
    if (opts.hidden) {
      // Ocultar la contraseña mientras se escribe
      const stdin = process.stdin;
      process.stdout.write(question);
      let input = '';
      const onData = (char) => {
        char = char.toString('utf8');
        if (char === '\n' || char === '\r' || char === '\u0004') {
          stdin.removeListener('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          resolve(input);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007f') {
          input = input.slice(0, -1);
        } else {
          input += char;
        }
      };
      stdin.setRawMode(true);
      stdin.resume();
      stdin.on('data', onData);
    } else {
      rl.question(question, resolve);
    }
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL. Definila en .env.local o como variable de entorno.');
    process.exit(1);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const username = (await ask(rl, 'Usuario (para iniciar sesión): ')).trim();
  const nombre = (await ask(rl, 'Nombre completo (opcional): ')).trim();
  const password = await ask(rl, 'Contraseña: ', { hidden: true });
  rl.close();

  if (!username || !password) {
    console.error('Usuario y contraseña son obligatorios.');
    process.exit(1);
  }

  const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: esLocal ? false : { rejectUnauthorized: false },
  });

  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      `INSERT INTO usuarios (username, password_hash, nombre) VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, nombre = EXCLUDED.nombre`,
      [username, hash, nombre || null]
    );
    console.log(`Editor "${username}" creado/actualizado correctamente.`);
  } catch (err) {
    console.error('Error creando el usuario:', err.message);
  } finally {
    await pool.end();
  }
}

main();

const { query } = require('../../../lib/db');
const { verifyPassword, createSessionCookie } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
  }

  try {
    const result = await query('SELECT * FROM usuarios WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    res.setHeader('Set-Cookie', createSessionCookie(user));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor al iniciar sesión.' });
  }
}

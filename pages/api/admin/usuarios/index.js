const { query } = require('../../../../lib/db');
const { requireAdmin, hashPassword } = require('../../../../lib/auth');

export default async function handler(req, res) {
  const admin = requireAdmin(req);
  if (!admin) return res.status(403).json({ error: 'Solo un administrador puede hacer esto.' });

  if (req.method === 'GET') {
    const result = await query(
      'SELECT id, username, nombre, rol, creado_en FROM usuarios ORDER BY creado_en'
    );
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    const { username, nombre, password, rol } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
    }
    const rolFinal = rol === 'admin' ? 'admin' : 'editor';
    try {
      const hash = await hashPassword(password);
      const result = await query(
        `INSERT INTO usuarios (username, nombre, password_hash, rol) VALUES ($1,$2,$3,$4)
         RETURNING id, username, nombre, rol, creado_en`,
        [username, nombre || null, hash, rolFinal]
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario.' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Error al crear el editor.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido.' });
}

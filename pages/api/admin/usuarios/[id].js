const { query } = require('../../../../lib/db');
const { requireAdmin, hashPassword } = require('../../../../lib/auth');

export default async function handler(req, res) {
  const admin = requireAdmin(req);
  if (!admin) return res.status(403).json({ error: 'Solo un administrador puede hacer esto.' });
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { nombre, rol, password } = req.body || {};

    if (Number(id) === admin.sub && rol && rol !== 'admin') {
      return res.status(400).json({ error: 'No podés quitarte tu propio rol de administrador.' });
    }

    try {
      if (password) {
        const hash = await hashPassword(password);
        await query('UPDATE usuarios SET nombre=$1, rol=$2, password_hash=$3 WHERE id=$4', [
          nombre || null,
          rol === 'admin' ? 'admin' : 'editor',
          hash,
          id,
        ]);
      } else {
        await query('UPDATE usuarios SET nombre=$1, rol=$2 WHERE id=$3', [
          nombre || null,
          rol === 'admin' ? 'admin' : 'editor',
          id,
        ]);
      }
      const result = await query(
        'SELECT id, username, nombre, rol, creado_en FROM usuarios WHERE id=$1',
        [id]
      );
      return res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al actualizar el editor.' });
    }
  }

  if (req.method === 'DELETE') {
    if (Number(id) === admin.sub) {
      return res.status(400).json({ error: 'No podés eliminar tu propia cuenta.' });
    }
    const adminsResult = await query("SELECT count(*) FROM usuarios WHERE rol = 'admin'");
    const usuarioResult = await query('SELECT rol FROM usuarios WHERE id=$1', [id]);
    if (
      usuarioResult.rows[0]?.rol === 'admin' &&
      Number(adminsResult.rows[0].count) <= 1
    ) {
      return res.status(400).json({ error: 'No se puede eliminar al único administrador.' });
    }
    await query('DELETE FROM usuarios WHERE id=$1', [id]);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Método no permitido.' });
}

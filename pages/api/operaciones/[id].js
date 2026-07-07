const { query } = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });
  const { id } = req.query;

  if (req.method === 'DELETE') {
    await query('DELETE FROM operaciones_cognitivas WHERE id = $1', [id]);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'DELETE');
  return res.status(405).json({ error: 'Método no permitido.' });
}

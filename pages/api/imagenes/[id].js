const { query } = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });
  const { id } = req.query;

  if (req.method === 'GET') {
    const result = await query(
      'SELECT tipo_mime, datos FROM motivo_imagenes WHERE id = $1',
      [id]
    );
    const imagen = result.rows[0];
    if (!imagen) return res.status(404).end();
    res.setHeader('Content-Type', imagen.tipo_mime);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).send(imagen.datos);
  }

  if (req.method === 'DELETE') {
    await query('DELETE FROM motivo_imagenes WHERE id = $1', [id]);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, DELETE');
  return res.status(405).json({ error: 'Método no permitido.' });
}

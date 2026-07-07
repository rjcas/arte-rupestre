const { query } = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });

  if (req.method === 'GET') {
    const { lugar_id } = req.query;
    if (!lugar_id) return res.status(400).json({ error: 'Falta lugar_id.' });
    const result = await query(
      `SELECT cm.*, m.numero_motivo, m.clase, m.grupo, m.tipo
       FROM conjunto_motivos cm
       JOIN motivos m ON m.id = cm.motivo_id
       WHERE cm.lugar_id = $1
       ORDER BY m.numero_motivo`,
      [lugar_id]
    );
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    const { lugar_id, motivo_id } = req.body || {};
    if (!lugar_id || !motivo_id) {
      return res.status(400).json({ error: 'Faltan lugar_id o motivo_id.' });
    }
    try {
      const result = await query(
        `INSERT INTO conjunto_motivos (lugar_id, motivo_id) VALUES ($1, $2)
         ON CONFLICT (lugar_id, motivo_id) DO NOTHING RETURNING *`,
        [lugar_id, motivo_id]
      );
      return res.status(201).json(result.rows[0] || { ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al vincular el motivo al conjunto.' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    await query('DELETE FROM conjunto_motivos WHERE id = $1', [id]);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Método no permitido.' });
}

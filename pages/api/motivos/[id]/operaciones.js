const { query } = require('../../../../lib/db');
const { requireUser } = require('../../../../lib/auth');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });
  const { id } = req.query; // motivo_id

  if (req.method === 'GET') {
    const result = await query(
      'SELECT * FROM operaciones_cognitivas WHERE motivo_id = $1 ORDER BY id',
      [id]
    );
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    const { clase_operacion, posicion, direccion, apendices, angularidad, motivo_vinculado_id } =
      req.body || {};
    try {
      const result = await query(
        `INSERT INTO operaciones_cognitivas
          (motivo_id, clase_operacion, posicion, direccion, apendices, angularidad, motivo_vinculado_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          id,
          clase_operacion || null,
          posicion || null,
          direccion || null,
          apendices || null,
          angularidad || null,
          motivo_vinculado_id || null,
        ]
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear la operación cognitiva.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido.' });
}

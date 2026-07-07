const { query } = require('../../../../lib/db');
const { requireUser } = require('../../../../lib/auth');
const { calcularCromatismo } = require('../../../../lib/calculos');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });
  const { id } = req.query; // motivo_id

  if (req.method === 'GET') {
    const result = await query('SELECT * FROM tecnicas WHERE motivo_id = $1', [id]);
    return res.status(200).json(result.rows[0] || null);
  }

  if (req.method === 'PUT') {
    const {
      tipo_tecnica,
      grabado_caracteristica,
      grabado_tipo,
      grabado_topografia,
      grabado_ancho_trazo,
      grabado_espesor,
      grabado_forma_surco,
      pintura_caracteristica,
      pintura_combinacion,
      pintura_colores,
      mixta_orden,
    } = req.body || {};

    const pintura_cromatismo = calcularCromatismo(pintura_colores);

    try {
      const existing = await query('SELECT id FROM tecnicas WHERE motivo_id = $1', [id]);
      let result;
      if (existing.rows[0]) {
        result = await query(
          `UPDATE tecnicas SET
            tipo_tecnica=$1, grabado_caracteristica=$2, grabado_tipo=$3, grabado_topografia=$4,
            grabado_ancho_trazo=$5, grabado_espesor=$6, grabado_forma_surco=$7,
            pintura_caracteristica=$8, pintura_combinacion=$9, pintura_colores=$10, pintura_cromatismo=$11,
            mixta_orden=$12
           WHERE motivo_id=$13 RETURNING *`,
          [
            tipo_tecnica || null,
            grabado_caracteristica || null,
            grabado_tipo || null,
            grabado_topografia || null,
            grabado_ancho_trazo || null,
            grabado_espesor || null,
            grabado_forma_surco || null,
            pintura_caracteristica || null,
            pintura_combinacion || null,
            pintura_colores || null,
            pintura_cromatismo,
            mixta_orden || null,
            id,
          ]
        );
      } else {
        result = await query(
          `INSERT INTO tecnicas
            (motivo_id, tipo_tecnica, grabado_caracteristica, grabado_tipo, grabado_topografia,
             grabado_ancho_trazo, grabado_espesor, grabado_forma_surco,
             pintura_caracteristica, pintura_combinacion, pintura_colores, pintura_cromatismo, mixta_orden)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
          [
            id,
            tipo_tecnica || null,
            grabado_caracteristica || null,
            grabado_tipo || null,
            grabado_topografia || null,
            grabado_ancho_trazo || null,
            grabado_espesor || null,
            grabado_forma_surco || null,
            pintura_caracteristica || null,
            pintura_combinacion || null,
            pintura_colores || null,
            pintura_cromatismo,
            mixta_orden || null,
          ]
        );
      }
      return res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al guardar la técnica.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Método no permitido.' });
}

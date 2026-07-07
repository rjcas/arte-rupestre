const { query } = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');
const { calcularTamanio } = require('../../../lib/calculos');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });
  const { id } = req.query;

  if (req.method === 'GET') {
    const result = await query('SELECT * FROM motivos WHERE id = $1', [id]);
    const motivo = result.rows[0];
    if (!motivo) return res.status(404).json({ error: 'No encontrado.' });
    motivo.tamanio = calcularTamanio(motivo.medida_ancho, motivo.medida_alto);
    return res.status(200).json(motivo);
  }

  if (req.method === 'PUT') {
    const {
      numero_motivo,
      fuente,
      clase,
      grupo,
      subgrupo,
      tipo,
      medida_ancho,
      medida_alto,
      ubicacion,
      tema,
      mantenimiento,
      reciclaje,
    } = req.body || {};
    try {
      const result = await query(
        `UPDATE motivos SET numero_motivo=$1, fuente=$2, clase=$3, grupo=$4, subgrupo=$5, tipo=$6,
          medida_ancho=$7, medida_alto=$8, ubicacion=$9, tema=$10, mantenimiento=$11, reciclaje=$12
         WHERE id=$13 RETURNING *`,
        [
          numero_motivo || null,
          fuente || null,
          clase || null,
          grupo || null,
          subgrupo || null,
          tipo || null,
          medida_ancho || null,
          medida_alto || null,
          ubicacion || null,
          tema || null,
          mantenimiento || null,
          reciclaje || null,
          id,
        ]
      );
      const motivo = result.rows[0];
      motivo.tamanio = calcularTamanio(motivo.medida_ancho, motivo.medida_alto);
      return res.status(200).json(motivo);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al actualizar el motivo.' });
    }
  }

  if (req.method === 'DELETE') {
    await query('DELETE FROM motivos WHERE id = $1', [id]);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Método no permitido.' });
}

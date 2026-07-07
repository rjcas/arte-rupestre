const { query } = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });
  const { id } = req.query;

  if (req.method === 'GET') {
    const result = await query('SELECT * FROM lugares WHERE id = $1', [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
    return res.status(200).json(result.rows[0]);
  }

  if (req.method === 'PUT') {
    const {
      fecha,
      pais,
      provincia,
      paraje,
      sitio,
      sector,
      conjunto_num,
      sigla_sitio,
      anios_campania,
      operadores,
      laboratorio,
    } = req.body || {};
    try {
      const result = await query(
        `UPDATE lugares SET fecha=$1, pais=$2, provincia=$3, paraje=$4, sitio=$5, sector=$6,
          conjunto_num=$7, sigla_sitio=$8, anios_campania=$9, operadores=$10, laboratorio=$11
         WHERE id=$12 RETURNING *`,
        [
          fecha || null,
          pais || null,
          provincia || null,
          paraje || null,
          sitio,
          sector || null,
          conjunto_num || null,
          sigla_sitio || null,
          anios_campania || null,
          operadores || null,
          laboratorio || null,
          id,
        ]
      );
      return res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al actualizar el lugar.' });
    }
  }

  if (req.method === 'DELETE') {
    await query('DELETE FROM lugares WHERE id = $1', [id]);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Método no permitido.' });
}

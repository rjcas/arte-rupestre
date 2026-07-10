const { query } = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });

  if (req.method === 'POST') {
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
      latitud,
      longitud,
    } = req.body || {};

    if (!sitio) {
      return res.status(400).json({ error: 'El campo "Sitio" es obligatorio.' });
    }

    try {
      const result = await query(
        `INSERT INTO lugares
          (fecha, pais, provincia, paraje, sitio, sector, conjunto_num, sigla_sitio, anios_campania, operadores, laboratorio, latitud, longitud, creado_por)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
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
          latitud || null,
          longitud || null,
          user.sub,
        ]
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear el lugar.' });
    }
  }

  if (req.method === 'GET') {
    const result = await query('SELECT * FROM lugares ORDER BY creado_en DESC');
    return res.status(200).json(result.rows);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido.' });
}

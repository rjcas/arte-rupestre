const { query } = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');
const { calcularTamanio } = require('../../../lib/calculos');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });

  if (req.method === 'POST') {
    const {
      lugar_id,
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

    if (!lugar_id) {
      return res.status(400).json({ error: 'Falta el lugar al que pertenece el motivo.' });
    }

    try {
      const result = await query(
        `INSERT INTO motivos
          (lugar_id, numero_motivo, fuente, clase, grupo, subgrupo, tipo, medida_ancho, medida_alto, ubicacion, tema, mantenimiento, reciclaje)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          lugar_id,
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
        ]
      );
      const motivo = result.rows[0];
      motivo.tamanio = calcularTamanio(motivo.medida_ancho, motivo.medida_alto);
      return res.status(201).json(motivo);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear el motivo.' });
    }
  }

  if (req.method === 'GET') {
    const { lugar_id } = req.query;
    const result = lugar_id
      ? await query('SELECT * FROM motivos WHERE lugar_id = $1 ORDER BY numero_motivo', [lugar_id])
      : await query('SELECT * FROM motivos ORDER BY id DESC');
    return res.status(200).json(result.rows);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido.' });
}

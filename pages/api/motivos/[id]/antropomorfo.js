const { query } = require('../../../../lib/db');
const { requireUser } = require('../../../../lib/auth');
const { calcularProporcionalidad } = require('../../../../lib/calculos');

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });
  const { id } = req.query; // motivo_id

  if (req.method === 'GET') {
    const result = await query('SELECT * FROM antropomorfos WHERE motivo_id = $1', [id]);
    return res.status(200).json(result.rows[0] || null);
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    const alturaTotal = b.altura_total ? Number(b.altura_total) : null;
    const proporcionalidad = calcularProporcionalidad(alturaTotal, {
      cabeza: b.cabeza_presente ? Number(b.cabeza_long) : null,
      tronco: b.tronco_presente ? Number(b.tronco_long) : null,
      piernas_pies: b.piernas_pies_presente ? Number(b.piernas_pies_long) : null,
      brazos_manos: b.brazos_manos_presente ? Number(b.brazos_manos_long) : null,
      organos_masc: b.organos_masc_presente ? Number(b.organos_masc_long) : null,
    });

    const valores = [
      b.genero || null,
      b.norma || null,
      alturaTotal,
      b.representacion || null,
      !!b.cabeza_presente,
      b.cabeza_presente ? b.cabeza_long || null : null,
      !!b.tronco_presente,
      b.tronco_presente ? b.tronco_long || null : null,
      !!b.piernas_pies_presente,
      b.piernas_pies_presente ? b.piernas_pies_long || null : null,
      !!b.brazos_manos_presente,
      b.brazos_manos_presente ? b.brazos_manos_long || null : null,
      !!b.organos_masc_presente,
      b.organos_masc_presente ? b.organos_masc_long || null : null,
      !!b.organos_fem_presente,
      b.organos_fem_presente ? b.organos_fem_long || null : null,
      proporcionalidad,
      b.tratamiento_cabeza || null,
      b.tratamiento_cuerpo || null,
      b.tratamiento_extremidades || null,
      b.vestido || null,
      b.adornos || null,
      b.organos_sex_masc_trat || null,
      b.organos_sex_fem_trat || null,
    ];

    try {
      const existing = await query('SELECT id FROM antropomorfos WHERE motivo_id = $1', [id]);
      let result;
      if (existing.rows[0]) {
        result = await query(
          `UPDATE antropomorfos SET
            genero=$1, norma=$2, altura_total=$3, representacion=$4,
            cabeza_presente=$5, cabeza_long=$6, tronco_presente=$7, tronco_long=$8,
            piernas_pies_presente=$9, piernas_pies_long=$10, brazos_manos_presente=$11, brazos_manos_long=$12,
            organos_masc_presente=$13, organos_masc_long=$14, organos_fem_presente=$15, organos_fem_long=$16,
            proporcionalidad=$17, tratamiento_cabeza=$18, tratamiento_cuerpo=$19, tratamiento_extremidades=$20,
            vestido=$21, adornos=$22, organos_sex_masc_trat=$23, organos_sex_fem_trat=$24
           WHERE motivo_id=$25 RETURNING *`,
          [...valores, id]
        );
      } else {
        result = await query(
          `INSERT INTO antropomorfos
            (genero, norma, altura_total, representacion,
             cabeza_presente, cabeza_long, tronco_presente, tronco_long,
             piernas_pies_presente, piernas_pies_long, brazos_manos_presente, brazos_manos_long,
             organos_masc_presente, organos_masc_long, organos_fem_presente, organos_fem_long,
             proporcionalidad, tratamiento_cabeza, tratamiento_cuerpo, tratamiento_extremidades,
             vestido, adornos, organos_sex_masc_trat, organos_sex_fem_trat, motivo_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
           RETURNING *`,
          [...valores, id]
        );
      }
      return res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al guardar los datos de antropomorfo.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Método no permitido.' });
}

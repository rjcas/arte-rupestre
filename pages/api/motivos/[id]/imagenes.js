const { query } = require('../../../../lib/db');
const { requireUser } = require('../../../../lib/auth');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAMANIO_MAXIMO = 4 * 1024 * 1024; // 4 MB

export const config = {
  api: {
    bodyParser: { sizeLimit: '6mb' },
  },
};

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado.' });
  const { id } = req.query; // motivo_id

  if (req.method === 'GET') {
    const result = await query(
      `SELECT id, nombre_archivo, tipo_mime, tamanio_bytes, creado_en
       FROM motivo_imagenes WHERE motivo_id = $1 ORDER BY creado_en`,
      [id]
    );
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    const { nombre_archivo, tipo_mime, datos_base64 } = req.body || {};
    if (!tipo_mime || !datos_base64) {
      return res.status(400).json({ error: 'Falta la imagen.' });
    }
    if (!TIPOS_PERMITIDOS.includes(tipo_mime)) {
      return res.status(400).json({ error: 'Formato no admitido. Usá JPG, PNG, WEBP o GIF.' });
    }

    const buffer = Buffer.from(datos_base64, 'base64');
    if (buffer.length > TAMANIO_MAXIMO) {
      return res.status(400).json({ error: 'La imagen pesa más de 4 MB. Comprimila e intentá de nuevo.' });
    }

    try {
      const result = await query(
        `INSERT INTO motivo_imagenes (motivo_id, nombre_archivo, tipo_mime, datos, tamanio_bytes, subido_por)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, nombre_archivo, tipo_mime, tamanio_bytes, creado_en`,
        [id, nombre_archivo || null, tipo_mime, buffer, buffer.length, user.sub]
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al guardar la imagen.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido.' });
}

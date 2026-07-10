import Link from 'next/link';
import { requireUser } from '../../../lib/auth';
import { query } from '../../../lib/db';
import Layout from '../../../components/Layout';

export async function getServerSideProps({ req, params }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const lugarResult = await query('SELECT * FROM lugares WHERE id = $1', [params.id]);
  const lugar = lugarResult.rows[0];
  if (!lugar) return { notFound: true };

  const motivosResult = await query(
    `SELECT m.*, t.tipo_tecnica, img.id AS imagen_id
     FROM motivos m
     LEFT JOIN tecnicas t ON t.motivo_id = m.id
     LEFT JOIN LATERAL (
       SELECT id FROM motivo_imagenes mi WHERE mi.motivo_id = m.id ORDER BY mi.creado_en LIMIT 1
     ) img ON true
     WHERE m.lugar_id = $1
     ORDER BY m.numero_motivo NULLS LAST, m.id`,
    [params.id]
  );

  return {
    props: {
      user,
      lugar: JSON.parse(JSON.stringify(lugar)),
      motivos: JSON.parse(JSON.stringify(motivosResult.rows)),
    },
  };
}

const ETIQUETA_TECNICA = { grabado: 'Grabado', pintura: 'Pintura', mixta: 'Mixta' };

export default function DetalleLugar({ user, lugar, motivos }) {
  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">I. Lugar</span>
          <h1>{lugar.sitio}</h1>
        </div>
        <Link className="btn secundario" href={`/lugares/${lugar.id}/editar`}>
          Editar datos del lugar
        </Link>
      </div>

      <div className="tarjeta">
        <div className="grid-3">
          <div>
            <strong>Provincia:</strong> {lugar.provincia || '—'}
          </div>
          <div>
            <strong>Paraje:</strong> {lugar.paraje || '—'}
          </div>
          <div>
            <strong>Sector:</strong> {lugar.sector || '—'}
          </div>
          <div>
            <strong>Sigla:</strong> {lugar.sigla_sitio || '—'}
          </div>
          <div>
            <strong>Año/s campaña:</strong> {lugar.anios_campania || '—'}
          </div>
          <div>
            <strong>Operador/es:</strong> {lugar.operadores || '—'}
          </div>
        </div>
        {lugar.latitud && lugar.longitud && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--linea)' }}>
            <strong>Coordenadas:</strong> {lugar.latitud}, {lugar.longitud}{' '}
            <a
              href={`https://www.google.com/maps?q=${lugar.latitud},${lugar.longitud}`}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: 10, color: 'var(--ocre-dark)' }}
            >
              Ver en Google Maps ↗
            </a>
          </div>
        )}
      </div>

      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">II. Motivos · {motivos.length}</span>
          <h2>Motivos registrados</h2>
        </div>
        <Link className="btn" href={`/lugares/${lugar.id}/motivos/nuevo`}>
          + Nuevo motivo
        </Link>
      </div>

      {motivos.length === 0 ? (
        <div className="tarjeta">
          <div className="vacio">Todavía no hay motivos cargados para este lugar.</div>
        </div>
      ) : (
        <div className="grid-motivos">
          {motivos.map((m) => (
            <Link className="card-motivo" key={m.id} href={`/motivos/${m.id}`}>
              <div className="card-motivo-miniatura">
                {m.imagen_id ? (
                  <img src={`/api/imagenes/${m.imagen_id}`} alt={`Motivo ${m.numero_motivo ?? m.id}`} />
                ) : (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                )}
              </div>
              <div className="card-motivo-cuerpo">
                <div className="card-motivo-cabecera">
                  <span className="card-motivo-numero">N° {m.numero_motivo ?? m.id}</span>
                  {m.tipo_tecnica && (
                    <span className={`card-motivo-tecnica ${m.tipo_tecnica}`}>
                      {ETIQUETA_TECNICA[m.tipo_tecnica] || m.tipo_tecnica}
                    </span>
                  )}
                </div>
                <div className="card-motivo-clase">{m.clase || 'Sin clasificar'}</div>
                {m.tipo && <div className="card-motivo-tipo">{m.tipo}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}

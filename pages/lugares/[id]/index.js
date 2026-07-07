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
    `SELECT m.*, t.tipo_tecnica
     FROM motivos m
     LEFT JOIN tecnicas t ON t.motivo_id = m.id
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
      </div>

      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">II. Motivos</span>
          <h2>Motivos registrados</h2>
        </div>
        <Link className="btn" href={`/lugares/${lugar.id}/motivos/nuevo`}>
          + Nuevo motivo
        </Link>
      </div>

      <div className="tarjeta">
        {motivos.length === 0 ? (
          <div className="vacio">Todavía no hay motivos cargados para este lugar.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Clase</th>
                <th>Grupo</th>
                <th>Tipo</th>
                <th>Técnica</th>
              </tr>
            </thead>
            <tbody>
              {motivos.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link className="fila-tabla" href={`/motivos/${m.id}`}>
                      {m.numero_motivo ?? m.id}
                    </Link>
                  </td>
                  <td>{m.clase || '—'}</td>
                  <td>{m.grupo || '—'}</td>
                  <td>{m.tipo || '—'}</td>
                  <td>{m.tipo_tecnica || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

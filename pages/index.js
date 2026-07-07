import Link from 'next/link';
import { requireUser } from '../lib/auth';
import { query } from '../lib/db';
import Layout from '../components/Layout';

export async function getServerSideProps({ req }) {
  const user = requireUser(req);
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  const result = await query(
    `SELECT l.*, (SELECT count(*) FROM motivos m WHERE m.lugar_id = l.id) AS cantidad_motivos
     FROM lugares l ORDER BY l.creado_en DESC`
  );
  return {
    props: {
      user,
      lugares: JSON.parse(JSON.stringify(result.rows)),
    },
  };
}

export default function Home({ user, lugares }) {
  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">Base de datos</span>
          <h1>Lugares registrados</h1>
        </div>
        <Link className="btn" href="/lugares/nuevo">
          + Nuevo lugar
        </Link>
      </div>

      <div className="tarjeta">
        {lugares.length === 0 ? (
          <div className="vacio">Todavía no hay lugares cargados. Creá el primero.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sitio</th>
                <th>Sector</th>
                <th>Provincia</th>
                <th>Sigla</th>
                <th>Año/s campaña</th>
                <th>Motivos</th>
              </tr>
            </thead>
            <tbody>
              {lugares.map((l) => (
                <tr key={l.id}>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <Link className="fila-tabla" href={`/lugares/${l.id}`}>
                      <table style={{ width: '100%' }}>
                        <tbody>
                          <tr>
                            <td style={{ border: 'none' }}>{l.sitio || '—'}</td>
                            <td style={{ border: 'none' }}>{l.sector || '—'}</td>
                            <td style={{ border: 'none' }}>{l.provincia || '—'}</td>
                            <td style={{ border: 'none' }}>{l.sigla_sitio || '—'}</td>
                            <td style={{ border: 'none' }}>{l.anios_campania || '—'}</td>
                            <td style={{ border: 'none' }}>{l.cantidad_motivos}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

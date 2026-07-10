import dynamic from 'next/dynamic';
import { requireUser } from '../lib/auth';
import { query } from '../lib/db';
import Layout from '../components/Layout';

const Mapa = dynamic(() => import('../components/Mapa'), {
  ssr: false,
  loading: () => (
    <div className="vacio" style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Cargando mapa…
    </div>
  ),
});

export async function getServerSideProps({ req }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const result = await query(
    `SELECT l.id, l.sitio, l.sector, l.provincia, l.latitud, l.longitud,
            (SELECT count(*) FROM motivos m WHERE m.lugar_id = l.id) AS cantidad_motivos
     FROM lugares l
     WHERE l.latitud IS NOT NULL AND l.longitud IS NOT NULL
     ORDER BY l.sitio`
  );
  const totalResult = await query('SELECT count(*) FROM lugares');

  return {
    props: {
      user,
      lugares: JSON.parse(JSON.stringify(result.rows)),
      totalLugares: Number(totalResult.rows[0].count),
    },
  };
}

export default function MapaPage({ user, lugares, totalLugares }) {
  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">Ubicación de los hallazgos</span>
          <h1>Mapa</h1>
        </div>
      </div>

      {lugares.length === 0 ? (
        <div className="tarjeta">
          <div className="vacio">
            Ningún lugar tiene coordenadas cargadas todavía. Agregalas al editar un lugar, en la
            sección &quot;Ubicación en el mapa&quot;, y van a aparecer acá.
          </div>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--piedra-700)', fontSize: '0.88rem', marginTop: -12, marginBottom: 16 }}>
            Mostrando {lugares.length} de {totalLugares} lugares (los que ya tienen coordenadas
            cargadas).
          </p>
          <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
            <Mapa lugares={lugares} />
          </div>
        </>
      )}
    </Layout>
  );
}

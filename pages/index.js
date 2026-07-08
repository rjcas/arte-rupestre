import { useState, useMemo } from 'react';
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
     FROM lugares l ORDER BY l.sitio NULLS LAST, l.sector`
  );
  return {
    props: {
      user,
      lugares: JSON.parse(JSON.stringify(result.rows)),
    },
  };
}

export default function Home({ user, lugares }) {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lugares;
    return lugares.filter((l) =>
      [l.sitio, l.sector, l.provincia, l.paraje, l.sigla_sitio]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(q))
    );
  }, [lugares, busqueda]);

  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">Base de datos · {lugares.length} lugares</span>
          <h1>Lugares registrados</h1>
        </div>
        <Link className="btn" href="/lugares/nuevo">
          + Nuevo lugar
        </Link>
      </div>

      {lugares.length === 0 ? (
        <div className="tarjeta">
          <div className="vacio">Todavía no hay lugares cargados. Creá el primero.</div>
        </div>
      ) : (
        <>
          <div className="buscador">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por sitio, sector, provincia o sigla…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {filtrados.length === 0 ? (
            <div className="tarjeta">
              <div className="vacio">Ningún lugar coincide con &quot;{busqueda}&quot;.</div>
            </div>
          ) : (
            <div className="grid-lugares">
              {filtrados.map((l) => (
                <Link key={l.id} className="card-lugar" href={`/lugares/${l.id}`}>
                  <div className="card-lugar-cabecera">
                    <span className="card-lugar-sigla">{l.sigla_sitio || '—'}</span>
                    <span className="card-lugar-motivos">
                      {l.cantidad_motivos} {l.cantidad_motivos === '1' ? 'motivo' : 'motivos'}
                    </span>
                  </div>
                  <div className="card-lugar-titulo">{l.sitio || 'Sin nombre'}</div>
                  <div className="card-lugar-meta">
                    {[l.sector && `Sector ${l.sector}`, l.provincia, l.paraje]
                      .filter(Boolean)
                      .join(' · ') || 'Sin más datos'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

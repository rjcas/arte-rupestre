import { useState } from 'react';
import Link from 'next/link';
import { requireUser } from '../../../lib/auth';
import { query } from '../../../lib/db';
import Layout from '../../../components/Layout';
import PestañasMotivo from '../../../components/PestañasMotivo';

export async function getServerSideProps({ req, params }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const motivoResult = await query(
    `SELECT m.*, l.sitio, l.id AS lugar_id FROM motivos m JOIN lugares l ON l.id = m.lugar_id WHERE m.id = $1`,
    [params.id]
  );
  const motivo = motivoResult.rows[0];
  if (!motivo) return { notFound: true };

  const conjuntoResult = await query(
    `SELECT cm.*, m.numero_motivo, m.clase, m.tipo
     FROM conjunto_motivos cm JOIN motivos m ON m.id = cm.motivo_id
     WHERE cm.lugar_id = $1 ORDER BY m.numero_motivo`,
    [motivo.lugar_id]
  );

  const todosMotivosResult = await query(
    'SELECT id, numero_motivo, clase, tipo FROM motivos WHERE lugar_id = $1 ORDER BY numero_motivo',
    [motivo.lugar_id]
  );

  return {
    props: {
      user,
      motivo: JSON.parse(JSON.stringify(motivo)),
      integrantesIniciales: JSON.parse(JSON.stringify(conjuntoResult.rows)),
      todosMotivos: JSON.parse(JSON.stringify(todosMotivosResult.rows)),
    },
  };
}

export default function ConjuntoMotivo({ user, motivo, integrantesIniciales, todosMotivos }) {
  const [integrantes, setIntegrantes] = useState(integrantesIniciales);
  const [seleccion, setSeleccion] = useState('');
  const [error, setError] = useState('');

  const disponibles = todosMotivos.filter(
    (m) => !integrantes.some((i) => i.motivo_id === m.id)
  );

  async function agregar(e) {
    e.preventDefault();
    setError('');
    if (!seleccion) return;
    const res = await fetch('/api/conjuntos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lugar_id: motivo.lugar_id, motivo_id: Number(seleccion) }),
    });
    if (res.ok) {
      const m = todosMotivos.find((mm) => mm.id === Number(seleccion));
      setIntegrantes((prev) => [
        ...prev,
        { motivo_id: m.id, numero_motivo: m.numero_motivo, clase: m.clase, tipo: m.tipo, id: `tmp-${m.id}` },
      ]);
      setSeleccion('');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo vincular el motivo.');
    }
  }

  async function quitar(item) {
    await fetch('/api/conjuntos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    });
    setIntegrantes((prev) => prev.filter((i) => i.motivo_id !== item.motivo_id));
  }

  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">
            <Link href={`/lugares/${motivo.lugar_id}`}>{motivo.sitio}</Link> · Conjunto del sector
          </span>
          <h1>Conjunto</h1>
        </div>
      </div>

      <PestañasMotivo motivoId={motivo.id} />

      <div className="tarjeta">
        <p style={{ color: 'var(--piedra-700)', fontSize: '0.9rem', marginTop: 0 }}>
          El conjunto agrupa los motivos que integran este mismo sector/lugar. Esta lista es compartida por
          todos los motivos de <strong>{motivo.sitio}</strong>.
        </p>

        {error && <div className="error">{error}</div>}

        {integrantes.length === 0 ? (
          <div className="vacio">Todavía no se vincularon motivos a este conjunto.</div>
        ) : (
          <table style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <th>N° motivo</th>
                <th>Clase</th>
                <th>Tipo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {integrantes.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link href={`/motivos/${i.motivo_id}`}>{i.numero_motivo ?? i.motivo_id}</Link>
                  </td>
                  <td>{i.clase || '—'}</td>
                  <td>{i.tipo || '—'}</td>
                  <td>
                    <button className="btn secundario" type="button" onClick={() => quitar(i)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form onSubmit={agregar} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="campo" style={{ flex: 1, marginBottom: 0 }}>
            <label>Agregar motivo al conjunto</label>
            <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
              <option value="">Seleccionar motivo…</option>
              {disponibles.map((m) => (
                <option key={m.id} value={m.id}>
                  N° {m.numero_motivo ?? m.id} {m.clase ? `— ${m.clase}` : ''}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit">
            Agregar
          </button>
        </form>
      </div>
    </Layout>
  );
}

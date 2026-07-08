import { useState } from 'react';
import Link from 'next/link';
import { requireUser } from '../../../lib/auth';
import { query } from '../../../lib/db';
import Layout from '../../../components/Layout';
import TabsMotivo from '../../../components/TabsMotivo';

export async function getServerSideProps({ req, params }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const motivoResult = await query(
    `SELECT m.*, l.sitio, l.id AS lugar_id FROM motivos m JOIN lugares l ON l.id = m.lugar_id WHERE m.id = $1`,
    [params.id]
  );
  const motivo = motivoResult.rows[0];
  if (!motivo) return { notFound: true };

  const opsResult = await query(
    'SELECT * FROM operaciones_cognitivas WHERE motivo_id = $1 ORDER BY id',
    [params.id]
  );

  const otrosMotivosResult = await query(
    'SELECT id, numero_motivo, clase FROM motivos WHERE lugar_id = $1 AND id != $2 ORDER BY numero_motivo',
    [motivo.lugar_id, params.id]
  );

  return {
    props: {
      user,
      motivo: JSON.parse(JSON.stringify(motivo)),
      operacionesIniciales: JSON.parse(JSON.stringify(opsResult.rows)),
      otrosMotivos: JSON.parse(JSON.stringify(otrosMotivosResult.rows)),
    },
  };
}

export default function OperacionesMotivo({ user, motivo, operacionesIniciales, otrosMotivos }) {
  const [operaciones, setOperaciones] = useState(operacionesIniciales);
  const [nueva, setNueva] = useState({
    clase_operacion: '',
    posicion: '',
    direccion: '',
    apendices: '',
    angularidad: '',
    motivo_vinculado_id: '',
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function set(campo, valor) {
    setNueva((v) => ({ ...v, [campo]: valor }));
  }

  async function agregar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const res = await fetch(`/api/motivos/${motivo.id}/operaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nueva),
    });
    setGuardando(false);
    if (res.ok) {
      const data = await res.json();
      setOperaciones((ops) => [...ops, data]);
      setNueva({
        clase_operacion: '',
        posicion: '',
        direccion: '',
        apendices: '',
        angularidad: '',
        motivo_vinculado_id: '',
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar.');
    }
  }

  async function borrar(id) {
    await fetch(`/api/operaciones/${id}`, { method: 'DELETE' });
    setOperaciones((ops) => ops.filter((o) => o.id !== id));
  }

  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">
            <Link href={`/lugares/${motivo.lugar_id}`}>{motivo.sitio}</Link> · Motivo N°{' '}
            {motivo.numero_motivo ?? motivo.id}
          </span>
          <h1>Operaciones cognitivas</h1>
        </div>
      </div>

      <TabsMotivo motivoId={motivo.id} />

      <div className="tarjeta">
        {operaciones.length === 0 ? (
          <div className="vacio">Todavía no se registraron operaciones cognitivas para este motivo.</div>
        ) : (
          <table style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <th>Clase de operación</th>
                <th>Posición</th>
                <th>Dirección</th>
                <th>Apéndices</th>
                <th>Angularidad</th>
                <th>Motivo vinculado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {operaciones.map((o) => (
                <tr key={o.id}>
                  <td>{o.clase_operacion || '—'}</td>
                  <td>{o.posicion || '—'}</td>
                  <td>{o.direccion || '—'}</td>
                  <td>{o.apendices || '—'}</td>
                  <td>{o.angularidad || '—'}</td>
                  <td>{o.motivo_vinculado_id || '—'}</td>
                  <td>
                    <button className="btn secundario" onClick={() => borrar(o.id)} type="button">
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3>Agregar operación</h3>
        <form onSubmit={agregar}>
          {error && <div className="error">{error}</div>}
          <div className="grid-3">
            <div className="campo">
              <label>Clase de operación</label>
              <input
                type="text"
                value={nueva.clase_operacion}
                onChange={(e) => set('clase_operacion', e.target.value)}
                placeholder="Según Apéndice N° 2"
              />
            </div>
            <div className="campo">
              <label>Posición</label>
              <input type="text" value={nueva.posicion} onChange={(e) => set('posicion', e.target.value)} />
            </div>
            <div className="campo">
              <label>Dirección</label>
              <input type="text" value={nueva.direccion} onChange={(e) => set('direccion', e.target.value)} />
            </div>
            <div className="campo">
              <label>Apéndices</label>
              <input type="text" value={nueva.apendices} onChange={(e) => set('apendices', e.target.value)} />
            </div>
            <div className="campo">
              <label>Angularidad</label>
              <input
                type="text"
                value={nueva.angularidad}
                onChange={(e) => set('angularidad', e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Motivo vinculado (si aplica)</label>
              <select
                value={nueva.motivo_vinculado_id}
                onChange={(e) => set('motivo_vinculado_id', e.target.value)}
              >
                <option value="">Ninguno</option>
                {otrosMotivos.map((m) => (
                  <option key={m.id} value={m.id}>
                    N° {m.numero_motivo ?? m.id} {m.clase ? `— ${m.clase}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Agregar operación'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

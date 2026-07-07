import { useState } from 'react';
import Link from 'next/link';
import { requireUser } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { calcularCromatismo } from '../../../lib/calculos';
import Layout from '../../../components/Layout';
import PestañasMotivo from '../../../components/PestañasMotivo';
import catalogos from '../../../lib/catalogos';

export async function getServerSideProps({ req, params }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const motivoResult = await query(
    `SELECT m.*, l.sitio, l.id AS lugar_id FROM motivos m JOIN lugares l ON l.id = m.lugar_id WHERE m.id = $1`,
    [params.id]
  );
  const motivo = motivoResult.rows[0];
  if (!motivo) return { notFound: true };

  const tecnicaResult = await query('SELECT * FROM tecnicas WHERE motivo_id = $1', [params.id]);
  const tecnica = tecnicaResult.rows[0] || {};

  return {
    props: {
      user,
      motivo: JSON.parse(JSON.stringify(motivo)),
      tecnicaInicial: JSON.parse(JSON.stringify(tecnica)),
    },
  };
}

export default function TecnicaMotivo({ user, motivo, tecnicaInicial }) {
  const [t, setT] = useState({ tipo_tecnica: '', ...tecnicaInicial });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  function set(campo, valor) {
    setT((v) => ({ ...v, [campo]: valor }));
    setGuardado(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const res = await fetch(`/api/motivos/${motivo.id}/tecnica`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    });
    setGuardando(false);
    if (res.ok) {
      const data = await res.json();
      setT(data);
      setGuardado(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar.');
    }
  }

  const cromatismoPreview = calcularCromatismo(t.pintura_colores);
  const esGrabadoHoradacion = t.grabado_tipo === 'Horadación';

  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">
            <Link href={`/lugares/${motivo.lugar_id}`}>{motivo.sitio}</Link> · Motivo N°{' '}
            {motivo.numero_motivo ?? motivo.id}
          </span>
          <h1>Técnica</h1>
        </div>
      </div>

      <PestañasMotivo motivoId={motivo.id} />

      <div className="tarjeta">
        <form onSubmit={onSubmit}>
          {error && <div className="error">{error}</div>}
          {guardado && <div className="calculado" style={{ marginBottom: 16 }}>Guardado ✓</div>}

          <div className="campo">
            <label>Variedad de técnica</label>
            <select value={t.tipo_tecnica || ''} onChange={(e) => set('tipo_tecnica', e.target.value)}>
              <option value="">Seleccionar…</option>
              <option value="grabado">Grabado</option>
              <option value="pintura">Pintura</option>
              <option value="mixta">Mixta</option>
            </select>
          </div>

          {(t.tipo_tecnica === 'grabado' || t.tipo_tecnica === 'mixta') && (
            <fieldset style={{ border: '1px solid var(--linea)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <legend style={{ padding: '0 8px', fontWeight: 600 }}>Grabado</legend>
              <div className="grid-2">
                <div className="campo">
                  <label>Característica</label>
                  <select
                    value={t.grabado_caracteristica || ''}
                    onChange={(e) => set('grabado_caracteristica', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {catalogos.GRABADO_CARACTERISTICA.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Tipo</label>
                  <select value={t.grabado_tipo || ''} onChange={(e) => set('grabado_tipo', e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {catalogos.GRABADO_TIPO.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                {!esGrabadoHoradacion && (
                  <div className="campo">
                    <label>Topografía</label>
                    <select
                      value={t.grabado_topografia || ''}
                      onChange={(e) => set('grabado_topografia', e.target.value)}
                    >
                      <option value="">Seleccionar…</option>
                      {catalogos.GRABADO_TOPOGRAFIA.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!esGrabadoHoradacion && (
                  <div className="campo">
                    <label>Ancho de trazo</label>
                    <select
                      value={t.grabado_ancho_trazo || ''}
                      onChange={(e) => set('grabado_ancho_trazo', e.target.value)}
                    >
                      <option value="">Seleccionar…</option>
                      {catalogos.GRABADO_ANCHO_TRAZO.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="campo">
                  <label>Espesor</label>
                  <select
                    value={t.grabado_espesor || ''}
                    onChange={(e) => set('grabado_espesor', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {catalogos.GRABADO_ESPESOR.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Forma del surco</label>
                  <select
                    value={t.grabado_forma_surco || ''}
                    onChange={(e) => set('grabado_forma_surco', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {catalogos.GRABADO_FORMA_SURCO.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>
          )}

          {(t.tipo_tecnica === 'pintura' || t.tipo_tecnica === 'mixta') && (
            <fieldset style={{ border: '1px solid var(--linea)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <legend style={{ padding: '0 8px', fontWeight: 600 }}>Pintura</legend>
              <div className="grid-2">
                <div className="campo">
                  <label>Característica</label>
                  <select
                    value={t.pintura_caracteristica || ''}
                    onChange={(e) => set('pintura_caracteristica', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {catalogos.PINTURA_CARACTERISTICA.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                {t.pintura_caracteristica === 'Combinada' && (
                  <div className="campo">
                    <label>Tipo de combinación</label>
                    <select
                      value={t.pintura_combinacion || ''}
                      onChange={(e) => set('pintura_combinacion', e.target.value)}
                    >
                      <option value="">Seleccionar…</option>
                      {catalogos.PINTURA_COMBINACION.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="campo">
                  <label>Color/es (separados por coma)</label>
                  <input
                    type="text"
                    value={t.pintura_colores || ''}
                    onChange={(e) => set('pintura_colores', e.target.value)}
                    placeholder="ej: rojo, negro"
                  />
                </div>
                <div className="campo">
                  <label>Cromatismo</label>
                  <input type="text" value={cromatismoPreview || ''} disabled placeholder="Se calcula solo" />
                </div>
              </div>
            </fieldset>
          )}

          {t.tipo_tecnica === 'mixta' && (
            <fieldset style={{ border: '1px solid var(--linea)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <legend style={{ padding: '0 8px', fontWeight: 600 }}>Orden (mixta)</legend>
              <div className="campo">
                <label>Orden de ejecución</label>
                <select value={t.mixta_orden || ''} onChange={(e) => set('mixta_orden', e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {catalogos.MIXTA_ORDEN.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
          )}

          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar técnica'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

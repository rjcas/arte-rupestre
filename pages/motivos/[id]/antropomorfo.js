import { useState } from 'react';
import Link from 'next/link';
import { requireUser } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { calcularProporcionalidad, calcularCategoriaOrganoSexualFemenino } from '../../../lib/calculos';
import Layout from '../../../components/Layout';
import TabsMotivo from '../../../components/TabsMotivo';
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

  const antResult = await query('SELECT * FROM antropomorfos WHERE motivo_id = $1', [params.id]);
  const antropomorfo = antResult.rows[0] || {};

  return {
    props: {
      user,
      motivo: JSON.parse(JSON.stringify(motivo)),
      antropomorfoInicial: JSON.parse(JSON.stringify(antropomorfo)),
    },
  };
}

function CampoMedida({ label, presenteKey, longKey, a, set }) {
  return (
    <div className="campo" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={!!a[presenteKey]}
            onChange={(e) => set(presenteKey, e.target.checked)}
            style={{ width: 'auto' }}
          />
          {label}
        </label>
        {a[presenteKey] && (
          <input
            type="number"
            step="0.1"
            placeholder="Longitud (cm)"
            value={a[longKey] ?? ''}
            onChange={(e) => set(longKey, e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

export default function AntropomorfoMotivo({ user, motivo, antropomorfoInicial }) {
  const [a, setA] = useState(antropomorfoInicial);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  function set(campo, valor) {
    setA((v) => ({ ...v, [campo]: valor }));
    setGuardado(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const res = await fetch(`/api/motivos/${motivo.id}/antropomorfo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a),
    });
    setGuardando(false);
    if (res.ok) {
      const data = await res.json();
      setA(data);
      setGuardado(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar.');
    }
  }

  const proporcionalidadPreview = a.altura_total
    ? calcularProporcionalidad(Number(a.altura_total), {
        cabeza: a.cabeza_presente ? Number(a.cabeza_long) : null,
        tronco: a.tronco_presente ? Number(a.tronco_long) : null,
        piernas_pies: a.piernas_pies_presente ? Number(a.piernas_pies_long) : null,
        brazos_manos: a.brazos_manos_presente ? Number(a.brazos_manos_long) : null,
        organos_masc: a.organos_masc_presente ? Number(a.organos_masc_long) : null,
      })
    : null;

  const categoriaFemenino = a.organos_fem_presente
    ? calcularCategoriaOrganoSexualFemenino(a.organos_fem_long)
    : null;

  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">
            <Link href={`/lugares/${motivo.lugar_id}`}>{motivo.sitio}</Link> · Motivo N°{' '}
            {motivo.numero_motivo ?? motivo.id}
          </span>
          <h1>Antropomorfo</h1>
        </div>
      </div>

      <TabsMotivo motivoId={motivo.id} />

      <div className="tarjeta">
        <form onSubmit={onSubmit}>
          {error && <div className="error">{error}</div>}
          {guardado && <div className="calculado" style={{ marginBottom: 16 }}>Guardado ✓</div>}

          <div className="grid-3">
            <div className="campo">
              <label>Género</label>
              <select value={a.genero || ''} onChange={(e) => set('genero', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.GENERO.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Norma</label>
              <select value={a.norma || ''} onChange={(e) => set('norma', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.NORMA.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Representación</label>
              <select value={a.representacion || ''} onChange={(e) => set('representacion', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.REPRESENTACION.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="campo">
            <label>Altura total (cm)</label>
            <input
              type="number"
              step="0.1"
              value={a.altura_total ?? ''}
              onChange={(e) => set('altura_total', e.target.value)}
            />
          </div>

          <fieldset style={{ border: '1px solid var(--linea)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <legend style={{ padding: '0 8px', fontWeight: 600 }}>
              Medidas antropométricas
              {proporcionalidadPreview && (
                <span className="calculado">Proporcionalidad: {proporcionalidadPreview}</span>
              )}
            </legend>
            <div className="grid-2">
              <CampoMedida label="Cabeza y cuello (12%)" presenteKey="cabeza_presente" longKey="cabeza_long" a={a} set={set} />
              <CampoMedida label="Tronco (28%)" presenteKey="tronco_presente" longKey="tronco_long" a={a} set={set} />
              <CampoMedida label="Pierna y pie (60%)" presenteKey="piernas_pies_presente" longKey="piernas_pies_long" a={a} set={set} />
              <CampoMedida label="Brazos y manos (45%)" presenteKey="brazos_manos_presente" longKey="brazos_manos_long" a={a} set={set} />
              <CampoMedida label="Órganos sexuales masculinos (6%)" presenteKey="organos_masc_presente" longKey="organos_masc_long" a={a} set={set} />
              <div>
                <CampoMedida label="Órganos sexuales femeninos" presenteKey="organos_fem_presente" longKey="organos_fem_long" a={a} set={set} />
                {categoriaFemenino && <span className="calculado">Categoría: {categoriaFemenino}</span>}
              </div>
            </div>
          </fieldset>

          <div className="grid-2">
            <div className="campo">
              <label>Tratamiento de cabeza</label>
              <select
                value={a.tratamiento_cabeza || ''}
                onChange={(e) => set('tratamiento_cabeza', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {catalogos.TRATAMIENTO_CABEZA.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Tratamiento de cuerpo</label>
              <select
                value={a.tratamiento_cuerpo || ''}
                onChange={(e) => set('tratamiento_cuerpo', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {catalogos.TRATAMIENTO_CUERPO.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Tratamiento de extremidades</label>
              <select
                value={a.tratamiento_extremidades || ''}
                onChange={(e) => set('tratamiento_extremidades', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {catalogos.TRATAMIENTO_EXTREMIDADES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Vestido</label>
              <select value={a.vestido || ''} onChange={(e) => set('vestido', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.VESTIDO.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Adornos</label>
              <select value={a.adornos || ''} onChange={(e) => set('adornos', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.ADORNOS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Órganos sexuales masc. (tratamiento)</label>
              <select
                value={a.organos_sex_masc_trat || ''}
                onChange={(e) => set('organos_sex_masc_trat', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {catalogos.ORGANOS_SEXUALES_TRATAMIENTO.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Órganos sexuales fem. (tratamiento)</label>
              <select
                value={a.organos_sex_fem_trat || ''}
                onChange={(e) => set('organos_sex_fem_trat', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {catalogos.ORGANOS_SEXUALES_TRATAMIENTO.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar antropomorfo'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

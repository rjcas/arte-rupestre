import { useState } from 'react';
import Link from 'next/link';
import { requireUser } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { calcularTamanio } from '../../../lib/calculos';
import Layout from '../../../components/Layout';
import TabsMotivo from '../../../components/TabsMotivo';
import GaleriaImagenes from '../../../components/GaleriaImagenes';
import catalogos from '../../../lib/catalogos';

export async function getServerSideProps({ req, params }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const result = await query(
    `SELECT m.*, l.sitio, l.id AS lugar_id FROM motivos m JOIN lugares l ON l.id = m.lugar_id WHERE m.id = $1`,
    [params.id]
  );
  const motivo = result.rows[0];
  if (!motivo) return { notFound: true };
  return { props: { user, motivo: JSON.parse(JSON.stringify(motivo)) } };
}

export default function DetalleMotivo({ user, motivo: motivoInicial }) {
  const [motivo, setMotivo] = useState(motivoInicial);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const tamanio = calcularTamanio(motivo.medida_ancho, motivo.medida_alto);

  function set(campo, valor) {
    setMotivo((v) => ({ ...v, [campo]: valor }));
    setGuardado(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const res = await fetch(`/api/motivos/${motivo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(motivo),
    });
    setGuardando(false);
    if (res.ok) {
      setGuardado(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar.');
    }
  }

  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">
            <Link href={`/lugares/${motivo.lugar_id}`}>{motivo.sitio}</Link> · Motivo N°{' '}
            {motivo.numero_motivo ?? motivo.id}
          </span>
          <h1>
            {motivo.clase || 'Motivo'} {tamanio && <span className="calculado">Tamaño: {tamanio}</span>}
          </h1>
        </div>
      </div>

      <TabsMotivo motivoId={motivo.id} />

      {motivo.notas_legado && (
        <div className="tarjeta" style={{ background: 'var(--piedra-100)', fontSize: '0.85rem', color: 'var(--piedra-700)' }}>
          <strong>Dato importado del sistema anterior: </strong>
          {motivo.notas_legado}
        </div>
      )}

      <div className="tarjeta">
        <form onSubmit={onSubmit}>
          {error && <div className="error">{error}</div>}
          {guardado && <div className="calculado" style={{ marginBottom: 16 }}>Guardado ✓</div>}
          <div className="grid-2">
            <div className="campo">
              <label>N° de motivo</label>
              <input
                type="number"
                value={motivo.numero_motivo ?? ''}
                onChange={(e) => set('numero_motivo', e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Fuente</label>
              <select value={motivo.fuente || ''} onChange={(e) => set('fuente', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.FUENTE.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Clase</label>
              <select value={motivo.clase || ''} onChange={(e) => set('clase', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.CLASE.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Grupo</label>
              <select value={motivo.grupo || ''} onChange={(e) => set('grupo', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.GRUPO.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Subgrupo</label>
              <input
                type="text"
                value={motivo.subgrupo || ''}
                onChange={(e) => set('subgrupo', e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Tipo</label>
              <input type="text" value={motivo.tipo || ''} onChange={(e) => set('tipo', e.target.value)} />
            </div>
            <div className="campo">
              <label>Medida ancho (cm)</label>
              <input
                type="number"
                step="0.1"
                value={motivo.medida_ancho ?? ''}
                onChange={(e) => set('medida_ancho', e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Medida alto (cm)</label>
              <input
                type="number"
                step="0.1"
                value={motivo.medida_alto ?? ''}
                onChange={(e) => set('medida_alto', e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Ubicación</label>
              <select value={motivo.ubicacion || ''} onChange={(e) => set('ubicacion', e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.UBICACION.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Mantenimiento</label>
              <select
                value={motivo.mantenimiento || ''}
                onChange={(e) => set('mantenimiento', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {catalogos.MANTENIMIENTO.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="campo">
            <label>Tema</label>
            <textarea rows={2} value={motivo.tema || ''} onChange={(e) => set('tema', e.target.value)} />
          </div>
          <div className="campo">
            <label>Reciclaje</label>
            <input
              type="text"
              value={motivo.reciclaje || ''}
              onChange={(e) => set('reciclaje', e.target.value)}
            />
          </div>
          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <GaleriaImagenes motivoId={motivo.id} />
    </Layout>
  );
}

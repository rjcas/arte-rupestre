import { useState } from 'react';
import { useRouter } from 'next/router';
import { requireUser } from '../../../../lib/auth';
import { query } from '../../../../lib/db';
import Layout from '../../../../components/Layout';
import catalogos from '../../../../lib/catalogos';

export async function getServerSideProps({ req, params }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  const result = await query('SELECT id, sitio FROM lugares WHERE id = $1', [params.id]);
  const lugar = result.rows[0];
  if (!lugar) return { notFound: true };
  return { props: { user, lugar } };
}

export default function NuevoMotivo({ user, lugar }) {
  const router = useRouter();
  const [valores, setValores] = useState({
    numero_motivo: '',
    fuente: '',
    clase: '',
    grupo: '',
    subgrupo: '',
    tipo: '',
    medida_ancho: '',
    medida_alto: '',
    ubicacion: '',
    tema: '',
    mantenimiento: '',
    reciclaje: '',
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function set(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const res = await fetch('/api/motivos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...valores, lugar_id: lugar.id }),
    });
    setGuardando(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/motivos/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar.');
    }
  }

  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">II. Motivos · {lugar.sitio}</span>
          <h1>Nuevo motivo</h1>
        </div>
      </div>
      <div className="tarjeta">
        <form onSubmit={onSubmit}>
          {error && <div className="error">{error}</div>}
          <div className="grid-2">
            <div className="campo">
              <label>N° de motivo</label>
              <input
                type="number"
                value={valores.numero_motivo}
                onChange={(e) => set('numero_motivo', e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Fuente</label>
              <select value={valores.fuente} onChange={(e) => set('fuente', e.target.value)}>
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
              <select value={valores.clase} onChange={(e) => set('clase', e.target.value)}>
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
              <select value={valores.grupo} onChange={(e) => set('grupo', e.target.value)}>
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
                value={valores.subgrupo}
                onChange={(e) => set('subgrupo', e.target.value)}
                placeholder="Según Guía de Clasificación Morfológica (Boschín 2003)"
              />
            </div>
            <div className="campo">
              <label>Tipo</label>
              <input type="text" value={valores.tipo} onChange={(e) => set('tipo', e.target.value)} />
            </div>
            <div className="campo">
              <label>Medida ancho (cm)</label>
              <input
                type="number"
                step="0.1"
                value={valores.medida_ancho}
                onChange={(e) => set('medida_ancho', e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Medida alto (cm)</label>
              <input
                type="number"
                step="0.1"
                value={valores.medida_alto}
                onChange={(e) => set('medida_alto', e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Ubicación</label>
              <select value={valores.ubicacion} onChange={(e) => set('ubicacion', e.target.value)}>
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
                value={valores.mantenimiento}
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
            <textarea
              rows={2}
              value={valores.tema}
              onChange={(e) => set('tema', e.target.value)}
              placeholder="Función o temática ideológica, cuando pueda deducirse"
            />
          </div>
          <div className="campo">
            <label>Reciclaje</label>
            <input
              type="text"
              value={valores.reciclaje}
              onChange={(e) => set('reciclaje', e.target.value)}
              placeholder="Motivo preexistente reutilizado, si corresponde"
            />
          </div>
          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar motivo'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

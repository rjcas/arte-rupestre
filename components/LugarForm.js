import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LugarForm({ inicial, lugarId }) {
  const router = useRouter();
  const [valores, setValores] = useState(
    inicial || {
      fecha: '',
      pais: 'Argentina',
      provincia: '',
      paraje: '',
      sitio: '',
      sector: '',
      conjunto_num: '',
      sigla_sitio: '',
      anios_campania: '',
      operadores: '',
      laboratorio: '',
      latitud: '',
      longitud: '',
    }
  );
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function set(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const url = lugarId ? `/api/lugares/${lugarId}` : '/api/lugares';
    const method = lugarId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valores),
    });
    setGuardando(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/lugares/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar.');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="error">{error}</div>}
      <div className="grid-2">
        <div className="campo">
          <label>Fecha de registro</label>
          <input type="date" value={valores.fecha || ''} onChange={(e) => set('fecha', e.target.value)} />
        </div>
        <div className="campo">
          <label>País</label>
          <input type="text" value={valores.pais || ''} onChange={(e) => set('pais', e.target.value)} />
        </div>
        <div className="campo">
          <label>Provincia</label>
          <input type="text" value={valores.provincia || ''} onChange={(e) => set('provincia', e.target.value)} />
        </div>
        <div className="campo">
          <label>Paraje</label>
          <input type="text" value={valores.paraje || ''} onChange={(e) => set('paraje', e.target.value)} />
        </div>
        <div className="campo">
          <label>Sitio *</label>
          <input type="text" value={valores.sitio || ''} onChange={(e) => set('sitio', e.target.value)} required />
        </div>
        <div className="campo">
          <label>Sector</label>
          <input type="text" value={valores.sector || ''} onChange={(e) => set('sector', e.target.value)} />
        </div>
        <div className="campo">
          <label>N° de conjunto</label>
          <input
            type="text"
            value={valores.conjunto_num || ''}
            onChange={(e) => set('conjunto_num', e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Sigla del sitio</label>
          <input
            type="text"
            value={valores.sigla_sitio || ''}
            onChange={(e) => set('sigla_sitio', e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Año/s de campaña</label>
          <input
            type="text"
            value={valores.anios_campania || ''}
            onChange={(e) => set('anios_campania', e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Operador/es</label>
          <input
            type="text"
            value={valores.operadores || ''}
            onChange={(e) => set('operadores', e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Laboratorio</label>
          <input
            type="text"
            value={valores.laboratorio || ''}
            onChange={(e) => set('laboratorio', e.target.value)}
          />
        </div>
      </div>

      <fieldset style={{ border: '1px solid var(--linea)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <legend style={{ padding: '0 8px', fontWeight: 600 }}>Ubicación en el mapa (opcional)</legend>
        <div className="grid-2">
          <div className="campo">
            <label>Latitud</label>
            <input
              type="number"
              step="any"
              placeholder="ej: -41.123456"
              value={valores.latitud ?? ''}
              onChange={(e) => set('latitud', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Longitud</label>
            <input
              type="number"
              step="any"
              placeholder="ej: -71.123456"
              value={valores.longitud ?? ''}
              onChange={(e) => set('longitud', e.target.value)}
            />
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--piedra-700)', margin: 0 }}>
          Tip: en Google Maps, clic derecho sobre el punto exacto → clic en las coordenadas que
          aparecen arriba para copiarlas, y pegalas acá separadas (el primer número es la
          latitud, el segundo la longitud).
        </p>
      </fieldset>

      <button className="btn" type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar lugar'}
      </button>
    </form>
  );
}

import { useState, useEffect, useRef } from 'react';

const TAMANIO_MAXIMO = 4 * 1024 * 1024;

export default function GaleriaImagenes({ motivoId }) {
  const [imagenes, setImagenes] = useState(null);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(`/api/motivos/${motivoId}/imagenes`)
      .then((r) => r.json())
      .then(setImagenes)
      .catch(() => setImagenes([]));
  }, [motivoId]);

  function leerComoBase64(archivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    });
  }

  async function onSeleccionarArchivo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError('');

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(archivo.type)) {
      setError('Formato no admitido. Usá JPG, PNG, WEBP o GIF.');
      return;
    }
    if (archivo.size > TAMANIO_MAXIMO) {
      setError('La imagen pesa más de 4 MB. Comprimila (por ejemplo con squoosh.app) e intentá de nuevo.');
      return;
    }

    setSubiendo(true);
    try {
      const datos_base64 = await leerComoBase64(archivo);
      const res = await fetch(`/api/motivos/${motivoId}/imagenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_archivo: archivo.name,
          tipo_mime: archivo.type,
          datos_base64,
        }),
      });
      if (res.ok) {
        const nueva = await res.json();
        setImagenes((prev) => [...(prev || []), nueva]);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo subir la imagen.');
      }
    } catch (err) {
      setError('No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  }

  async function borrar(imagen) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    await fetch(`/api/imagenes/${imagen.id}`, { method: 'DELETE' });
    setImagenes((prev) => prev.filter((i) => i.id !== imagen.id));
  }

  if (imagenes === null) return null;

  return (
    <div className="tarjeta">
      <h3 style={{ marginTop: 0 }}>Imágenes</h3>
      {error && <div className="error">{error}</div>}

      {imagenes.length > 0 && (
        <div className="galeria-imagenes">
          {imagenes.map((img) => (
            <div className="galeria-item" key={img.id}>
              <img src={`/api/imagenes/${img.id}`} alt={img.nombre_archivo || 'Imagen del motivo'} />
              <button
                type="button"
                className="galeria-borrar"
                onClick={() => borrar(img)}
                title="Eliminar imagen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onSeleccionarArchivo}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        className="btn secundario"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
      >
        {subiendo ? 'Subiendo…' : '+ Agregar imagen'}
      </button>
      <span style={{ marginLeft: 10, fontSize: '0.78rem', color: 'var(--piedra-700)' }}>
        JPG, PNG, WEBP o GIF · hasta 4 MB
      </span>
    </div>
  );
}

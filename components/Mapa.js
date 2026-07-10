import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Los íconos por defecto de Leaflet no resuelven bien con bundlers como Webpack/Next.js,
// así que los apuntamos directo al CDN del propio paquete.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Mapa({ lugares }) {
  const conCoordenadas = lugares.filter((l) => l.latitud && l.longitud);

  const centro = conCoordenadas.length
    ? [
        conCoordenadas.reduce((s, l) => s + Number(l.latitud), 0) / conCoordenadas.length,
        conCoordenadas.reduce((s, l) => s + Number(l.longitud), 0) / conCoordenadas.length,
      ]
    : [-41.8, -71.3]; // centro aproximado de la Patagonia andina como fallback

  return (
    <MapContainer
      center={centro}
      zoom={conCoordenadas.length ? 9 : 6}
      style={{ height: '70vh', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {conCoordenadas.map((l) => (
        <Marker key={l.id} position={[Number(l.latitud), Number(l.longitud)]}>
          <Popup>
            <strong>{l.sitio}</strong>
            {l.sector && <> — Sector {l.sector}</>}
            <br />
            {l.provincia && (
              <>
                {l.provincia}
                <br />
              </>
            )}
            {l.cantidad_motivos} {l.cantidad_motivos === '1' ? 'motivo' : 'motivos'}
            <br />
            <a href={`/lugares/${l.id}`}>Ver ficha completa →</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

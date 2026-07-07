// Reglas tomadas literalmente del Apéndice N° 3

function calcularTamanio(ancho, alto) {
  if (ancho == null || alto == null) return null;
  const mayor = Math.max(Number(ancho), Number(alto));
  if (mayor <= 4.9) return 'Miniatura';
  if (mayor <= 9.9) return 'Pequeño';
  if (mayor <= 14.9) return 'Estándar';
  if (mayor <= 39.9) return 'Grande';
  return 'Muy grande';
}

function calcularCromatismo(coloresStr) {
  if (!coloresStr) return null;
  const colores = coloresStr
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  if (colores.length <= 1) return 'Monocromo';
  if (colores.length === 2) return 'Bicromo';
  return 'Policromo';
}

// Porcentajes establecidos sobre la altura total
const PORCENTAJES = {
  cabeza: 0.12,
  tronco: 0.28,
  piernas_pies: 0.6,
  brazos_manos: 0.45,
  organos_masc: 0.06,
};

function calcularProporcionalidad(alturaTotal, medidas) {
  // medidas: { cabeza, tronco, piernas_pies, brazos_manos, organos_masc } (longitudes ingresadas, opcionales)
  if (!alturaTotal) return null;
  let figurada = false;
  for (const parte of Object.keys(PORCENTAJES)) {
    const long = medidas[parte];
    if (long == null || long === '') continue;
    const esperado = alturaTotal * PORCENTAJES[parte];
    const desviacion = Math.abs(long - esperado) / esperado;
    if (desviacion > 0.10) {
      figurada = true;
      break;
    }
  }
  return figurada ? 'Figurada' : 'Real';
}

function calcularCategoriaOrganoSexualFemenino(cm) {
  if (cm == null || cm === '') return null;
  const v = Number(cm);
  if (v >= 9 && v <= 11) return 'Convencional';
  if (v < 9) return 'Minimizado';
  return 'Destacado';
}

module.exports = {
  calcularTamanio,
  calcularCromatismo,
  calcularProporcionalidad,
  calcularCategoriaOrganoSexualFemenino,
};

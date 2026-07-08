// Importa los datos del sistema anterior (SQL Server + Visual Basic) a partir de una
// "consulta plana" en Excel: una fila por motivo, con los datos de lugar, técnica y
// antropomorfo aplanados en las mismas columnas.
//
// Uso:
//   npm run import-legacy -- "/ruta/al/Consulta_plana_full.xlsx"
//
// Es seguro correrlo más de una vez: los lugares y motivos ya importados (identificados
// por su ID del sistema anterior) se detectan y se saltean.

require('dotenv').config({ path: '.env.local' });
const path = require('path');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const { calcularProporcionalidad } = require('../lib/calculos');

function limpiar(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number') return valor;
  const s = String(valor).trim();
  return s === '' ? null : s;
}

function capitalizar(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizarTipoTecnica(valor) {
  const s = limpiar(valor);
  if (!s) return null;
  const low = s.toLowerCase();
  if (low.startsWith('grab')) return 'grabado';
  if (low.startsWith('pint')) return 'pintura';
  if (low.startsWith('mix')) return 'mixta';
  return null;
}

function normalizarCromatismo(valor) {
  const s = limpiar(valor);
  if (!s) return null;
  const low = s.toLowerCase();
  if (low.includes('mono')) return 'Monocromo';
  if (low.includes('poli') || low.includes('polí')) return 'Policromo';
  if (low.includes('bi')) return 'Bicromo';
  return capitalizar(s);
}

function normalizarRepresentacion(valor) {
  const s = limpiar(valor);
  if (!s) return null;
  const low = s.toLowerCase();
  if (low.startsWith('complet')) return 'Completa';
  if (low.startsWith('parcial')) return 'Parcial';
  return capitalizar(s);
}

function numero(valor) {
  const v = limpiar(valor);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const archivo = process.argv[2];
  if (!archivo) {
    console.error('Uso: npm run import-legacy -- "/ruta/al/archivo.xlsx"');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL. Definila en .env.local o como variable de entorno.');
    process.exit(1);
  }

  const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: esLocal ? false : { rejectUnauthorized: false },
  });

  console.log(`Leyendo ${path.basename(archivo)}...`);
  const wb = XLSX.readFile(archivo);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`${filas.length} filas encontradas.`);

  const resumen = {
    lugaresCreados: 0,
    lugaresExistentes: 0,
    motivosCreados: 0,
    motivosExistentes: 0,
    tecnicasCreadas: 0,
    antropomorfosCreados: 0,
    filasSinLugar: 0,
    errores: [],
  };

  // --- 1. Lugares (agrupados por el ID legado, compartido por todos los motivos del sitio) ---
  const lugarPorLegacyId = new Map();
  for (const fila of filas) {
    const legacyId = numero(fila.id);
    if (legacyId == null) continue;
    if (!lugarPorLegacyId.has(legacyId)) {
      lugarPorLegacyId.set(legacyId, {
        legacy_id: legacyId,
        paraje: limpiar(fila.paraje),
        sitio: limpiar(fila.sitio),
        sigla_sitio: limpiar(fila.sigla),
        sector: limpiar(fila.sector),
      });
    }
  }

  const idLugarNuevo = new Map(); // legacy_id -> id nuevo en la base
  for (const lugar of lugarPorLegacyId.values()) {
    const existente = await pool.query('SELECT id FROM lugares WHERE legacy_id = $1', [
      lugar.legacy_id,
    ]);
    if (existente.rows[0]) {
      idLugarNuevo.set(lugar.legacy_id, existente.rows[0].id);
      resumen.lugaresExistentes++;
      continue;
    }
    const result = await pool.query(
      `INSERT INTO lugares (legacy_id, pais, paraje, sitio, sector, sigla_sitio)
       VALUES ($1,'Argentina',$2,$3,$4,$5) RETURNING id`,
      [lugar.legacy_id, lugar.paraje, lugar.sitio, lugar.sector, lugar.sigla_sitio]
    );
    idLugarNuevo.set(lugar.legacy_id, result.rows[0].id);
    resumen.lugaresCreados++;
  }
  console.log(
    `Lugares: ${resumen.lugaresCreados} nuevos, ${resumen.lugaresExistentes} ya existían.`
  );

  // --- 2. Motivos, técnicas y antropomorfos (uno por fila) ---
  for (const fila of filas) {
    const legacyLugarId = numero(fila.id);
    const legacyMotivoId = numero(fila.id_motivo);
    if (legacyLugarId == null || legacyMotivoId == null) {
      resumen.filasSinLugar++;
      continue;
    }
    const lugarId = idLugarNuevo.get(legacyLugarId);
    if (!lugarId) {
      resumen.filasSinLugar++;
      continue;
    }

    try {
      const yaExiste = await pool.query('SELECT id FROM motivos WHERE legacy_id = $1', [
        legacyMotivoId,
      ]);
      let motivoId;

      // Notas con información del sistema anterior que no tiene un campo directo en el nuevo modelo
      const notas = [];
      notas.push(`Importado del sistema anterior (ID legado ${legacyMotivoId}).`);
      if (limpiar(fila.complejidad)) notas.push(`Complejidad: ${limpiar(fila.complejidad)}.`);
      if (limpiar(fila.tipoG2)) {
        notas.push(
          `Grabado adicional: ${[fila.tipoG2, fila.topo2, fila.trazo2, fila.espesor2, fila.surco2]
            .map(limpiar)
            .filter(Boolean)
            .join(', ')}.`
        );
      }
      if (limpiar(fila.tipoG3)) {
        notas.push(
          `Tercer grabado: ${[fila.tipoG3, fila.topo3, fila.trazo3, fila.espesor3, fila.surco3]
            .map(limpiar)
            .filter(Boolean)
            .join(', ')}.`
        );
      }

      if (yaExiste.rows[0]) {
        motivoId = yaExiste.rows[0].id;
        resumen.motivosExistentes++;
      } else {
        const result = await pool.query(
          `INSERT INTO motivos
            (lugar_id, legacy_id, numero_motivo, clase, grupo, subgrupo, tipo,
             medida_ancho, medida_alto, ubicacion, tema, mantenimiento, reciclaje, notas_legado)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
          [
            lugarId,
            legacyMotivoId,
            numero(fila.NroMo),
            limpiar(fila.clase),
            limpiar(fila.grupo),
            limpiar(fila.subgrupo),
            limpiar(fila.tipo),
            numero(fila.cm_ancho),
            numero(fila.cm_alto),
            limpiar(fila.ubicacion),
            limpiar(fila.tema),
            limpiar(fila.Ma)?.toLowerCase() === 'si' ? 'Sí' : 'Ninguno',
            limpiar(fila.Re)?.toLowerCase() === 'si' ? 'Sí' : 'No',
            notas.join(' '),
          ]
        );
        motivoId = result.rows[0].id;
        resumen.motivosCreados++;
      }

      // --- Técnica ---
      const tipoTecnica = normalizarTipoTecnica(fila.tecnica);
      if (tipoTecnica) {
        const tecnicaExiste = await pool.query('SELECT id FROM tecnicas WHERE motivo_id = $1', [
          motivoId,
        ]);
        if (!tecnicaExiste.rows[0]) {
          await pool.query(
            `INSERT INTO tecnicas
              (motivo_id, tipo_tecnica, grabado_caracteristica, grabado_tipo, grabado_topografia,
               grabado_ancho_trazo, grabado_espesor, grabado_forma_surco,
               pintura_caracteristica, pintura_combinacion, pintura_cromatismo, mixta_orden)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
              motivoId,
              tipoTecnica,
              limpiar(fila.Caracteristica),
              limpiar(fila.tipoG),
              limpiar(fila.topo),
              limpiar(fila.trazo),
              limpiar(fila.espesor),
              limpiar(fila.surco),
              limpiar(fila.TipoP),
              limpiar(fila.Combinacion),
              normalizarCromatismo(fila.cromatismo),
              tipoTecnica === 'mixta' ? limpiar(fila.Orden) : null,
            ]
          );
          resumen.tecnicasCreadas++;
        }
      }

      // --- Antropomorfo ---
      const tieneAntropomorfo =
        limpiar(fila.genero) ||
        limpiar(fila.norma) ||
        limpiar(fila.representacion) ||
        limpiar(fila.cabeza) ||
        limpiar(fila.tronco) ||
        limpiar(fila.pierna) ||
        limpiar(fila.brazo) ||
        limpiar(fila.organos_sexuales) ||
        limpiar(fila.vestido) ||
        limpiar(fila.adorno);

      if (tieneAntropomorfo) {
        const antExiste = await pool.query('SELECT id FROM antropomorfos WHERE motivo_id = $1', [
          motivoId,
        ]);
        if (!antExiste.rows[0]) {
          const alturaTotal = numero(fila.cm_alto);
          const cabezaPresente = limpiar(fila.cabeza) === 'Si';
          const troncoPresente = limpiar(fila.tronco) === 'Si';
          const piernaPresente = limpiar(fila.pierna) === 'Si';
          const brazoPresente = limpiar(fila.brazo) === 'Si';
          const organos = limpiar(fila.organos_sexuales); // 'F' | 'M' | 'No' | null
          const mascPresente = organos === 'M';
          const femPresente = organos === 'F';

          const cabezaLong = cabezaPresente ? numero(fila.cm_cabeza) : null;
          const troncoLong = troncoPresente ? numero(fila.cm_tronco) : null;
          const piernaLong = piernaPresente ? numero(fila.cm_pierna) : null;
          const brazoLong = brazoPresente ? numero(fila.cm_brazos) : null;
          const genitalLong = mascPresente || femPresente ? numero(fila.cm_genital) : null;

          const proporcionalidad = alturaTotal
            ? calcularProporcionalidad(alturaTotal, {
                cabeza: cabezaLong,
                tronco: troncoLong,
                piernas_pies: piernaLong,
                brazos_manos: brazoLong,
                organos_masc: mascPresente ? genitalLong : null,
              })
            : null;

          await pool.query(
            `INSERT INTO antropomorfos
              (motivo_id, genero, norma, altura_total, representacion,
               cabeza_presente, cabeza_long, tronco_presente, tronco_long,
               piernas_pies_presente, piernas_pies_long, brazos_manos_presente, brazos_manos_long,
               organos_masc_presente, organos_masc_long, organos_fem_presente, organos_fem_long,
               proporcionalidad, tratamiento_cabeza, tratamiento_cuerpo, tratamiento_extremidades,
               vestido, adornos, organos_sex_masc_trat, organos_sex_fem_trat)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
            [
              motivoId,
              limpiar(fila.genero),
              limpiar(fila.norma),
              alturaTotal,
              normalizarRepresentacion(fila.representacion),
              cabezaPresente,
              cabezaLong,
              troncoPresente,
              troncoLong,
              piernaPresente,
              piernaLong,
              brazoPresente,
              brazoLong,
              mascPresente,
              mascPresente ? genitalLong : null,
              femPresente,
              femPresente ? genitalLong : null,
              proporcionalidad,
              capitalizar(limpiar(fila.morfo_cabeza)),
              capitalizar(limpiar(fila.morfo_cuerpo)),
              capitalizar(limpiar(fila.morfo_extremi)),
              capitalizar(limpiar(fila.vestido)),
              capitalizar(limpiar(fila.adorno)),
              mascPresente ? capitalizar(limpiar(fila.morfo_genital)) : null,
              femPresente ? capitalizar(limpiar(fila.morfo_genital)) : null,
            ]
          );
          resumen.antropomorfosCreados++;
        }
      }
    } catch (err) {
      resumen.errores.push(`Motivo legado ${legacyMotivoId}: ${err.message}`);
    }
  }

  console.log('\n=== Resumen de la importación ===');
  console.log(`Lugares nuevos:        ${resumen.lugaresCreados}`);
  console.log(`Lugares ya existentes: ${resumen.lugaresExistentes}`);
  console.log(`Motivos nuevos:        ${resumen.motivosCreados}`);
  console.log(`Motivos ya existentes: ${resumen.motivosExistentes}`);
  console.log(`Técnicas cargadas:     ${resumen.tecnicasCreadas}`);
  console.log(`Antropomorfos cargados:${resumen.antropomorfosCreados}`);
  console.log(`Filas sin lugar válido:${resumen.filasSinLugar}`);
  if (resumen.errores.length) {
    console.log(`\nErrores (${resumen.errores.length}):`);
    resumen.errores.slice(0, 20).forEach((e) => console.log(' -', e));
    if (resumen.errores.length > 20) console.log(`  ... y ${resumen.errores.length - 20} más.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

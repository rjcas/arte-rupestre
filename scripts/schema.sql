-- Esquema de base de datos - Sistema de Arte Rupestre
-- Basado en Apéndice N° 3 - Guía para el ingreso de datos de Arte Rupestre

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

-- I. Lugar
CREATE TABLE IF NOT EXISTS lugares (
  id SERIAL PRIMARY KEY,
  fecha DATE,
  pais TEXT,
  provincia TEXT,
  paraje TEXT,
  sitio TEXT,
  sector TEXT,
  conjunto_num TEXT,
  sigla_sitio TEXT,
  anios_campania TEXT,
  operadores TEXT,
  laboratorio TEXT,
  creado_por INTEGER REFERENCES usuarios(id),
  creado_en TIMESTAMP DEFAULT now()
);

-- II. Motivos
CREATE TABLE IF NOT EXISTS motivos (
  id SERIAL PRIMARY KEY,
  lugar_id INTEGER NOT NULL REFERENCES lugares(id) ON DELETE CASCADE,
  numero_motivo INTEGER,
  fuente TEXT, -- calco reducido, fotografía, dibujo, reconstrucción de laboratorio
  clase TEXT,  -- zoomorfos, geométricos, escenas, objetos, cubiertas, combinada
  grupo TEXT,  -- antropomorfos, animalomorfos, zooantropomorfos, elementos, figuras, etc.
  subgrupo TEXT,
  tipo TEXT,
  medida_ancho NUMERIC,
  medida_alto NUMERIC,
  ubicacion TEXT, -- arriba-izquierda ... abajo-derecha
  tema TEXT,
  mantenimiento TEXT, -- repintado / regrabado
  reciclaje TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

-- III. Técnicas
CREATE TABLE IF NOT EXISTS tecnicas (
  id SERIAL PRIMARY KEY,
  motivo_id INTEGER UNIQUE NOT NULL REFERENCES motivos(id) ON DELETE CASCADE,
  tipo_tecnica TEXT CHECK (tipo_tecnica IN ('grabado','pintura','mixta')),
  -- Grabado / Raspado / Incisión / Horadación
  grabado_caracteristica TEXT, -- homogéneo / heterogéneo
  grabado_tipo TEXT,           -- Picado, Raspado, Incisión, Horadación
  grabado_topografia TEXT,     -- Lineal, Perimetral, Areal-Superficial
  grabado_ancho_trazo TEXT,    -- Fino, Grueso
  grabado_espesor TEXT,        -- Superficial, Profundo
  grabado_forma_surco TEXT,    -- U, V
  -- Pintura
  pintura_caracteristica TEXT, -- plana, lineal, punteado, combinada
  pintura_combinacion TEXT,    -- plano y lineal, plano y punteado, lineal y punteado, plano-lineal-punteado
  pintura_colores TEXT,
  pintura_cromatismo TEXT,     -- monocromo/bicromo/policromo (calculado)
  -- Mixta
  mixta_orden TEXT,            -- grabado sobre pintado, pintura sobre grabado, grabado sobre grabado, grabado y pintado
  creado_en TIMESTAMP DEFAULT now()
);

-- IV. Antropomorfos
CREATE TABLE IF NOT EXISTS antropomorfos (
  id SERIAL PRIMARY KEY,
  motivo_id INTEGER UNIQUE NOT NULL REFERENCES motivos(id) ON DELETE CASCADE,
  genero TEXT, -- masculino, femenino, indeterminado
  norma TEXT,  -- frontal, lateral, no determinada
  altura_total NUMERIC,
  representacion TEXT, -- parcial, completa
  cabeza_presente BOOLEAN DEFAULT false,
  cabeza_long NUMERIC,
  tronco_presente BOOLEAN DEFAULT false,
  tronco_long NUMERIC,
  piernas_pies_presente BOOLEAN DEFAULT false,
  piernas_pies_long NUMERIC,
  brazos_manos_presente BOOLEAN DEFAULT false,
  brazos_manos_long NUMERIC,
  organos_masc_presente BOOLEAN DEFAULT false,
  organos_masc_long NUMERIC,
  organos_fem_presente BOOLEAN DEFAULT false,
  organos_fem_long NUMERIC,
  proporcionalidad TEXT, -- real / figurada (calculado)
  tratamiento_cabeza TEXT,
  tratamiento_cuerpo TEXT,
  tratamiento_extremidades TEXT,
  vestido TEXT,
  adornos TEXT,
  organos_sex_masc_trat TEXT,
  organos_sex_fem_trat TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

-- V. Operaciones Cognitivas
CREATE TABLE IF NOT EXISTS operaciones_cognitivas (
  id SERIAL PRIMARY KEY,
  motivo_id INTEGER NOT NULL REFERENCES motivos(id) ON DELETE CASCADE,
  clase_operacion TEXT,
  posicion TEXT,
  direccion TEXT,
  apendices TEXT,
  angularidad TEXT,
  motivo_vinculado_id INTEGER REFERENCES motivos(id),
  creado_en TIMESTAMP DEFAULT now()
);

-- VI. Conjunto (qué motivos integran un conjunto dentro de un lugar/sector)
CREATE TABLE IF NOT EXISTS conjunto_motivos (
  id SERIAL PRIMARY KEY,
  lugar_id INTEGER NOT NULL REFERENCES lugares(id) ON DELETE CASCADE,
  motivo_id INTEGER NOT NULL REFERENCES motivos(id) ON DELETE CASCADE,
  UNIQUE(lugar_id, motivo_id)
);

CREATE INDEX IF NOT EXISTS idx_motivos_lugar ON motivos(lugar_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_motivo ON operaciones_cognitivas(motivo_id);
CREATE INDEX IF NOT EXISTS idx_conjunto_lugar ON conjunto_motivos(lugar_id);

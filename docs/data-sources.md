# De dónde sale cada dato

Mapa completo de página → dato → fuente → grado de reutilización. Es el inventario que
responde a dos preguntas: "¿de dónde sale esta cifra?" y "¿funcionará en mi municipio?".
Cada página cita además su fuente al pie (componente `SourceNote`), con enlace y licencia.

## Grados de reutilización

- **Universal**: funciona para cualquier municipio de España solo con el código INE de la
  configuración. Sin tocar código.
- **Universal, con registro por provincia**: la fuente publica una tabla por provincia sin
  fórmula conocida para deducir su id; los ids verificados se registran en
  `packages/datos`. Añadir tu provincia es una línea.
- **Universal, con extracto**: la fuente cubre toda España pero su formato de publicación
  impide consultarla en vivo; un script del repositorio extrae lo de tu municipio a un
  JSON pequeño que se declara en la configuración.
- **Autonómico**: se activa según la comunidad declarada en la configuración
  (`region: "andalucia"` hoy); otro territorio necesita su conector.
- **Configuración**: funciona en cualquier sitio, pero hay que declarar un dato en la
  config (una estación, una URL de feed).
- **Adaptador municipal**: archivos que cada ayuntamiento publica a su manera, sin
  formato estándar. Cada municipio escribe su adaptador (`*-chiclana.ts`) y lo declara en
  `datasets`. Sin adaptador, la sección no aparece y nada se rompe.

## Página a página

| Página | Dato | Fuente | Conector | Reutilización |
|---|---|---|---|---|
| /demografia | Población oficial 1996-hoy | INE, Cifras oficiales de población | `ine.ts` | Universal, con registro por provincia |
| /demografia | Pirámide de población | INE, Censo Anual | `ine-census.ts` | Universal |
| /demografia | Natalidad, mortalidad, nupcialidad, esperanza de vida | INE, Indicadores Demográficos Básicos | `ine-indicators.ts` | Universal (solo municipios >75.000 hab) |
| /demografia | Migraciones | INE, EMCR | `ine-migrations.ts` | Universal, con registro por provincia |
| /demografia | Nivel de estudios | INE, Censo Anual | `ine-census.ts` | Universal |
| /demografia | Población por distrito y sección | Padrón del Ayuntamiento (CKAN) | `padron.ts` + `padron-chiclana.ts` | Adaptador municipal |
| /demografia | Contornos de secciones (mapa) | Callejero del Ayuntamiento (KMZ, convertido una vez) | `sectionBoundaries` en config | Configuración |
| /demografia | Zonas y buscador de calles | Callejero oficial del Ayuntamiento | `streets.ts` + `streets-chiclana.ts` | Adaptador municipal |
| /paro | Paro registrado mensual desde 2006, por sexo, edad y sector | SEPE, datos abiertos | `sepe-employment.ts` | Universal |
| /paro | Contratos mensuales e indefinidos | SEPE, datos abiertos | `sepe-employment.ts` | Universal |
| /renta | Renta neta media y mediana, por municipio, distrito y sección | INE, Atlas de Distribución de Renta de los Hogares | `ine-income.ts` | Universal, con registro por provincia |
| /vivienda | Alquiler mediano (piso, casa, m²), por municipio y sección | SERPAVI, Ministerio de Vivienda | script `extract-serpavi.mjs` → `rentPrices` en config | Universal, con extracto (edición anual) |
| /transporte | Líneas, paradas y salidas de autobús | Feed GTFS declarado en config (Chiclana: CTAN, datos abiertos) | `gtfs.ts` | Configuración (formato universal) |
| /turismo | Viajeros y pernoctaciones hoteleras | INE, Encuesta de Ocupación Hotelera | `ine-tourism.ts` | Universal (solo puntos turísticos encuestados) |
| /turismo | Ocupación mensual y visitantes de oficinas | Ayuntamiento (CKAN) | `tourism.ts` + `tourism-chiclana.ts` | Adaptador municipal |
| /clima | Predicción 7 días | AEMET OpenData | `aemet.ts` | Universal (clave gratuita) |
| /clima | Ahora mismo y playa | AEMET OpenData | `aemet.ts` | Configuración (estación y playa) |
| /mapa | Equipamientos públicos | OpenStreetMap (Overpass) | `osm-equipment.ts` | Universal |
| /mapa | Mapa base | OpenFreeMap | `municipal-map.tsx` | Universal |
| /presupuestos | Presupuesto por capítulos | Ayuntamiento (CKAN) | `budget.ts` + `budget-chiclana.ts` | Adaptador municipal (excepción documentada: Hacienda no publica formato reutilizable) |
| /deuda | Deuda viva 2010-hoy | Ministerio de Hacienda | `hacienda-debt.ts` | Universal |
| /contratos-menores | Contratos menores trimestrales | Ayuntamiento (CKAN) | `contracts.ts` + `contracts-chiclana.ts` | Adaptador municipal |
| /boja | Disposiciones que mencionan al municipio | BOJA (contentapi de la Junta) | `junta-boja.ts` | Autonómico (Andalucía) |

## La regla que ordena todo esto

Universal primero: ante datos equivalentes, siempre la fuente estatal o autonómica antes
que los archivos del ayuntamiento. Lo municipal solo cuando aporta algo que no existe
fuera, y siempre como adaptador con el municipio en el nombre. La regla, sus excepciones
y el porqué están en las reglas del repositorio y, con más detalle histórico, en el plan
del proyecto.

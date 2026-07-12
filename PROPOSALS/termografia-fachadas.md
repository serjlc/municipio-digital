# Termografía de fachadas

**Estado**: primera fase publicada (12 de julio de 2026) en
[/proyectos/termografia-fachadas](https://municipio-digital.vercel.app/proyectos/termografia-fachadas);
la extensión con cámara térmica busca impulso
**Quién la propone**: el mantenedor del portal, como propuesta fundacional

## Qué es, en dos frases

Un mapa del calor que sufren los edificios de Chiclana: la temperatura superficial medida
por satélite, sección censal a sección censal, cruzada con la edad de la edificación según
el Catastro. La extensión con cámara térmica baja del mapa por zonas a la fachada concreta.

## Por qué le interesa al municipio

Chiclana supera los 40 grados varios días al año y buena parte de su parque edificado se
construyó antes de que existiera normativa de aislamiento. La pregunta que responde es
directa: ¿dónde golpea más el calor, y coincide con las zonas de edificios más antiguos?
Ese dato condiciona desde las ayudas a la rehabilitación hasta la factura de la luz de
cada casa.

## Qué hay publicado (primera fase)

- **El dataset**: temperatura superficial media del verano de 2025 y año mediano de
  construcción para las 52 secciones censales, calculado sobre 9 pasadas de Landsat 8 y 9
  y 25.677 edificios del Catastro
  ([chiclana-heat.json](../packages/municipio/src/chiclana-heat.json)).
- **La página**: mapa coroplético, tabla completa y el cruce por décadas de construcción,
  en `/proyectos/termografia-fachadas`.
- **El script**: [extract-heat.mjs](../packages/datos/scripts/extract-heat.mjs), universal.
  Cualquier municipio con contornos de secciones genera su dataset ejecutándolo con su
  código INE; las dos fuentes son estatales o globales y no piden clave ni registro.

Lo que la primera fase no puede decir: la temperatura de un edificio concreto. El píxel
térmico de Landsat mide 100 metros (se distribuye remuestreado a 30), así que el mapa
distingue zonas, no fachadas. Ese salto de escala es exactamente la extensión con cámara.

## Qué datos usa

| Dato | Fuente | Licencia | Fase |
|---|---|---|---|
| Temperatura superficial | Landsat Collection 2 Level-2 (USGS/NASA), vía Microsoft Planetary Computer | Dominio público | Publicada |
| Año de construcción de cada edificio | Catastro (descargas INSPIRE de edificios) | Reutilización con atribución | Publicada |
| Contornos de las secciones censales | Callejero del Ayuntamiento (ya convertidos en este portal) | ODC-By | Publicada |
| Temperatura ambiente oficial en el momento de la medición | AEMET OpenData (la misma estación que usa la página del clima) | © AEMET | Extensión |
| Índice de vegetación (NDVI), para cruzar calor con arbolado | Copernicus / Sentinel-2 | Libre con atribución | Posible extensión |

## Qué datos genera

- **Primera fase (publicada)**: por sección censal, temperatura superficial media del
  verano, año mediano de construcción y número de edificios. JSON en el repositorio,
  con las escenas usadas identificadas para que el cálculo sea reproducible.
- **Campos por medición (extensión con cámara)**: fecha y hora, coordenadas, orientación
  de la fachada (N/S/E/O), material visible (enfoscado, ladrillo, piedra, chapa),
  temperatura superficial medida, temperatura ambiente oficial en ese momento (cruce
  automático con AEMET), modelo de cámara y emisividad configurada, año de construcción
  del edificio (cruce con Catastro).
- **Formato y publicación**: datasets en el repositorio más la visualización en el portal.
- **Licencia**: ODC-By para lo publicado; la extensión hereda la misma.

## Metodología

### Primera fase (la implementada)

- Se toman todas las pasadas de Landsat 8 y 9 sobre el municipio entre junio y agosto con
  menos de un 10 % de nubes (en 2025 fueron 9, todas alrededor de las 13:00 hora local).
- De cada pasada se lee la banda de temperatura superficial; los píxeles marcados como
  nube o sombra por la máscara de calidad se descartan y el resto se asigna a su sección
  censal por posición.
- La temperatura de una sección es la media de sus píxeles, promediada entre pasadas. Una
  pasada solo cuenta para una sección si cubre al menos la mitad de los píxeles que ve la
  mejor pasada, para que un recorte de nube no sesgue la media.
- El año de una sección es la mediana de los años de fin de construcción de sus edificios
  en estado funcional según el Catastro.
- El cruce entre décadas de construcción y temperatura se publica advirtiendo lo que
  mezcla: edad de la edificación y geografía (las secciones junto al mar son también las
  más recientes). Separar ambos efectos requiere la extensión de campo.

### Extensión con cámara térmica

Estas reglas son las que harían cada medición comparable y creíble:

- Se mide en días de calor (máxima prevista de 32 grados o más), entre las 16:00 y las
  19:00, cuando la fachada acumula la radiación del día.
- Cada medición registra la fachada completa a una distancia de entre 5 y 15 metros, con
  la emisividad de la cámara fijada en 0,95 (superficies de obra) y anotada.
- La variable de interés no es la temperatura absoluta sino el **sobrecalentamiento**: la
  diferencia entre la superficie medida y la temperatura ambiente oficial de AEMET en esa
  hora. Eso permite comparar mediciones de días distintos.
- El cruce con Catastro asigna a cada medición el año de construcción; el análisis
  publica la correlación antigüedad-sobrecalentamiento por décadas de construcción.
- Las mediciones con condiciones anómalas (fachada regada, toldo, sombra parcial) se
  registran igualmente con su anotación y se excluyen del análisis principal.
- El mapa satelital publicado ordena el trabajo: las secciones más calientes primero.

## Maneras de extenderlo

En orden de exigencia:

1. **Repetir la extracción cada verano**: el script queda listo; cada ejecución añade un
   año a la serie y permite ver si la brecha entre zonas crece o se corrige.
2. **Cruzar con el arbolado**: el índice de vegetación de Sentinel-2 (NDVI) sobre las
   mismas secciones conecta este proyecto con la propuesta del
   [inventario del arbolado](inventario-arbolado.md): dónde hay calor y falta sombra.
3. **La cámara térmica**: la única manera de pasar de la zona al edificio concreto, con
   la metodología de arriba. Requiere una cámara térmica de móvil (60 a 300 euros según
   modelo), que puede rotar entre participantes.

## Privacidad

La primera fase no captura personas: son datos de satélite y del Catastro. En la
extensión, las imágenes térmicas se capturan sin personas; si alguien aparece, la foto se
descarta antes de subir nada. Se fotografían fachadas desde la vía pública, nunca
interiores ni patios. No se registra quién vive dónde: la unidad es el edificio, no el
hogar.

## Quién lo mantiene

La primera fase la mantiene el portal: ejecutar el script una vez al año y commitear el
resultado. La extensión con cámara busca impulsor: el portal aporta la infraestructura
(mapa, cruces con AEMET y Catastro, publicación del dataset) y la revisión técnica; el
impulsor coordina las mediciones y responde por la metodología en campo. Si la extensión
se detiene, lo publicado queda disponible con su fecha bien visible.

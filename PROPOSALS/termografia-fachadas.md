# Termografía de fachadas

**Estado**: buscando impulso (propuesta de ejemplo: la metodología está pensada y el
portal tiene lista la infraestructura; falta gente con tiempo y una cámara térmica)
**Quién la propone**: el mantenedor del portal, como propuesta fundacional

## Qué es, en dos frases

Un registro ciudadano de temperaturas de fachadas medidas con cámara térmica de móvil,
cruzado con la edad de cada edificio según el Catastro. Un vecino verá un mapa de qué
edificios de Chiclana se defienden del calor y cuáles lo sufren, y podrá buscar el suyo.

## Por qué le interesa al municipio

Chiclana supera los 40 grados varios días al año y buena parte de su parque edificado se
construyó antes de que existiera normativa de aislamiento. La pregunta que responde es
directa: ¿cuánto peor aguantan el calor los edificios antiguos que los nuevos, y dónde
están? Ese dato no existe hoy a escala de edificio, y condiciona desde las ayudas a la
rehabilitación hasta la factura de la luz de cada casa.

## Qué datos usa

| Dato | Fuente | Licencia |
|---|---|---|
| Año de construcción de cada edificio | Catastro (servicios OVC/INSPIRE) | Reutilización con atribución |
| Temperatura ambiente oficial en el momento de la medición | AEMET OpenData (estación más cercana, la misma que usa la página del clima) | © AEMET |
| Temperatura superficial por satélite (fase 1, sin hardware) | Copernicus / Sentinel | Libre con atribución |
| Callejero y edificios base | OpenStreetMap | ODbL |

## Qué datos genera

- **Campos por medición**: fecha y hora, coordenadas, orientación de la fachada (N/S/E/O),
  material visible (enfoscado, ladrillo, piedra, chapa), temperatura superficial medida,
  temperatura ambiente oficial en ese momento (cruce automático con AEMET), modelo de
  cámara y emisividad configurada, año de construcción del edificio (cruce con Catastro).
- **Formato y publicación**: CSV en el repositorio más la visualización en el portal.
- **Licencia**: ODbL, compatible con el cruce con OpenStreetMap.

## Metodología

La metodología es lo que hace cada medición comparable y creíble.

- Se mide en días de calor (máxima prevista de 32 grados o más), entre las 16:00 y las
  19:00, cuando la fachada acumula la radiación del día.
- Cada medición registra la fachada completa a una distancia de entre 5 y 15 metros, con
  la emisividad de la cámara fijada en 0,95 (superficies de obra) y anotada.
- La variable de interés no es la temperatura absoluta sino el **sobrecalentamiento**: la
  diferencia entre la superficie medida y la temperatura ambiente oficial de AEMET en esa
  hora. Eso permite comparar mediciones de días distintos.
- El cruce con Catastro asigna a cada medición el año de construcción; el análisis
  publica la correlación antigüedad-sobrecalentamiento por décadas de construcción.
- **Fase 1 sin hardware**: antes de la primera cámara, el proyecto ya puede publicar el
  mapa de temperatura superficial urbana con datos de satélite de Copernicus, que
  identifica las zonas prioritarias donde medir a pie.
- Las mediciones con condiciones anómalas (fachada regada, toldo, sombra parcial) se
  registran igualmente con su anotación y se excluyen del análisis principal.

## Privacidad

Las imágenes térmicas se capturan sin personas; si alguien aparece, la foto se descarta
antes de subir nada. Se fotografían fachadas desde la vía pública, nunca interiores ni
patios. No se registra quién vive dónde: la unidad es el edificio, no el hogar.

## Qué hace falta

- Una cámara térmica de móvil (60 a 300 euros según modelo; con una basta para empezar y
  puede rotar entre participantes).
- Unos 3 minutos por medición. Con una tarde al mes entre dos personas salen 40 a 60
  edificios mensuales.
- Ningún conocimiento previo: la guía de medición forma parte del proyecto.

## Quién lo mantiene

Busca impulsor. El portal aporta la infraestructura (mapa, cruces con AEMET y Catastro,
publicación del dataset) y la revisión técnica de los datos; el impulsor coordina las
mediciones y responde por la metodología en campo. Si el proyecto se detiene, el dataset
publicado queda disponible con su fecha de última actualización bien visible.

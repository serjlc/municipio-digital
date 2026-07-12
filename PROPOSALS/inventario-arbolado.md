# Inventario ciudadano del arbolado

**Estado**: buscando impulso (propuesta de ejemplo: metodología pensada e infraestructura
lista; falta quien coordine y ejecute el trabajo de campo)
**Quién la propone**: el mantenedor del portal, como propuesta fundacional

## Qué es, en dos frases

Un censo ciudadano de los árboles de Chiclana: la posición, especie y estado de cada
árbol en espacio público, hecho a pie y calle a calle. Un vecino verá cuánta sombra tiene
su barrio, de qué especies, y qué zonas del municipio están más desnudas frente al calor.

## Por qué le interesa al municipio

Es la otra cara de la termografía de fachadas: si aquella mide dónde golpea el calor,
esta mide dónde está (y dónde falta) el remedio más barato contra él. El Ayuntamiento no
publica ningún inventario de arbolado en su portal de datos abiertos, así que la pregunta
"¿cuántos árboles tiene mi calle y quién tiene menos sombra que nadie?" hoy no tiene
respuesta. Con el padrón por secciones que ya publica este portal, el proyecto puede
calcular árboles por habitante en cada distrito.

## Qué datos usa

| Dato | Fuente | Licencia |
|---|---|---|
| Callejero y posiciones base | OpenStreetMap | ODbL |
| Contornos de distritos y secciones | Callejero del Ayuntamiento (ya convertidos en este portal) | ODC-By |
| Población por sección, para árboles por habitante | Padrón municipal (ya en el portal) | ODC-By |
| Índice de vegetación por satélite, para contraste | Copernicus / Sentinel (NDVI) | Libre con atribución |

## Qué datos genera

- **Campos por árbol**: posición GPS, especie (o "sin identificar", que también es un
  dato), estado (sano, poda severa, seco, alcorque vacío), fecha y foto.
- **Campos opcionales (extensión de medición)**: perímetro del tronco a 1,30 metros del
  suelo, altura estimada por rangos, diámetro de copa estimado por rangos.
- **Formato y publicación**: CSV en el repositorio y, además, cada árbol se sube a
  OpenStreetMap (`natural=tree` con sus atributos), de modo que el dato beneficia a
  cualquier mapa del mundo, no solo a este portal. El mapa del portal ya sabe pintar datos
  de OSM, así que los árboles censados aparecen sin código nuevo.
- **Licencia**: ODbL, la misma de OpenStreetMap, que es condición para poder subirlos allí.

## Metodología

- La unidad es el árbol en espacio público (calles, plazas, parques). Los alcorques
  vacíos se registran también: la sombra que falta es tan informativa como la que hay.
- El censo consiste en ubicar cada árbol: posición, especie, estado y foto, sin medir
  nada. La medición (perímetro del tronco, altura y copa) es una extensión opcional;
  cada sección declara si la incluye.
- La especie se identifica con ayuda de una app de reconocimiento y la confirma otra
  persona del proyecto antes de publicarse; en la duda queda como "sin identificar", nunca
  se inventa.
- En la extensión de medición, el perímetro se mide con cinta métrica a 1,30 metros del
  suelo (la convención forestal estándar), y altura y copa se estiman por rangos (menos
  de 4 m, 4 a 8, 8 a 15, más de 15).
- Se trabaja por secciones censales, en el orden que marque el mapa de calor satelital:
  primero las zonas con menos verde. Cada sección se publica desde el primer árbol,
  marcada como "parcial" hasta recorrerla entera; así "cero árboles" en una sección
  completa significa cero, y no "aún no hemos pasado".

## Privacidad

Se fotografían árboles, no personas: si alguien sale en la foto, se repite o se descarta.
Sin matrículas legibles. Los árboles de patios y jardines privados no se censan aunque se
vean desde la calle.

## Qué hace falta

- Material: un móvil con GPS; la extensión de medición requiere además una cinta
  métrica.
- No exige conocimiento previo; la guía de campo forma parte del proyecto.

## Quién lo mantiene

Busca impulsor. El portal aporta el mapa, los cruces con el padrón y la publicación del
dataset; el impulsor coordina las salidas y la verificación de especies. Al vivir el dato
también en OpenStreetMap, este proyecto tiene una ventaja: aunque se detenga, lo censado
sigue vivo y mantenido por la comunidad de OSM.

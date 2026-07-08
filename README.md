# Municipio Digital

Servicios digitales ciudadanos, reutilizables por cualquier municipio.

La idea es simple: los datos públicos sobre tu pueblo ya existen, pero están repartidos por
mil portales y cuesta encontrarlos y entenderlos. Este proyecto los junta, los presenta bien
y además sirve de hogar para proyectos ciudadanos que generan información nueva sobre el
municipio.

El despliegue de referencia es Chiclana de la Frontera. El framework y la web de Chiclana se
desarrollan a la vez en este repositorio, pero nada de Chiclana está metido a fuego en el
código: otro municipio solo necesita escribir su propio archivo de configuración.

La inspiración viene de [island.is](https://github.com/island-is/island.is), el monorepo de
servicios digitales de Islandia. De ahí tomamos la filosofía (monorepo, design system propio,
todo abierto y documentado), no su infraestructura, que está pensada para un equipo enorme.

## Por qué

La información pública debería poder entenderse sin pelearse con PDFs ni catálogos de datos.
Con las herramientas actuales, cualquier persona puede construir servicios de información de
calidad sin esperar a que lo haga una administración. Este repositorio quiere demostrarlo, y
hacerlo con respeto: consume datos oficiales por sus APIs, cita la fuente en cada página y
devuelve datos nuevos en abierto.

Esa última parte importa. Cuando un proyecto ciudadano genera mediciones propias (un
inventario de arbolado, la termografía de fachadas que tenemos como piloto), el dataset
resultante se publica abierto y con su metodología documentada. Aquí no solo se consumen
datos abiertos: también se producen.

Dos cosas que este proyecto no es: no es una web oficial ni tiene relación con el
Ayuntamiento de Chiclana, y no aloja datos personales ni trámites que requieran identificarse
ante la administración.

## Estructura del repositorio

```
apps/
  web/                  Portal principal (Next.js)
packages/
  ui/                   Design system compartido (@municipio/ui)
  datos/                Conectores tipados a APIs públicas (@municipio/datos)
  municipio/            Configuración del municipio (@municipio/config)
  db/                   Esquemas de base de datos, solo para proyectos que la necesiten
proyectos/              Manifiesto y documentación de cada proyecto ciudadano
PROPOSALS/              Propuestas de nuevos proyectos
docs/                   Arquitectura, metodologías, guías
```

## Stack

| Herramienta | Papel | Documentación |
|---|---|---|
| [TypeScript](https://www.typescriptlang.org/docs/) | Lenguaje único de todo el repositorio | typescriptlang.org |
| [pnpm](https://pnpm.io/es/) | Gestor de paquetes y workspaces del monorepo | pnpm.io |
| [Turborepo](https://turborepo.com/docs) | Orquestador del monorepo | turborepo.com |
| [Next.js](https://nextjs.org/docs) (App Router) | Framework web del portal | nextjs.org |
| [React](https://es.react.dev/) | Librería de UI | es.react.dev |
| [Tailwind CSS](https://tailwindcss.com/docs) | Estilos del design system | tailwindcss.com |
| [Zod](https://zod.dev/) | Validación de las respuestas de APIs públicas | zod.dev |
| [Observable Plot](https://observablehq.com/plot/) | Gráficas | observablehq.com/plot |
| [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) | Mapas, sin servicios de pago | maplibre.org |
| [Drizzle ORM](https://orm.drizzle.team/docs/overview) | Esquemas y migraciones de base de datos | orm.drizzle.team |
| [PostgreSQL](https://www.postgresql.org/docs/) en [Neon](https://neon.com/docs/introduction) | Base de datos, solo si un proyecto la necesita | postgresql.org |
| [Vitest](https://vitest.dev/guide/) | Tests | vitest.dev |
| [ESLint](https://eslint.org/docs/latest/) y [Prettier](https://prettier.io/docs/) | Linting y formato | eslint.org |
| [GitHub Actions](https://docs.github.com/es/actions) | Integración continua | docs.github.com |
| [Vercel](https://vercel.com/docs) | Hosting, previews por PR, variables de entorno | vercel.com/docs |

## Fuentes de datos

| Nivel | Fuente | Acceso |
|---|---|---|
| Municipal | [Datos abiertos de Chiclana](https://datosabiertos.chiclana.es) | API CKAN |
| Autonómico | [Datos abiertos de la Junta de Andalucía](https://www.juntadeandalucia.es/datosabiertos/portal/) | CKAN y APIs REST con OpenAPI |
| Autonómico | [SIMA, del IECA](https://www.juntadeandalucia.es/institutodeestadisticaycartografia/sima/) | Estadística multiterritorial |
| Estatal | [datos.gob.es](https://datos.gob.es), INE, AEMET OpenData, Catastro | APIs públicas |
| Otros | OpenStreetMap, Copernicus/Sentinel | APIs públicas |

Casi todos estos datasets se publican con licencia CC BY o equivalente: se pueden reutilizar
citando la procedencia. Por eso cada página que muestra datos lleva su atribución, y por eso
preferimos siempre la API oficial antes que el scraping.

## Convenciones

Sobre el código:

- TypeScript en todo el repositorio.
- Código, commits y nombres de archivo en inglés. Documentación, UI y contenido en español.
- Los conectores de `packages/datos` son genéricos: reciben la configuración del municipio y
  no contienen valores de Chiclana.
- Mejor páginas estáticas o con ISR que peticiones en vivo: la web va más rápida y no
  machacamos las APIs públicas.
- Comentarios solo cuando expliquen algo que el código no puede decir por sí mismo.

Sobre las credenciales, la política es tener las mínimas posibles:

- Por defecto, ninguna. Casi todas las fuentes (CKAN, INE, SIMA, Catastro, OSM) funcionan sin
  clave. Clonar el repo y ejecutar `pnpm dev` no requiere configurar nada.
- Las pocas claves que hacen falta (la de AEMET, que es gratuita, y la conexión a base de
  datos) viven solo como variables de entorno en Vercel, gestionadas por el mantenedor.
- `.env.example` documenta cada variable y cómo conseguir una clave propia para desarrollo.
  Si falta una variable, la página afectada muestra un aviso en lugar de romper el build.

Sobre la base de datos:

- La mayoría de los proyectos no la necesitan: leen APIs públicas y cachean.
- Para los que sí (registros generados por vecinos), hay una única instancia Postgres con un
  schema por proyecto. Una sola credencial, aislamiento entre proyectos, y si un proyecto
  crece mucho se puede mudar a su propia instancia exportando su schema.
- Los esquemas y migraciones viven en `packages/db` y se revisan en PR como cualquier código.
  Para desarrollar en local basta un Postgres en Docker; nadie desarrolla contra producción.
- Todo acceso a base de datos ocurre en el servidor. El navegador nunca la toca.

## Proponer un proyecto ciudadano

1. Abre un PR añadiendo un documento corto a `PROPOSALS/`: qué es, por qué le interesa al
   municipio, qué datos usa o genera, implicaciones de privacidad y quién lo va a mantener.
2. Se revisa con criterios públicos: interés general, licencias de datos compatibles, nada de
   datos personales sin base legal (RGPD), y metodología documentada si genera mediciones.
3. Si se aprueba, se desarrolla en `apps/web/app/proyectos/`. Cada PR genera un preview
   deploy, así que se puede revisar funcionando antes de publicar.
4. Al publicarse aparece en el índice de proyectos y, si genera datos, el dataset se libera.

## Usarlo en otro municipio

Toda la especificidad local vive en `packages/municipio`: nombre, código INE, coordenadas y
portal de datos local. Con el código INE funcionan solas las fuentes estatales (INE, AEMET,
Catastro), los conectores autonómicos se activan según la comunidad, y el conector CKAN vale
para cualquier portal municipal basado en CKAN, que es el estándar de facto en España.

Para adaptarlo: haz un fork, crea tu archivo en `packages/municipio/src/` y despliega.

## Glosario

Protocolos y estándares que aparecen por el repositorio, por si alguno te pilla de nuevas:

- [CKAN](https://docs.ckan.org/): software libre para publicar catálogos de datos abiertos.
  Lo usan Chiclana, la Junta, datos.gob.es y media Europa. Todo portal CKAN expone la misma
  [API REST](https://docs.ckan.org/en/latest/api/), así que un solo cliente sirve para
  cientos de portales.
- [OpenAPI](https://spec.openapis.org/oas/latest.html): formato estándar para describir una
  API REST en un archivo JSON o YAML. La Junta publica así sus APIs, lo que permite generar
  clientes tipados.
- [JSON-stat](https://json-stat.org/): formato JSON para datos estadísticos. Es lo que
  devuelve la [API del INE](https://www.ine.es/dyngs/DAB/index.htm?cid=1099); compacto pero
  peculiar, por eso el conector lo traduce a estructuras simples.
- [WFS](https://www.ogc.org/standards/wfs/) e [INSPIRE](https://knowledge-base.inspire.ec.europa.eu/index_en):
  el estándar OGC para servir datos geográficos y la directiva europea que obliga a
  publicarlos armonizados. Así sirve el
  [Catastro](https://www.catastro.hacienda.gob.es/webinspire/index.html) los edificios, con
  su geometría y año de construcción.
- [ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration): técnica de
  Next.js por la que las páginas se generan estáticas y se regeneran en segundo plano cada
  cierto tiempo. Datos frescos sin bombardear las APIs en cada visita.
- [Licencias Creative Commons](https://creativecommons.org/licenses/?lang=es): la mayoría de
  datasets públicos españoles son CC BY, libres de reutilizar citando la fuente.
- [RGPD](https://www.aepd.es/guias-y-herramientas/guias): el reglamento europeo de protección
  de datos. Marca la línea roja de los proyectos ciudadanos: nada de datos personales sin
  base legal.

## Licencia

[MIT](LICENSE). Los datos consumidos conservan la licencia de su fuente original y los
datasets generados por los proyectos de este repositorio se publican como datos abiertos.

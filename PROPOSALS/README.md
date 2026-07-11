# Propuestas de proyectos ciudadanos

Aquí empieza todo proyecto ciudadano del portal: con un documento corto que cualquiera
puede leer, discutir y mejorar antes de que exista una sola línea de código.

## Cómo proponer

1. Copia `PLANTILLA.md` con un nombre corto para tu proyecto (en minúsculas y sin tildes,
   porque acabará siendo su URL: `inventario-arbolado.md`).
2. Rellénala. No hace falta que esté todo resuelto; sí que esté todo pensado.
3. Abre un pull request. La conversación pública del PR es la revisión.
4. Si se aprueba, el proyecto se desarrolla en `apps/web/src/app/proyectos/` con su
   manifiesto en `proyectos/`, y cada PR genera un preview para verlo funcionando.

## Qué hace que una propuesta se apruebe

Ninguna propuesta llega perfecta, y no hace falta: la conversación del PR sirve para
pulirla entre todos. Esto es lo que se mira:

- **Interés público**: aporta información sobre el municipio que hoy no existe o no se
  entiende. La mejor señal es que responda a una pregunta que los vecinos ya se hacen.
- **Datos de entrada con licencia compatible**: todo lo que consuma debe poder reutilizarse
  citando la fuente.
- **Datos de salida abiertos**: si el proyecto genera datos, se publican con licencia
  abierta y con su metodología al lado. Los proyectos ciudadanos producen datos abiertos,
  no solo los consumen.
- **Metodología que aguante un escrutinio**: cómo se mide, con qué margen de error y cómo
  puede repetirlo otra persona. La credibilidad del proyecto es la metodología.
- **Privacidad de serie**: nada de datos personales sin base legal. En la duda, no se
  captura.
- **Mantenimiento realista**: quién lo sostiene y qué pasa si esa persona lo deja. Vale
  un plan sencillo; lo importante es que el dato publicado no quede huérfano sin aviso.

## Las propuestas de ejemplo

Las dos primeras propuestas de este directorio (`termografia-fachadas.md` e
`inventario-arbolado.md`) marcan el listón del formato y están **abiertas a quien quiera
impulsarlas**: la metodología está pensada y el portal ya tiene la infraestructura que
necesitan. Si te interesa alguna, abre un issue o escribe en su PR.

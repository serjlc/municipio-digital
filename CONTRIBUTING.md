# Contribuir

Gracias por querer aportar. Este documento explica cómo trabajamos: es corto y no hay trampa,
lo importante es que puedas montar el entorno en cinco minutos y que tu PR se pueda revisar
sin fricción.

## Montar el entorno

Necesitas Node 22 o superior y pnpm. Después:

```
pnpm install
pnpm dev
```

No hace falta configurar ninguna clave. Las pocas funcionalidades que dependen de una clave
externa muestran un aviso si no está definida, pero el resto de la web funciona igual. Si
necesitas una para lo que estás haciendo, `.env.example` explica cómo conseguirla gratis.

Antes de abrir el PR, comprueba que pasa lo mismo que pasará la CI:

```
pnpm lint
pnpm typecheck
pnpm build
```

## Ramas

Trabajamos sobre `main`, que siempre está en estado desplegable: lo que se mergea se publica.
No hay rama `develop` ni ramas de release; las versiones se marcan con etiquetas si hace
falta un hito.

Todo cambio va en una rama corta creada desde `main`, con un prefijo que diga qué es:

- `feature/` para funcionalidad nueva: `feature/pagina-clima`
- `fix/` para arreglos: `fix/grafica-movil`
- `docs/` para documentación: `docs/guia-conectores`
- `chore/` para mantenimiento sin efecto visible: `chore/actualizar-dependencias`

Un arreglo urgente de producción no tiene liturgia especial: es un `fix/` desde `main` que se
revisa y mergea con prioridad. Al desplegarse `main` en continuo, el parche llega a
producción en minutos.

## Commits

- En inglés, como el código.
- Primera línea en imperativo y concreta, máximo unos 70 caracteres: `Add AEMET connector`,
  `Fix chart overflow on small screens`.
- Si el porqué no es obvio, añade un cuerpo explicándolo. El qué ya se ve en el diff; el
  porqué es lo que se pierde con el tiempo.
- Mejor varios commits pequeños con sentido que uno gigante llamado `changes`.

## Pull requests

1. Abre el PR contra `main` y cuenta en la descripción qué hace y por qué. Si cambia algo
   visual, una captura ayuda mucho.
2. La CI ejecuta lint, typecheck y build. Tiene que estar en verde.
3. Vercel construye un preview del PR y publica la URL como comentario del bot. Ahí puedes
   probar tu cambio funcionando, y quien revisa también. Si contribuyes desde un fork, el
   primer build lo autoriza el mantenedor con un clic; a partir de ahí cada push actualiza el
   preview solo.
4. Se revisa, se ajusta lo que haga falta y se mergea. El merge a `main` despliega a
   producción.

## Qué se espera del código

Las convenciones completas están en el [README](README.md#convenciones). Las que más pesan al
revisar:

- TypeScript en todo, código y commits en inglés, textos de UI y docs en español. Las
  carpetas de rutas (`apps/web/src/app/...`) son la excepción: en español y sin tildes,
  porque son las URLs públicas.
- Nada de Chiclana metido a fuego fuera de `packages/municipio`: los conectores y componentes
  reciben la configuración del municipio.
- La UI mantiene el listón de accesibilidad: HTML semántico, foco visible, objetivos táctiles
  de 44 píxeles, contraste suficiente y textos alternativos. Y responsive de verdad, de móvil
  a escritorio.
- Toda página que muestre datos cita su fuente y licencia.
- Comentarios de código solo cuando expliquen algo que el código no puede decir.

## Proponer un proyecto ciudadano

Si tu idea no es un cambio de código sino un proyecto nuevo (recoger datos del municipio,
visualizar algo que no existe), el camino es otro: abre un PR añadiendo una propuesta corta a
`PROPOSALS/`. El proceso está descrito en el
[README](README.md#proponer-un-proyecto-ciudadano).

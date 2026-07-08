import { ButtonLink, Container } from "@municipio/ui";

export default function NotFound() {
  return (
    <Container className="py-24 sm:py-32">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">Error 404</p>
      <h1 className="mt-3 text-title font-semibold text-ink">Aquí no hay nada</h1>
      <p className="mt-4 max-w-md text-lead text-ink-muted">
        La página que buscas no existe o se ha movido.
      </p>
      <ButtonLink href="/" className="mt-8">
        Volver al inicio
      </ButtonLink>
    </Container>
  );
}

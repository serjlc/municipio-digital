export function SkipLink({
  href = "#contenido",
  children = "Saltar al contenido",
}: {
  href?: string;
  children?: string;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:font-medium focus:text-on-brand focus:shadow-card-hover"
    >
      {children}
    </a>
  );
}

import { cn } from "./cn";
import { Container } from "./container";

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterGroup {
  title: string;
  links: FooterLink[];
}

export function Footer({
  siteName,
  description,
  groups = [],
  note,
  className,
}: {
  siteName: string;
  description?: string;
  groups?: FooterGroup[];
  note?: string;
  className?: string;
}) {
  return (
    <footer className={cn("mt-auto border-t border-line bg-surface-sunken", className)}>
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="text-lg font-semibold tracking-tight text-ink">
              {siteName}
              <span aria-hidden="true" className="text-accent-strong">
                .
              </span>
            </p>
            {description ? <p className="mt-3 max-w-md text-sm text-ink-muted">{description}</p> : null}
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-semibold text-ink">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex min-h-8 items-center text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        {note ? (
          <p className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-ink-faint">
            {note}
          </p>
        ) : null}
      </Container>
    </footer>
  );
}

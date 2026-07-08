import { Fragment } from "react";
import { cn } from "./cn";

export interface DataSource {
  name: string;
  href?: string;
  /** e.g. "CC BY 4.0" */
  license?: string;
}

/**
 * Attribution line for any page or module that shows public data. Project
 * convention: data is always credited to its source, with its license.
 */
export function SourceNote({ sources, className }: { sources: DataSource[]; className?: string }) {
  if (sources.length === 0) return null;
  return (
    <p className={cn("text-sm text-ink-faint", className)}>
      {sources.length === 1 ? "Fuente: " : "Fuentes: "}
      {sources.map((source, i) => (
        <Fragment key={source.name}>
          {i > 0 && (i === sources.length - 1 ? " y " : ", ")}
          {source.href ? (
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-2 hover:text-ink-muted hover:decoration-ink-muted"
            >
              {source.name}
            </a>
          ) : (
            source.name
          )}
          {source.license ? ` (${source.license})` : null}
        </Fragment>
      ))}
      .
    </p>
  );
}

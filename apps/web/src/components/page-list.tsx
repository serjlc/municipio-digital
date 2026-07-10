import { Badge } from "@municipio/ui";
import Link from "next/link";
import type { SitePage } from "../lib/site-pages";

/** The index list used by the landing and the hub pages */
export function PageList({ pages }: { pages: SitePage[] }) {
  return (
    <ul className="flex flex-col" role="list">
      {pages.map((page) => (
        <li
          key={page.title}
          className="grid gap-2 border-b border-line py-6 last:border-b-0 sm:grid-cols-[14rem_1fr_auto] sm:gap-6"
        >
          <h3 className="text-subtitle font-semibold text-ink">
            {page.href ? (
              <Link
                href={page.href}
                className="underline decoration-line underline-offset-4 hover:text-brand hover:decoration-brand"
              >
                {page.title}
              </Link>
            ) : (
              page.title
            )}
          </h3>
          <p className="max-w-xl text-ink-muted">{page.text}</p>
          <p>
            <Badge tone={page.href ? "brand" : "neutral"}>{page.state}</Badge>
          </p>
        </li>
      ))}
    </ul>
  );
}

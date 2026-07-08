"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { cn } from "./cn";
import { Container } from "./container";
import { ThemeToggle } from "./theme-toggle";
import { VisuallyHidden } from "./visually-hidden";

export interface NavItem {
  href: string;
  label: string;
}

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active, mobile }: { item: NavItem; active: boolean; mobile?: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full font-medium transition-colors",
        mobile ? "flex min-h-11 items-center px-4 text-base" : "px-4 py-2 text-sm",
        active
          ? "bg-brand-soft text-brand-strong"
          : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
      )}
    >
      {item.label}
    </Link>
  );
}

export function Header({ siteName, items }: { siteName: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line border-t-[3px] border-t-brand bg-surface/85 backdrop-blur-md">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded-md text-lg font-semibold tracking-tight text-ink no-underline"
        >
          {siteName}
          <span aria-hidden="true" className="text-accent-strong">
            .
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActive(pathname, item.href)} />
                </li>
              ))}
            </ul>
          </nav>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={menuId}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-surface-sunken md:hidden"
          >
            <VisuallyHidden>{open ? "Cerrar menú" : "Abrir menú"}</VisuallyHidden>
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </Container>

      <div id={menuId} hidden={!open} className="border-t border-line md:hidden">
        <nav aria-label="Principal">
          <Container className="py-3">
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActive(pathname, item.href)} mobile />
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      </div>
    </header>
  );
}

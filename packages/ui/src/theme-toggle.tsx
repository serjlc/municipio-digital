"use client";

import { useEffect, useState } from "react";
import { VisuallyHidden } from "./visually-hidden";

function SunIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M16 4l-1.4 1.4M5.4 14.6 4 16M16 16l-1.4-1.4M5.4 5.4 4 4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9Z" />
    </svg>
  );
}

/**
 * Binary light/dark switch. Until the visitor picks, the site follows the
 * system preference; the first click stores an explicit choice starting from
 * the effective theme at that moment.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);

  const toggle = () => {
    if (!theme) return;
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);

    /* Suspend transitions while the theme flips, otherwise every element
       with transition-colors animates at its own pace */
    const freeze = document.createElement("style");
    freeze.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.appendChild(freeze);
    document.documentElement.dataset.theme = next;
    window.getComputedStyle(document.documentElement).colorScheme;
    requestAnimationFrame(() => freeze.remove());
  };

  const label = theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink md:h-9 md:w-9"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      <VisuallyHidden>{label}</VisuallyHidden>
    </button>
  );
}

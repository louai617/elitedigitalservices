"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#projects", label: "Work" },
  { href: "/blog", label: "Insights" },
];

/**
 * Top bar for inner pages. The home page has its own navigation, and project
 * pages have their own sticky bar, and the admin has its own header, so it
 * stays out of those.
 */
export default function SiteHeader() {
  const pathname = usePathname() || "/";
  if (pathname === "/" || pathname.startsWith("/projects/") || pathname.startsWith("/admin")) return null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" aria-label="Elite Media Solutions — home" className="transition-opacity hover:opacity-90">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hidden rounded-full px-3 py-2 text-sm transition-colors hover:text-primary sm:block ${
                pathname.startsWith(l.href) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="ml-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}

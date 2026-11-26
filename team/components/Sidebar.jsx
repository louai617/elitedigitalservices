"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, ListChecks, CalendarDays, Camera, Users, Building2,
  Clock, Palmtree, UserCog, LogOut, Menu, X,
} from "lucide-react";
import { Brand } from "./Logo";
import { Avatar } from "./ui";
import { logout } from "@/app/login/actions";

const ICONS = { LayoutDashboard, FolderKanban, ListChecks, CalendarDays, Camera, Users, Building2, Clock, Palmtree, UserCog };

export default function Sidebar({ user, roleLabel, nav }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/" onClick={() => setOpen(false)}><Brand gid="ems-gold-side" /></Link>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={22} /></button>
      </div>
      <nav className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Main">
        {nav.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "bg-gold/10 font-semibold text-gold" : "text-mute hover:bg-white/[0.04] hover:text-bone"
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="rounded-full bg-gold px-1.5 text-[11px] font-bold text-ink">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.04]">
          <Avatar user={user} size={34} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-xs text-mute">{roleLabel}</span>
          </span>
        </Link>
        <form action={logout}>
          <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-mute transition hover:bg-white/[0.04] hover:text-bone">
            <LogOut size={17} /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Phones / tablets: top bar + drawer */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-ink/85 px-4 backdrop-blur lg:hidden">
        <Link href="/"><Brand gid="ems-gold-top" /></Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-white/5"><Menu size={22} /></button>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-panel transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
}

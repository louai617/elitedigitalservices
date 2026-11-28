import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { Brand } from "@/components/Logo";
import { logout } from "@/app/login/actions";

export const metadata = { title: { default: "Client portal", template: "%s · EMS Client portal" } };

export default async function PortalLayout({ children }) {
  const me = await requireClient();
  const client = await db.client.findUnique({ where: { id: me.clientId }, select: { name: true, company: true } });
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/portal" className="flex items-center gap-3">
            <Brand gid="ems-gold-portal" label="CLIENT PORTAL" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="hidden text-right text-xs leading-tight sm:block">
              <span className="block font-medium text-bone">{client?.company || client?.name}</span>
              <span className="text-mute">{me.name}</span>
            </span>
            <Link href="/portal/account" className="rounded-full p-2 text-mute hover:bg-white/5 hover:text-bone" aria-label="My account"><UserRound size={19} /></Link>
            <form action={logout}><button className="rounded-full p-2 text-mute hover:bg-white/5 hover:text-bone" aria-label="Sign out"><LogOut size={19} /></button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-mute sm:px-6">
        Elite Media Solutions · <a href="mailto:info@elitemedia.qa" className="hover:text-gold">info@elitemedia.qa</a>
      </footer>
    </div>
  );
}

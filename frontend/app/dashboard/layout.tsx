"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { Logo, Skeleton } from "@/components/ui";
import { useMe } from "@/components/useMe";

const NAV = [["/dashboard", "Overview"], ["/dashboard/sessions", "Sessions"], ["/dashboard/contacts", "Contacts"], ["/dashboard/analytics", "Analytics"], ["/dashboard/exports", "Exports"], ["/dashboard/settings", "Settings"]];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = useMe(); const path = usePathname(); const r = useRouter();
  const on = (h: string) => (h === "/dashboard" ? path === h : path.startsWith(h));
  if (!me) return <main className="mx-auto max-w-5xl px-5 py-10"><Skeleton className="h-64" /></main>;
  return (
    <div className="md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 p-5 md:flex">
        <Logo />
        <nav aria-label="Dashboard" className="mt-8 flex-1 space-y-1">
          {NAV.map(([h, l]) => <Link key={h} href={h} aria-current={on(h) ? "page" : undefined} className={`block rounded-xl px-3 py-2 text-sm ${on(h) ? "bg-brand/20 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>{l}</Link>)}
          {me.role === "SUPERADMIN" && <Link href="/superadmin" className="block rounded-xl px-3 py-2 text-sm text-brand-mint hover:bg-white/5">Super admin</Link>}
        </nav>
        <div className="space-y-1 border-t border-white/10 pt-4 text-sm">
          <Link href="/help" className="block px-3 py-1.5 text-zinc-400 hover:text-white">Help</Link>
          <Link href="/dashboard/settings" className="block truncate px-3 py-1.5 text-zinc-400 hover:text-white">{me.displayName}</Link>
          <button className="block w-full px-3 py-1.5 text-left text-zinc-400 hover:text-white" onClick={async () => { await post("/api/auth/logout", {}); r.push("/"); }}>Logout</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
      <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-white/10 bg-ink/95 px-1 py-2 backdrop-blur md:hidden">
        {NAV.filter(([h]) => h !== "/dashboard/contacts").map(([h, l]) => <Link key={h} href={h} aria-current={on(h) ? "page" : undefined} className={`rounded-lg px-2 py-2 text-xs ${on(h) ? "text-brand-soft" : "text-zinc-400"}`}>{l}</Link>)}
      </nav>
    </div>
  );
}

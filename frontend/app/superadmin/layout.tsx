"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui";
import { useMe } from "@/components/useMe";

const NAV = [["/superadmin", "Overview"], ["/superadmin/users", "Users"], ["/superadmin/sessions", "Sessions"], ["/superadmin/import", "Import"], ["/superadmin/activity", "Activity"]];
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = useMe("SUPERADMIN"); const path = usePathname();
  if (!me) return <main className="mx-auto max-w-5xl px-5 py-10"><Skeleton className="h-64" /></main>;
  return (
    <div>
      <header className="border-b border-white/10 px-5 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div><p className="text-lg font-bold">CYMOR <span className="text-brand-soft">VCF</span></p><p className="text-xs tracking-[.25em] text-brand-mint">SYSTEM CONTROL CENTER</p></div>
          <nav aria-label="Super admin" className="flex flex-wrap gap-1 text-sm">
            {NAV.map(([h, l]) => <Link key={h} href={h} aria-current={path === h ? "page" : undefined} className={`rounded-lg px-3 py-1.5 ${path === h ? "bg-brand/20" : "text-zinc-400 hover:text-white"}`}>{l}</Link>)}
            <Link href="/dashboard" className="px-3 py-1.5 text-zinc-500 hover:text-white">Exit</Link></nav>
        </div>
      </header>
      {children}
    </div>);
}

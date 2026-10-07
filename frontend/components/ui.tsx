"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Logo() {
  return <Link href="/" className="text-lg font-bold tracking-tight">CYMOR <span className="text-brand-soft">VCF</span></Link>;
}

export function Nav() {
  return (
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
      <Logo />
      <nav aria-label="Main" className="flex items-center gap-2 text-sm sm:gap-5">
        <Link href="/#how" className="hidden text-zinc-400 hover:text-white sm:inline">How it works</Link>
        <Link href="/#features" className="hidden text-zinc-400 hover:text-white sm:inline">Features</Link>
        <Link href="/#faq" className="hidden text-zinc-400 hover:text-white md:inline">FAQ</Link>
        <Link href="/explore" className="text-zinc-400 hover:text-white">Explore</Link>
        <Link href="/login" className="text-zinc-400 hover:text-white">Login</Link>
        <Link href="/create" className="btn !px-4 !py-2">Create Session</Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mx-auto mt-24 max-w-6xl border-t border-white/10 px-5 py-10 text-sm text-zinc-400">
      <div className="flex flex-wrap justify-between gap-6">
        <div><Logo /><p className="mt-2">Build your network. Grow your reach.</p></div>
        <div className="flex gap-6">
          <Link href="/explore">Explore</Link><Link href="/create">Create</Link><Link href="/dashboard">Dashboard</Link>
          <Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/help">Contact</Link>
        </div>
      </div>
      <p className="mt-6 text-xs text-zinc-500">CYMOR TECH SERVICES. Cymor VCF is an independent service and is not affiliated with WhatsApp or Meta.</p>
    </footer>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"} className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-mint" initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
    </div>
  );
}

export function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now(), from = n, dur = 700; let raf = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - start) / dur); setN(Math.round(from + (to - from) * p)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return <>{n.toLocaleString()}</>;
}

export const Reveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

export const Skeleton = ({ className = "h-24" }: { className?: string }) => <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />;
export const ErrorNote = ({ msg }: { msg: string }) => msg ? <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{msg}</p> : null;

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { timeAgo, Activity } from "@/lib/api";
export const GrowthChart = dynamic(() => import("./charts").then((m) => m.GrowthChart), { ssr: false, loading: () => <Skeleton className="h-56" /> });
export const BarsChart = dynamic(() => import("./charts").then((m) => m.BarsChart), { ssr: false, loading: () => <Skeleton className="h-56" /> });

export const Stat = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <div className="card !p-4"><p className="text-xs uppercase tracking-wider text-zinc-400">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p>{hint && <p className="text-xs text-zinc-500">{hint}</p>}</div>);

export function CountryBars({ items }: { items: { country: string; count: number; pct?: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.length) return <p className="text-sm text-zinc-500">No data yet.</p>;
  return <div className="space-y-2">{items.slice(0, 8).map((c) => (
    <div key={c.country} className="flex items-center gap-3 text-sm"><span className="w-28 truncate">{c.country}</span>
      <div className="h-2 flex-1 rounded-full bg-white/10"><motion.div className="h-2 rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${(c.count / max) * 100}%` }} /></div>
      <span className="w-20 text-right text-zinc-400">{c.count}{c.pct !== undefined ? ` · ${c.pct}%` : ""}</span></div>))}</div>;
}

const LABEL: Record<string, string> = { CONTACT_ADDED: "+1 contact added", DUPLICATE_DETECTED: "Duplicate detected", EXPORTED: "VCF exported", TARGET_UPDATED: "Session target updated", SESSION_CREATED: "Session created",
  CONTACT_DELETED: "Contact deleted", STATUS_CHANGED: "Session status changed", TARGET_REACHED: "Target reached", SUSPICIOUS: "Suspicious activity blocked", IMPORTED: "Contacts imported" };
export function ActivityFeed({ items }: { items: Activity[] }) {
  if (!items.length) return <p className="text-sm text-zinc-500">No activity yet.</p>;
  return <ul className="space-y-3"><AnimatePresence initial={false}>{items.map((a) => (
    <motion.li key={a._id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between gap-3 text-sm">
      <span>{LABEL[a.type] ?? a.type}{a.sessionId?.name ? <span className="text-zinc-500"> · {a.sessionId.name}</span> : null}</span><span className="shrink-0 text-xs text-zinc-500">{timeAgo(a.createdAt)}</span></motion.li>))}</AnimatePresence></ul>;
}

export function ErrorScreen({ code, title, body, action = { href: "/", label: "Back home" } }: { code: string; title: string; body: string; action?: { href: string; label: string } }) {
  return <main className="grid min-h-screen place-items-center px-5 text-center"><div><p className="text-6xl font-bold text-brand-soft">{code}</p><h1 className="mt-3 text-2xl font-semibold">{title}</h1><p className="mt-2 max-w-sm text-zinc-400">{body}</p><Link href={action.href} className="btn mt-6">{action.label}</Link></div></main>;
}

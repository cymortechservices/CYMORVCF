"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Session, Activity } from "@/lib/api";
import { Progress, Skeleton, ErrorNote, Stat, CountUp, ActivityFeed } from "@/components/ui";

export default function Overview() {
  const [list, setList] = useState<Session[] | null>(null); const [a, setA] = useState<any>(null); const [err, setErr] = useState("");
  useEffect(() => { Promise.all([api<Session[]>("/api/sessions"), api("/api/analytics?range=30")]).then(([s, x]) => { setList(s.data); setA(x.data); }).catch((e) => setErr(e.message)); }, []);
  const hour = new Date().getHours(); const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">{greet}</h1><p className="text-zinc-400">Here's what's happening with your network.</p></div><Link href="/create" className="btn">+ Create Session</Link></div>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active sessions" value={a ? <CountUp to={a.activeSessions} /> : "–"} /><Stat label="Total contacts" value={a ? <CountUp to={a.totalContacts} /> : "–"} />
        <Stat label="Unique contacts" value={a ? <CountUp to={a.totalContacts} /> : "–"} /><Stat label="Duplicates blocked" value={a ? <CountUp to={a.duplicates} /> : "–"} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2"><h2 className="text-xl font-semibold">Recent sessions</h2>
          <div className="mt-3 space-y-3">
            {!list && !err && [0, 1].map((i) => <Skeleton key={i} className="h-24" />)}
            {list?.slice(0, 4).map((s) => <Link key={s.sessionId} href={`/dashboard/sessions/${s.sessionId}`} className="card block transition hover:border-brand/50"><div className="flex justify-between"><h3 className="font-semibold">{s.name}</h3><span className="text-xs text-zinc-400">{s.status}</span></div><p className="mt-1 text-sm text-zinc-400">{s.contacts} / {s.target} · {Math.round(s.progress)}%</p><div className="mt-2"><Progress value={s.progress} label={`${s.name} progress`} /></div></Link>)}
            {list?.length === 0 && <div className="card text-center"><p className="font-semibold">No sessions yet.</p><p className="text-sm text-zinc-400">Create your first campaign and start building your network.</p><Link href="/create" className="btn mt-4">Create Session</Link></div>}
          </div></section>
        <section><h2 className="text-xl font-semibold">Recent activity</h2><div className="card mt-3">{a ? <ActivityFeed items={a.recentActivity as Activity[]} /> : <Skeleton className="h-32" />}</div></section>
      </div>
    </main>
  );
}

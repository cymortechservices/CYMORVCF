"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Skeleton, ErrorNote, Stat, CountUp, GrowthChart, CountryBars } from "@/components/ui";

export default function AdminHome() {
  const [s, setS] = useState<any>(null); const [h, setH] = useState<any>(null); const [err, setErr] = useState("");
  useEffect(() => { Promise.all([api("/api/admin/stats"), api("/api/admin/health")]).then(([a, b]) => { setS(a.data); setH(b.data); }).catch((e) => setErr(e.message)); }, []);
  const cum = (rows: any[]) => { let c = 0; return rows.map((r) => ({ date: r.date, total: (c += r.count) })); };
  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <ErrorNote msg={err} />
      {!s ? <Skeleton className="mt-4 h-64" /> : (<>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Total users" value={<CountUp to={s.users} />} /><Stat label="Total sessions" value={<CountUp to={s.sessions} />} /><Stat label="Total contacts" value={<CountUp to={s.contacts} />} /><Stat label="Active sessions" value={<CountUp to={s.activeSessions} />} /></div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[["Contacts growth (30d)", s.contactGrowth], ["User growth (30d)", s.userGrowth], ["Session growth (30d)", s.sessionGrowth]].map(([t, d]: any) => <section key={t} className="card"><h2 className="font-semibold">{t}</h2><div className="mt-3"><GrowthChart data={cum(d)} dataKey="total" /></div></section>)}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="card"><h2 className="font-semibold">Country distribution</h2><div className="mt-3"><CountryBars items={s.countries} /></div></section>
          <section className="card"><h2 className="font-semibold">System health</h2>{h && <dl className="mt-3 space-y-2 text-sm">{[["Database", h.database], ["Uptime", `${Math.floor(h.uptimeSeconds / 60)} min`], ["Memory", `${h.memoryMb} MB`], ["Node", h.node]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-zinc-400">{k}</dt><dd>{v}</dd></div>)}</dl>}</section>
        </div></>)}
    </main>);
}

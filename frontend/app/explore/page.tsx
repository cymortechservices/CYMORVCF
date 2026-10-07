"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Session } from "@/lib/api";
import { Nav, Footer, Progress, Skeleton, ErrorNote } from "@/components/ui";

const FILTERS: [string, string, string][] = [["all", "All", "popular"], ["popular", "Popular", "popular"], ["recent", "Recently Created", "recent"], ["almost", "Almost Complete", "almost"]];
const REGIONS = [["KE", "Kenya"], ["NG", "Nigeria"], ["UG", "Uganda"], ["TZ", "Tanzania"], ["GH", "Ghana"], ["OTHER", "Other"]];

export default function Explore() {
  const [q, setQ] = useState(""); const [page, setPage] = useState(1); const [chipSel, setChipSel] = useState("all"); const [region, setRegion] = useState("");
  const sort = FILTERS.find((f) => f[0] === chipSel)![2];
  const [items, setItems] = useState<Session[] | null>(null); const [total, setTotal] = useState(0); const [err, setErr] = useState("");
  useEffect(() => {
    setItems(null); setErr("");
    const t = setTimeout(() => api<Session[]>(`/api/sessions/explore/list?page=${page}&q=${encodeURIComponent(q)}&sort=${sort}&region=${region}`)
      .then((r) => { setItems(r.data); setTotal(r.meta?.total ?? 0); }).catch((e) => setErr(e.message)), 250);
    return () => clearTimeout(t);
  }, [q, page, sort, region]);
  const chip = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm transition ${on ? "border-brand bg-brand/20" : "border-white/10 text-zinc-400 hover:text-white"}`;
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-3xl font-bold">Explore sessions</h1>
        <label className="sr-only" htmlFor="s">Search sessions</label>
        <input id="s" className="input mt-5 max-w-md" placeholder="Search sessions" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filters">
          {FILTERS.map(([k, l]) => <button key={k} className={chip(chipSel === k)} aria-pressed={chipSel === k} onClick={() => { setChipSel(k); setPage(1); }}>{l}</button>)}
          {REGIONS.map(([c, n]) => <button key={c} className={chip(region === c)} aria-pressed={region === c} onClick={() => { setRegion(region === c ? "" : c); setPage(1); }}>{n}</button>)}
        </div>
        <div className="mt-6"><ErrorNote msg={err} /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!items && !err && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          {items?.map((s) => (
            <div key={s.sessionId} className="card flex flex-col">
              <div className="flex justify-between text-xs text-zinc-500"><span>{s.region}</span><span>{new Date(s.createdAt).toLocaleDateString()}</span></div>
              <h2 className="mt-1 text-lg font-semibold">{s.name}</h2>{s.creator && <p className="text-xs text-zinc-500">by {s.creator}</p>}
              <p className="mt-2 text-sm text-zinc-400">{s.contacts.toLocaleString()} / {s.target.toLocaleString()} · {Math.round(s.progress)}%</p>
              <div className="mt-3"><Progress value={s.progress} label={`${s.name} progress`} /></div>
              <Link href={`/join/${s.sessionId}`} className="btn mt-5">Join Session</Link>
            </div>))}
        </div>
        {items?.length === 0 && <div className="card mt-6 text-center"><p className="font-semibold">No sessions found.</p><Link href="/create" className="btn mt-4">Create Session</Link></div>}
        {total > 12 && <div className="mt-8 flex justify-center gap-3"><button className="btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn-ghost" disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>Next</button></div>}
      </main>
      <Footer />
    </>
  );
}

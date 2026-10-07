"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Skeleton, ErrorNote, Stat, GrowthChart, BarsChart, CountryBars } from "@/components/ui";

const RANGES = [["7", "7 days"], ["30", "30 days"], ["90", "90 days"], ["all", "All time"]];
export default function Analytics() {
  const [range, setRange] = useState("30"); const [a, setA] = useState<any>(null); const [err, setErr] = useState("");
  useEffect(() => { setA(null); api(`/api/analytics?range=${range}`).then((r) => setA(r.data)).catch((e) => setErr(e.message)); }, [range]);
  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2" role="group" aria-label="Date range">{RANGES.map(([v, l]) => <button key={v} aria-pressed={range === v} onClick={() => setRange(v)} className={`rounded-full border px-4 py-1.5 text-sm ${range === v ? "border-brand bg-brand/20" : "border-white/10 text-zinc-400"}`}>{l}</button>)}</div></div>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      {!a ? <div className="mt-6 grid gap-3"><Skeleton className="h-24" /><Skeleton className="h-56" /></div> : (<>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Contacts (range)" value={a.total} /><Stat label="Total contacts" value={a.totalContacts} /><Stat label="Duplicates blocked" value={a.duplicates} /><Stat label="Active sessions" value={a.activeSessions} />
          <Stat label="Growth rate" value={a.growthRate === null ? "–" : `${a.growthRate}%`} hint="last 7 days vs previous 7" /><Stat label="Avg per day" value={a.avgPerDay} /><Stat label="Avg per hour" value={a.avgPerHour} />
          <Stat label="Peak hour (UTC)" value={a.peakHour === null ? "–" : `${String(a.peakHour).padStart(2, "0")}:00`} /><Stat label="Completion rate" value={`${a.completionRate}%`} hint="sessions at target" /><Stat label="Exports" value={a.exports} />
        </div>
        <section className="card mt-6"><h2 className="font-semibold">Contacts over time</h2><div className="mt-3"><GrowthChart data={a.perDay} /></div></section>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="card"><h2 className="font-semibold">Contacts per day</h2><div className="mt-3"><BarsChart data={a.perDay} x="date" y="count" /></div></section>
          <section className="card"><h2 className="font-semibold">Contacts per hour (UTC)</h2><div className="mt-3"><BarsChart data={a.perHour} x="hour" y="count" /></div></section>
        </div>
        <section className="card mt-4"><h2 className="font-semibold">Top countries</h2><p className="text-xs text-zinc-500">From each number's own country code.</p><div className="mt-3"><CountryBars items={a.countries} /></div></section></>)}
    </main>
  );
}

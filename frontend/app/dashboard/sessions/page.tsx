"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, patch, del, download, siteUrl, Session } from "@/lib/api";
import { Progress, Skeleton, ErrorNote } from "@/components/ui";
import { Confirm } from "@/components/Modal";

export default function Sessions() {
  const [list, setList] = useState<Session[] | null>(null); const [err, setErr] = useState(""); const [rm, setRm] = useState<Session | null>(null); const [copied, setCopied] = useState("");
  const load = useCallback(() => api<Session[]>("/api/sessions").then((x) => setList(x.data)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const run = async (fn: () => Promise<unknown>) => { setErr(""); try { await fn(); await load(); } catch (e: any) { setErr(e.message); } };
  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Sessions</h1><Link href="/create" className="btn">+ Create Session</Link></div>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      <div className="mt-5 space-y-3">
        {!list && !err && [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
        {list?.map((s) => (
          <div key={s.sessionId} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">{s.name}</h2><p className="text-xs text-zinc-500">{s.status} · {s.visibility} · created {new Date(s.createdAt).toLocaleDateString()}</p></div><p className="text-sm text-zinc-300">{s.contacts} / {s.target} · {Math.round(s.progress)}%</p></div>
            <div className="mt-3"><Progress value={s.progress} label={`${s.name} progress`} /></div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link className="btn-ghost !px-3 !py-1.5" href={`/dashboard/sessions/${s.sessionId}`}>Open</Link>
              <button className="btn-ghost !px-3 !py-1.5" onClick={() => { navigator.clipboard.writeText(`${siteUrl()}/join/${s.sessionId}`); setCopied(s.sessionId); setTimeout(() => setCopied(""), 1500); }}>{copied === s.sessionId ? "Copied!" : "Share"}</button>
              <Link className="btn-ghost !px-3 !py-1.5" href={`/dashboard/sessions/${s.sessionId}#settings`}>Edit</Link>
              {s.status === "ACTIVE" ? <button className="btn-ghost !px-3 !py-1.5" onClick={() => run(() => patch(`/api/sessions/${s.sessionId}`, { status: "PAUSED" }))}>Pause</button>
                : s.status !== "SUSPENDED" && <button className="btn-ghost !px-3 !py-1.5" onClick={() => run(() => patch(`/api/sessions/${s.sessionId}`, { status: "ACTIVE" }))}>Resume</button>}
              <button className="btn-ghost !px-3 !py-1.5" onClick={() => run(() => download(`/api/sessions/${s.sessionId}/export?format=vcf`))}>Export</button>
              <button className="rounded-xl border border-red-500/30 px-3 py-1.5 text-red-300 hover:bg-red-500/10" onClick={() => setRm(s)}>Delete</button>
            </div>
          </div>))}
        {list?.length === 0 && <div className="card text-center"><p className="font-semibold">No sessions yet.</p><p className="text-sm text-zinc-400">Create your first campaign and start building your network.</p><Link href="/create" className="btn mt-4">Create Session</Link></div>}
      </div>
      <Confirm open={!!rm} danger title="Delete session?" body={`"${rm?.name}" and all of its contacts will be permanently deleted.`} confirmLabel="Delete" onCancel={() => setRm(null)} onConfirm={() => { const s = rm!; setRm(null); run(() => del(`/api/sessions/${s.sessionId}`)); }} />
    </main>
  );
}

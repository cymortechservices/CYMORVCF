"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, patch, del, download, Session } from "@/lib/api";
import { Skeleton, ErrorNote } from "@/components/ui";
import { Confirm } from "@/components/Modal";

export default function AdminSessions() {
  const [rows, setRows] = useState<Session[] | null>(null); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [err, setErr] = useState("");
  const [f, setF] = useState({ q: "", status: "", visibility: "", region: "", owner: "", from: "", to: "" }); const [rm, setRm] = useState<Session | null>(null);
  const load = useCallback(() => api<Session[]>(`/api/admin/sessions?page=${page}&${new URLSearchParams(f)}`).then((r) => { setRows(r.data); setTotal(r.meta?.total ?? 0); }).catch((e) => setErr(e.message)), [page, f]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const run = async (fn: () => Promise<unknown>) => { setErr(""); try { await fn(); await load(); } catch (e: any) { setErr(e.message); } };
  const set = (k: string, v: string) => { setF({ ...f, [k]: v }); setPage(1); };
  const sel = (k: string, opts: string[]) => <select aria-label={k} className="input !w-auto" value={(f as any)[k]} onChange={(e) => set(k, e.target.value)}><option value="">{k}: all</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>;
  return (
    <main className="mx-auto max-w-6xl px-5 py-6"><h1 className="text-3xl font-bold">Sessions</h1>
      <div className="mt-4 flex flex-wrap gap-2"><input aria-label="Search" className="input max-w-[12rem]" placeholder="Search name" value={f.q} onChange={(e) => set("q", e.target.value)} /><input aria-label="Owner email" className="input max-w-[12rem]" placeholder="Owner email" value={f.owner} onChange={(e) => set("owner", e.target.value)} />
        {sel("status", ["ACTIVE", "PAUSED", "CLOSED", "SUSPENDED"])}{sel("visibility", ["PUBLIC", "UNLISTED", "PRIVATE"])}{sel("region", ["KE", "NG", "UG", "TZ", "GH", "OTHER"])}
        <input aria-label="From date" type="date" className="input !w-auto" value={f.from} onChange={(e) => set("from", e.target.value)} /><input aria-label="To date" type="date" className="input !w-auto" value={f.to} onChange={(e) => set("to", e.target.value)} /></div>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      {!rows ? <Skeleton className="mt-4 h-48" /> : <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase text-zinc-400"><tr><th className="p-3">Session</th><th className="p-3">Owner</th><th className="p-3">Contacts</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{rows.map((s) => <tr key={s.sessionId} className="border-t border-white/5"><td className="p-3"><p>{s.name}</p><p className="text-xs text-zinc-500">{s.visibility} · {s.region}</p></td><td className="p-3 text-zinc-400">{s.owner}</td><td className="p-3">{s.contacts}/{s.target}</td><td className="p-3">{s.status}</td>
          <td className="space-x-3 p-3 whitespace-nowrap"><Link className="hover:underline" href={`/dashboard/sessions/${s.sessionId}`}>View</Link>
            <button className="hover:underline" onClick={() => { const name = prompt("Rename session", s.name); if (name && name.length > 1) run(() => patch(`/api/admin/sessions/${s.sessionId}`, { name })); }}>Edit</button>
            <button className="hover:underline" onClick={() => run(() => patch(`/api/admin/sessions/${s.sessionId}`, { status: s.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" }))}>{s.status === "SUSPENDED" ? "Restore" : "Suspend"}</button>
            <button className="hover:underline" onClick={() => run(() => download(`/api/admin/sessions/${s.sessionId}/export?format=vcf`))}>Export</button>
            <button className="text-red-300 hover:underline" onClick={() => setRm(s)}>Delete</button></td></tr>)}</tbody></table></div>}
      {rows?.length === 0 && <p className="mt-4 text-center text-sm text-zinc-500">No sessions match.</p>}
      {total > 20 && <div className="mt-4 flex justify-center gap-3"><button className="btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn-ghost" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</button></div>}
      <Confirm open={!!rm} danger title="Delete session?" body={`"${rm?.name}" and all of its contacts will be permanently deleted.`} confirmLabel="Delete" onCancel={() => setRm(null)} onConfirm={() => { const s = rm!; setRm(null); run(() => del(`/api/admin/sessions/${s.sessionId}`)); }} />
    </main>);
}

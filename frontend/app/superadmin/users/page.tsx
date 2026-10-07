"use client";
import { useCallback, useEffect, useState } from "react";
import { api, patch, del, Session } from "@/lib/api";
import { Skeleton, ErrorNote } from "@/components/ui";
import { Confirm } from "@/components/Modal";

export default function Users() {
  const [rows, setRows] = useState<any[] | null>(null); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [q, setQ] = useState(""); const [status, setStatus] = useState("");
  const [err, setErr] = useState(""); const [ask, setAsk] = useState<{ kind: "suspend" | "restore" | "delete"; u: any } | null>(null); const [open, setOpen] = useState<{ id: string; list: Session[] } | null>(null);
  const load = useCallback(() => api<any[]>(`/api/admin/users?page=${page}&q=${encodeURIComponent(q)}&status=${status}`).then((r) => { setRows(r.data); setTotal(r.meta?.total ?? 0); }).catch((e) => setErr(e.message)), [page, q, status]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  async function go() {
    const a = ask!; setAsk(null); setErr("");
    try { if (a.kind === "delete") await del(`/api/admin/users/${a.u.id}`); else await patch(`/api/admin/users/${a.u.id}`, { suspended: a.kind === "suspend" }); await load(); } catch (e: any) { setErr(e.message); }
  }
  return (
    <main className="mx-auto max-w-6xl px-5 py-6"><h1 className="text-3xl font-bold">Users</h1>
      <div className="mt-4 flex flex-wrap gap-2"><input aria-label="Search users" className="input max-w-xs" placeholder="Search email or name" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select aria-label="Status" className="input !w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      {!rows ? <Skeleton className="mt-4 h-48" /> : <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase text-zinc-400"><tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Sessions</th><th className="p-3">Joined</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id} className="border-t border-white/5"><td className="p-3"><p>{u.displayName}</p><p className="text-xs text-zinc-500">{u.email}</p></td><td className="p-3">{u.role}</td><td className="p-3">{u.sessions}</td><td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
          <td className="p-3">{u.suspended ? <span className="text-red-300">SUSPENDED</span> : "ACTIVE"}</td>
          <td className="space-x-3 p-3 whitespace-nowrap"><button className="hover:underline" onClick={async () => setOpen(open?.id === u.id ? null : { id: u.id, list: (await api<Session[]>(`/api/admin/users/${u.id}/sessions`)).data })}>Sessions</button>
            {u.role !== "SUPERADMIN" && <><button className="hover:underline" onClick={() => setAsk({ kind: u.suspended ? "restore" : "suspend", u })}>{u.suspended ? "Restore" : "Suspend"}</button><button className="text-red-300 hover:underline" onClick={() => setAsk({ kind: "delete", u })}>Delete</button></>}</td></tr>)}</tbody></table></div>}
      {open && <div className="card mt-4"><h2 className="font-semibold">Sessions</h2>{open.list.length === 0 ? <p className="mt-2 text-sm text-zinc-500">None.</p> : <ul className="mt-2 space-y-1 text-sm">{open.list.map((s) => <li key={s.sessionId}>{s.name} · {s.contacts}/{s.target} · {s.status}</li>)}</ul>}</div>}
      {total > 20 && <div className="mt-4 flex justify-center gap-3"><button className="btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn-ghost" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</button></div>}
      <Confirm open={!!ask} danger={ask?.kind !== "restore"} confirmLabel={ask?.kind === "delete" ? "Delete user" : ask?.kind === "suspend" ? "Suspend" : "Restore"} title={ask ? `${ask.kind[0].toUpperCase()}${ask.kind.slice(1)} ${ask.u.email}?` : ""}
        body={ask?.kind === "delete" ? "This permanently deletes the user, their sessions, contacts and exports." : ask?.kind === "suspend" ? "They will be logged out and unable to sign in." : "They will be able to sign in again."} onCancel={() => setAsk(null)} onConfirm={go} />
    </main>);
}

"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, post, del, timeAgo } from "@/lib/api";
import { Skeleton, ErrorNote } from "@/components/ui";
import { Confirm } from "@/components/Modal";

interface C { _id: string; name: string; normalizedNumber: string; country: string; countryCode: string; createdAt: string; status: string }
const COUNTRIES = [["", "All countries"], ["KE", "Kenya"], ["NG", "Nigeria"], ["UG", "Uganda"], ["TZ", "Tanzania"], ["GH", "Ghana"]];

export default function Contacts() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<C[] | null>(null); const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [q, setQ] = useState(""); const [country, setCountry] = useState(""); const [sort, setSort] = useState("new"); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set()); const [err, setErr] = useState(""); const [confirm, setConfirm] = useState<null | "bulk" | C>(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page), q, country, sort, from, to });
    return api<C[]>(`/api/sessions/${id}/contacts?${qs}`).then((r) => { setRows(r.data); setTotal(r.meta?.total ?? 0); }).catch((e) => setErr(e.message));
  }, [id, page, q, country, sort, from, to]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function doDelete() {
    const target = confirm; setConfirm(null); setErr("");
    try {
      if (target === "bulk") await post(`/api/sessions/${id}/contacts/bulk-delete`, { ids: [...sel] }); else if (target) await del(`/api/sessions/${id}/contacts/${target._id}`);
      setSel(new Set()); await load();
    } catch (e: any) { setErr(e.message); }
  }
  const toggle = (cid: string) => setSel((p) => { const n = new Set(p); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
  const all = !!rows?.length && rows.every((r) => sel.has(r._id));
  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <Link href={`/dashboard/sessions/${id}`} className="text-sm text-zinc-400 hover:text-white">← Session</Link>
      <h1 className="mt-2 text-3xl font-bold">Contacts <span className="text-lg text-zinc-500">{total.toLocaleString()}</span></h1>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2"><label className="sr-only" htmlFor="q">Search</label><input id="q" className="input" placeholder="Search name or number" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <select aria-label="Country" className="input" value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }}>{COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select aria-label="Sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Newest first</option><option value="old">Oldest first</option><option value="name">Name</option></select>
        <div className="flex gap-2"><input aria-label="From date" type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /><input aria-label="To date" type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></div>
      </div>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      {sel.size > 0 && <div className="mt-3 flex items-center justify-between rounded-xl border border-brand/40 bg-brand/10 px-4 py-2 text-sm"><span>{sel.size} selected</span><button className="text-red-300 hover:underline" onClick={() => setConfirm("bulk")}>Delete selected</button></div>}
      {!rows ? <Skeleton className="mt-4 h-48" /> : rows.length === 0 ? <div className="card mt-4 text-center"><p className="font-semibold">No contacts yet.</p><p className="text-sm text-zinc-400">Share your session link to start growing your network.</p></div> : (<>
        <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-white/10 md:block"><table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-400"><tr><th className="p-3"><input type="checkbox" aria-label="Select all" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r._id)))} /></th><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Country</th><th className="p-3">Added</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{rows.map((c) => <tr key={c._id} className="border-t border-white/5"><td className="p-3"><input type="checkbox" aria-label={`Select ${c.name}`} checked={sel.has(c._id)} onChange={() => toggle(c._id)} /></td><td className="p-3">{c.name}</td><td className="p-3 font-mono">{c.normalizedNumber}</td><td className="p-3">{c.country}</td><td className="p-3">{timeAgo(c.createdAt)}</td><td className="p-3"><span className="rounded-full bg-brand-mint/15 px-2 py-0.5 text-xs text-brand-mint">{c.status}</span></td><td className="p-3"><button className="text-red-300 hover:underline" aria-label={`Delete ${c.name}`} onClick={() => setConfirm(c)}>Delete</button></td></tr>)}</tbody></table></div>
        <div className="mt-4 space-y-2 md:hidden">{rows.map((c) => <div key={c._id} className="card !p-4"><div className="flex items-center justify-between"><label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={sel.has(c._id)} onChange={() => toggle(c._id)} />{c.name}</label><span className="text-xs text-brand-mint">{c.status}</span></div><p className="mt-1 font-mono text-sm">{c.normalizedNumber}</p><p className="text-xs text-zinc-500">{c.country} · {timeAgo(c.createdAt)}</p><button className="mt-2 text-sm text-red-300" onClick={() => setConfirm(c)}>Delete</button></div>)}</div></>)}
      {total > 50 && <div className="mt-4 flex justify-center gap-3"><button className="btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn-ghost" disabled={page * 50 >= total} onClick={() => setPage(page + 1)}>Next</button></div>}
      <Confirm open={!!confirm} danger title="Delete contact data?" confirmLabel="Delete" onCancel={() => setConfirm(null)} onConfirm={doDelete}
        body={confirm === "bulk" ? `${sel.size} selected contacts will be permanently deleted from this session.` : confirm ? `${confirm.name} (${confirm.normalizedNumber}) will be permanently deleted.` : ""} />
    </main>
  );
}

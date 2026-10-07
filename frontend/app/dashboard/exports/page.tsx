"use client";
import { useEffect, useState } from "react";
import { api, download } from "@/lib/api";
import { Skeleton, ErrorNote } from "@/components/ui";

export default function Exports() {
  const [rows, setRows] = useState<any[] | null>(null); const [err, setErr] = useState("");
  useEffect(() => { api<any[]>("/api/exports").then((r) => setRows(r.data)).catch((e) => setErr(e.message)); }, []);
  return (
    <main className="mx-auto max-w-5xl px-5 py-6"><h1 className="text-3xl font-bold">Exports</h1>
      <p className="text-sm text-zinc-400">Export records are kept for 90 days. Re-downloading regenerates the file from your current contacts, so nothing large is stored.</p>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      {!rows && !err && <Skeleton className="mt-5 h-40" />}
      {rows?.length === 0 && <div className="card mt-5 text-center"><p className="font-semibold">No exports yet.</p><p className="text-sm text-zinc-400">Download a VCF from any session and it will appear here.</p></div>}
      <div className="mt-5 space-y-2">{rows?.map((e) => (
        <div key={e._id} className="card flex flex-wrap items-center justify-between gap-3 !p-4"><div><p className="font-medium">{e.filename}</p><p className="text-xs text-zinc-500">{e.sessionName} · {e.count} contacts · {e.format.toUpperCase()} · {new Date(e.createdAt).toLocaleString()} · {e.status}</p></div>
          <button className="btn-ghost !py-2" onClick={() => download(`/api/exports/${e._id}/download`).catch((x) => setErr(x.message))}>Download</button></div>))}</div>
    </main>);
}

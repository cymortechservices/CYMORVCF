"use client";
import { useEffect, useState } from "react";
import { api, timeAgo } from "@/lib/api";
import { Skeleton, ErrorNote, ActivityFeed } from "@/components/ui";

export default function AdminActivity() {
  const [d, setD] = useState<any>(null); const [err, setErr] = useState("");
  useEffect(() => { api("/api/admin/activity").then((r) => setD(r.data)).catch((e) => setErr(e.message)); }, []);
  return (
    <main className="mx-auto max-w-6xl px-5 py-6"><h1 className="text-3xl font-bold">Platform activity</h1><div className="mt-4"><ErrorNote msg={err} /></div>
      {!d ? <Skeleton className="mt-4 h-48" /> : <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card"><h2 className="font-semibold">Session activity</h2><div className="mt-3"><ActivityFeed items={d.platform} /></div></section>
        <section className="card"><h2 className="font-semibold">Admin audit log</h2><ul className="mt-3 space-y-2 text-sm">{d.admin.length === 0 && <li className="text-zinc-500">No admin actions yet.</li>}{d.admin.map((a: any) => <li key={a._id} className="flex justify-between gap-3"><span>{a.action} <span className="text-zinc-500">· {a.adminId?.email}</span></span><span className="shrink-0 text-xs text-zinc-500">{timeAgo(a.createdAt)}</span></li>)}</ul></section></div>}
    </main>);
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Session } from "@/lib/api";
import { Skeleton, ErrorNote } from "@/components/ui";

export default function ContactsPicker() {
  const [list, setList] = useState<Session[] | null>(null); const [err, setErr] = useState("");
  useEffect(() => { api<Session[]>("/api/sessions").then((x) => setList(x.data)).catch((e) => setErr(e.message)); }, []);
  return (
    <main className="mx-auto max-w-5xl px-5 py-6"><h1 className="text-3xl font-bold">Contacts</h1><p className="text-zinc-400">Choose a session to manage its contacts.</p>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{!list && !err && [0, 1].map((i) => <Skeleton key={i} className="h-20" />)}
        {list?.map((s) => <Link key={s.sessionId} href={`/dashboard/sessions/${s.sessionId}/contacts`} className="card block hover:border-brand/50"><p className="font-semibold">{s.name}</p><p className="text-sm text-zinc-400">{s.contacts} contacts</p></Link>)}
        {list?.length === 0 && <div className="card text-center sm:col-span-2"><p className="font-semibold">No contacts yet.</p><p className="text-sm text-zinc-400">Share your session link to start growing your network.</p><Link href="/create" className="btn mt-4">Create Session</Link></div>}</div>
    </main>);
}

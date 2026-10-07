"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import { SOCKET_URL, api, patch, download, siteUrl, Session, Activity } from "@/lib/api";
import { Progress, CountUp, Skeleton, ErrorNote, Stat, GrowthChart, CountryBars, ActivityFeed } from "@/components/ui";
import { Confirm } from "@/components/Modal";

export default function SessionDashboard() {
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<Session | null>(null); const [an, setAn] = useState<any>(null); const [act, setAct] = useState<Activity[]>([]);
  const [err, setErr] = useState(""); const [toast, setToast] = useState(""); const [copied, setCopied] = useState(false); const [busy, setBusy] = useState(false);
  const [fmt, setFmt] = useState("vcf"); const [reached, setReached] = useState(false); const [form, setForm] = useState<any>({}); const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([api<Session>(`/api/sessions/${id}/manage`), api(`/api/sessions/${id}/analytics?range=30`), api<Activity[]>(`/api/sessions/${id}/activity`)]);
      setS(a.data); setAn(b.data); setAct(c.data); setForm((f: any) => (f.name ? f : { name: a.data.name, target: a.data.target, prefix: a.data.prefix, vcfFilename: a.data.vcfFilename, whatsappUrl: a.data.whatsappUrl ?? "" }));
      if (a.data.contacts >= a.data.target && a.data.contacts > 0) setReached(true);
    } catch (e: any) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { // real-time updates (counts only, never numbers)
    const sock = io(SOCKET_URL, { withCredentials: true }); sock.emit("session:watch", id);
    sock.on("contact:added", () => { setToast("+1 new contact"); setTimeout(() => setToast(""), 2500); load(); });
    sock.on("target:reached", () => setReached(true));
    return () => { sock.disconnect(); };
  }, [id, load]);

  const act2 = async (fn: () => Promise<unknown>) => { setErr(""); try { await fn(); await load(); } catch (e: any) { setErr(e.message); } };
  async function exportNow() { setBusy(true); await act2(() => download(`/api/sessions/${id}/export?format=${fmt}`)); setBusy(false); setToast("VCF ready."); setTimeout(() => setToast(""), 2000); }
  async function save() { await act2(async () => { await patch(`/api/sessions/${id}`, { ...form, target: Number(form.target) }); setSaved(true); setTimeout(() => setSaved(false), 1500); }); }

  if (!s) return <main className="mx-auto max-w-5xl px-5 py-8">{err ? <ErrorNote msg={err} /> : <Skeleton className="h-64" />}</main>;
  const link = `${siteUrl()}/join/${s.sessionId}`;
  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <Link href="/dashboard/sessions" className="text-sm text-zinc-400 hover:text-white">← All sessions</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{s.name} <span className="text-sm font-medium text-brand-mint">{s.status === "ACTIVE" ? "LIVE ●" : s.status}</span></h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost !py-2" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied!" : "Share"}</button>
          <label className="sr-only" htmlFor="fmt">Export format</label>
          <select id="fmt" className="input !w-auto !py-2" value={fmt} onChange={(e) => setFmt(e.target.value)}><option value="vcf">VCF</option><option value="csv">CSV</option><option value="txt">TXT</option></select>
          <button className="btn !py-2" onClick={exportNow} disabled={busy}>{busy ? "Preparing your VCF..." : `Download ${fmt.toUpperCase()}`}</button>
        </div>
      </div>
      {toast && <p role="status" className="fixed right-4 top-4 z-40 rounded-xl bg-brand px-4 py-2 text-sm font-semibold shadow-xl">{toast}</p>}
      <div className="mt-4"><ErrorNote msg={err} /></div>
      <div className="card mt-4">
        <p className="text-4xl font-extrabold"><CountUp to={s.contacts} /> <span className="text-zinc-500">/ {s.target.toLocaleString()}</span> <span className="text-lg text-brand-soft">{s.progress}%</span></p>
        <div className="mt-3"><Progress value={s.progress} /></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total contacts" value={<CountUp to={s.contacts} />} /><Stat label="Unique contacts" value={<CountUp to={s.contacts} />} />
        <Stat label="Duplicates blocked" value={<CountUp to={s.duplicates ?? 0} />} /><Stat label="Countries" value={an?.countries.length ?? "–"} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2"><h2 className="font-semibold">Contact growth (30 days)</h2><div className="mt-3">{an ? <GrowthChart data={an.perDay} /> : <Skeleton className="h-56" />}</div></section>
        <section className="card"><h2 className="font-semibold">Country distribution</h2><div className="mt-3">{an && <CountryBars items={an.countries} />}</div></section>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2"><h2 className="font-semibold">Recent activity</h2><div className="mt-3"><ActivityFeed items={act} /></div></section>
        <section className="card"><h2 className="font-semibold">Manage</h2><div className="mt-3 flex flex-col gap-2">
          <Link href={`/dashboard/sessions/${id}/contacts`} className="btn">View contacts</Link>
          <button className="btn-ghost" onClick={() => act2(() => patch(`/api/sessions/${id}`, { status: s.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }))}>{s.status === "ACTIVE" ? "Pause session" : "Resume session"}</button>
          <button className="btn-ghost" onClick={() => act2(() => patch(`/api/sessions/${id}`, { status: "CLOSED" }))}>Close session</button></div></section>
      </div>
      <section id="settings" className="card mt-4"><h2 className="font-semibold">Settings</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[["name", "Name"], ["target", "Target contacts"], ["prefix", "Contact prefix (affects new contacts only)"], ["vcfFilename", "VCF filename"], ["whatsappUrl", "WhatsApp link"]].map(([k, l]) => <div key={k}><label className="label" htmlFor={k}>{l}</label><input id={k} className="input" type={k === "target" ? "number" : "text"} value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>)}
        </div><button className="btn mt-4" onClick={save}>{saved ? "Saved!" : "Save changes"}</button></section>
      <Confirm open={reached} title="Target reached!" body={`${s.contacts} / ${s.target} contacts. Download your VCF, keep collecting, or close the session.`} confirmLabel="Download VCF"
        onCancel={() => setReached(false)} onConfirm={() => { setReached(false); exportNow(); }} />
    </main>
  );
}

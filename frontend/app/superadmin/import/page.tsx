"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { post } from "@/lib/api";
import { ErrorNote } from "@/components/ui";

export default function Import() {
  const [vcf, setVcf] = useState(""); const [fileName, setFileName] = useState(""); const [prev, setPrev] = useState<any>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"new" | "existing">("new"); const [sessionId, setSessionId] = useState(""); const [name, setName] = useState(""); const [target, setTarget] = useState(1000); const [done, setDone] = useState<any>(null);
  const [drag, setDrag] = useState(false); const input = useRef<HTMLInputElement>(null);
  const body = () => ({ vcf, ...(mode === "existing" ? { sessionId } : { newSession: { name, target: Number(target) } }) });

  async function pick(file?: File) {
    if (!file) return; setErr(""); setPrev(null); setDone(null);
    if (!/\.vcf$/i.test(file.name)) return setErr("Please choose a .vcf file.");
    if (file.size > 5_000_000) return setErr("That file is larger than 5 MB.");
    setFileName(file.name); setVcf(await file.text());
  }
  async function preview() { setBusy(true); setErr(""); try { setPrev((await post("/api/admin/import/preview", { vcf, ...(mode === "existing" ? { sessionId } : {}) })).data); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } }
  async function run() { setBusy(true); setErr(""); try { setDone((await post("/api/admin/import", body())).data); setPrev(null); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } }
  const ready = vcf && (mode === "existing" ? sessionId : name.length > 1);
  return (
    <main className="mx-auto max-w-3xl px-5 py-6"><h1 className="text-3xl font-bold">Import VCF</h1>
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={`mt-5 rounded-2xl border-2 border-dashed p-10 text-center transition ${drag ? "border-brand bg-brand/10" : "border-white/15"}`}>
        <p className="font-medium">{fileName || "Drag and drop a .vcf file here"}</p><button className="btn-ghost mt-3" onClick={() => input.current?.click()}>Choose file</button>
        <input ref={input} type="file" accept=".vcf,text/vcard" className="sr-only" aria-label="VCF file" onChange={(e) => pick(e.target.files?.[0])} /></div>
      <div className="card mt-4 space-y-3"><div className="flex gap-4 text-sm"><label><input type="radio" checked={mode === "new"} onChange={() => { setMode("new"); setPrev(null); }} /> Import into new session</label><label><input type="radio" checked={mode === "existing"} onChange={() => { setMode("existing"); setPrev(null); }} /> Import into existing session</label></div>
        {mode === "new" ? <div className="grid gap-3 sm:grid-cols-2"><div><label className="label" htmlFor="n">Session name</label><input id="n" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div><div><label className="label" htmlFor="t">Target</label><input id="t" type="number" className="input" value={target} onChange={(e) => setTarget(Number(e.target.value))} /></div></div>
          : <div><label className="label" htmlFor="sid">Session ID</label><input id="sid" className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)} /><p className="mt-1 text-xs text-zinc-500">Existing contacts are never overwritten; duplicates are skipped.</p></div>}
        <button className="btn" disabled={!ready || busy} onClick={preview}>{busy ? "Working..." : "Preview import"}</button></div>
      <div className="mt-4"><ErrorNote msg={err} /></div>
      {prev && <div className="card mt-4"><h2 className="font-semibold">Preview</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Detected", prev.detected], ["Unique", prev.unique], ["Duplicates", prev.duplicates], ["Invalid", prev.invalid]].map(([l, v]) => <div key={l} className="rounded-xl bg-white/5 p-3"><p className="text-xs text-zinc-400">{l}</p><p className="text-xl font-semibold">{v}</p></div>)}</div>
        <p className="mt-3 text-sm text-zinc-400">Countries: {prev.countries.map((c: any) => `${c.country} (${c.count})`).join(", ") || "none"}</p>
        <ul className="mt-2 text-sm text-zinc-500">{prev.sample.map((s: any, i: number) => <li key={i}>{s.name} · {s.phone}</li>)}</ul>
        <button className="btn mt-4" disabled={busy || prev.unique === 0} onClick={run}>Import {prev.unique} contacts</button></div>}
      {done && <div className="card mt-4"><p className="font-semibold text-brand-mint">Imported {done.inserted} contacts.</p><p className="text-sm text-zinc-400">{done.duplicates} duplicates and {done.invalid} invalid skipped.</p><Link href={`/dashboard/sessions/${done.sessionId}`} className="btn mt-3">Open session</Link></div>}
    </main>);
}

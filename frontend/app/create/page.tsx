"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { post, siteUrl, Session } from "@/lib/api";
import { Nav, ErrorNote } from "@/components/ui";

const STEPS = ["Session", "VCF", "WhatsApp", "Visibility", "Review"];

export default function Create() {
  const r = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", description: "", target: 100, prefix: "CYMOR", vcfFilename: "contacts.vcf", region: "KE", whatsappUrl: "", visibility: "PUBLIC", accessCode: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Session | null>(null); const [copied, setCopied] = useState(false);
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const valid = [f.name.trim().length >= 2 && f.target >= 1, f.prefix.trim().length >= 1, true, f.visibility !== "PRIVATE" || f.accessCode.length >= 4, true][step];

  async function create() {
    setBusy(true); setErr("");
    try {
      const body: any = { ...f, target: Number(f.target) }; if (f.visibility !== "PRIVATE") delete body.accessCode;
      setDone((await post("/api/sessions", body)).data as Session);
    } catch (x: any) { if (x.status === 401) r.push("/login"); else setErr(x.message); } finally { setBusy(false); }
  }

  if (done) {
    const link = `${siteUrl()}/join/${done.sessionId}`;
    return (<><Nav /><main className="mx-auto max-w-lg px-5 py-10 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-mint">Your session is live</p>
      <h1 className="mt-2 text-3xl font-bold">{done.name}</h1>
      <div className="card mt-6 space-y-4">
        <div className="mx-auto w-fit rounded-xl bg-white p-3"><QRCodeSVG value={link} size={160} /></div>
        <input readOnly aria-label="Session link" className="input text-center" value={link} onFocus={(e) => e.target.select()} />
        <div className="grid grid-cols-2 gap-3">
          <button className="btn" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied!" : "Copy link"}</button>
          <a className="btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(`Join my network: ${link}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
        </div>
        <button className="btn-ghost w-full" onClick={() => r.push(`/dashboard/sessions/${done.sessionId}`)}>Open dashboard</button>
      </div></main></>);
  }

  return (<><Nav /><main className="mx-auto max-w-xl px-5 py-8">
    <ol className="mb-6 flex gap-2" aria-label="Progress">{STEPS.map((s, i) => <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-white/10"}`} aria-current={i === step ? "step" : undefined}><span className="sr-only">{s}</span></li>)}</ol>
    <div className="card space-y-4">
      <h1 className="text-2xl font-bold">{["Session information", "VCF configuration", "WhatsApp redirect", "Visibility", "Review"][step]}</h1>
      {step === 0 && <>
        <div><label className="label" htmlFor="n">Session name</label><input id="n" className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Nairobi Creators Network" /></div>
        <div><label className="label" htmlFor="d">Description</label><textarea id="d" className="input" rows={3} maxLength={500} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div><label className="label" htmlFor="t">Target contacts</label><input id="t" type="number" min={1} max={100000} className="input" value={f.target} onChange={(e) => set("target", Number(e.target.value))} /></div>
        <div><label className="label" htmlFor="rg">Main country</label><select id="rg" className="input" value={f.region} onChange={(e) => set("region", e.target.value)}>{[["KE", "Kenya"], ["NG", "Nigeria"], ["UG", "Uganda"], ["TZ", "Tanzania"], ["GH", "Ghana"], ["OTHER", "Other"]].map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div></>}
      {step === 1 && <>
        <div><label className="label" htmlFor="p">Contact prefix</label><input id="p" className="input" maxLength={20} value={f.prefix} onChange={(e) => set("prefix", e.target.value)} /><p className="mt-1 text-xs text-zinc-500">Contacts will be saved as {f.prefix || "CYMOR"} 001, {f.prefix || "CYMOR"} 002...</p></div>
        <div><label className="label" htmlFor="v">VCF filename</label><input id="v" className="input" value={f.vcfFilename} onChange={(e) => set("vcfFilename", e.target.value)} /></div></>}
      {step === 2 && <div><label className="label" htmlFor="w">WhatsApp group or community link (optional)</label><input id="w" className="input" placeholder="https://chat.whatsapp.com/..." value={f.whatsappUrl} onChange={(e) => set("whatsappUrl", e.target.value)} /><p className="mt-1 text-xs text-zinc-500">After joining, participants get a button that takes them to this link.</p></div>}
      {step === 3 && <>
        {[["PUBLIC", "Anyone can discover and join."], ["UNLISTED", "Only people with the link can join."], ["PRIVATE", "Requires an access code."]].map(([v, d]) => (
          <label key={v} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${f.visibility === v ? "border-brand bg-brand/10" : "border-white/10"}`}>
            <input type="radio" name="vis" checked={f.visibility === v} onChange={() => set("visibility", v)} /><span><b>{v}</b><br /><span className="text-sm text-zinc-400">{d}</span></span></label>))}
        {f.visibility === "PRIVATE" && <div><label className="label" htmlFor="ac">Access code (4+ characters)</label><input id="ac" className="input" value={f.accessCode} onChange={(e) => set("accessCode", e.target.value)} /></div>}</>}
      {step === 4 && <dl className="space-y-2 text-sm">{[["Name", f.name], ["Target", f.target], ["Prefix", f.prefix], ["File", f.vcfFilename], ["WhatsApp link", f.whatsappUrl || "None"], ["Visibility", f.visibility]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-zinc-400">{k}</dt><dd className="truncate font-medium">{v}</dd></div>)}</dl>}
      <ErrorNote msg={err} />
      <div className="flex gap-3">
        {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 4 ? <button className="btn flex-1" disabled={!valid} onClick={() => setStep(step + 1)}>Continue</button>
          : <button className="btn flex-1" disabled={busy} onClick={create}>{busy ? "Creating..." : "Create Session"}</button>}
      </div>
    </div></main></>);
}

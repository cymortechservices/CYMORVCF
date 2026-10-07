"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { api, post, Session } from "@/lib/api";
import { Logo, Progress, Skeleton, ErrorNote, CountUp } from "@/components/ui";

export default function Join() {
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<Session | null>(null); const [err, setErr] = useState("");
  const [open, setOpen] = useState(false); const [phone, setPhone] = useState(""); const [code, setCode] = useState("");
  const [captcha, setCaptcha] = useState(""); const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [busy, setBusy] = useState(false); const [ok, setOk] = useState<{ contacts: number; whatsappUrl: string | null } | null>(null);
  useEffect(() => { api<Session>(`/api/sessions/${id}`).then((r) => setS(r.data)).catch((e) => setErr(e.message)); }, [id]);

  useEffect(() => {
    if (!siteKey || !open) return;
    (window as any).onTurnstile = (tok: string) => setCaptcha(tok);
    const sc = document.createElement("script"); sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; sc.async = true; document.head.appendChild(sc);
    return () => { sc.remove(); };
  }, [siteKey, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { setOk((await post(`/api/sessions/${id}/join`, { phone, accessCode: code || undefined, captchaToken: captcha || undefined })).data as any); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8">
      <div className="mb-6 text-center"><Logo /></div>
      {!s && !err && <Skeleton className="h-72" />}
      {!s && err && <div className="card text-center"><ErrorNote msg={err} /></div>}
      {s && !ok && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-soft">You've been invited</p>
          <h1 className="mt-2 text-3xl font-bold">{s.name}</h1>
          {s.description && <p className="mt-2 text-sm text-zinc-400">{s.description}</p>}
          <p className="mt-5 text-sm text-zinc-400">Help this network reach {s.target.toLocaleString()}</p>
          <p className="text-4xl font-extrabold"><CountUp to={s.contacts} /> <span className="text-lg text-brand-soft">{Math.round(s.progress)}%</span></p>
          <div className="mt-3"><Progress value={s.progress} /></div>
          <ul className="mt-5 space-y-1 text-sm text-zinc-300"><li>Build connections.</li><li>Grow your WhatsApp network.</li><li>Become part of the community.</li></ul>
          {s.status !== "ACTIVE" ? <p className="mt-6 text-sm text-zinc-400">This session isn't accepting contacts right now.</p>
            : !open ? <button className="btn mt-6 w-full !py-4 text-base" onClick={() => setOpen(true)}>Join Session</button>
            : <form onSubmit={submit} className="mt-6 space-y-3 text-left">
                <p className="text-sm text-zinc-300">Enter your WhatsApp number with country code. It's added to this session's contact list, and the creator can export it.</p>
                <div><label className="label" htmlFor="ph">Your number</label><input id="ph" inputMode="tel" autoComplete="tel" className="input" placeholder="+254 712 345 678" required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                {s.requiresCode && <div><label className="label" htmlFor="ac">Access code</label><input id="ac" className="input" value={code} onChange={(e) => setCode(e.target.value)} /></div>}
                {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} data-callback="onTurnstile" />}
                <ErrorNote msg={err} />
                <button className="btn w-full !py-4" disabled={busy}>{busy ? "Joining..." : "Confirm and join"}</button>
              </form>}
        </motion.div>)}
      {ok && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card text-center">
          <p className="text-5xl" aria-hidden>✓</p>
          <h1 className="mt-2 text-2xl font-bold">You're now part of the network.</h1>
          <p className="mt-2 text-brand-mint">+1 contact added</p>
          {ok.whatsappUrl ? <a href={ok.whatsappUrl} target="_blank" rel="noreferrer" className="btn mt-6 w-full !py-4">Continue to WhatsApp</a> : <p className="mt-4 text-sm text-zinc-400">You're all set.</p>}
          <p className="mt-4 text-xs text-zinc-500">Saving contacts may widen your potential Status audience, depending on WhatsApp privacy settings. Not guaranteed.</p>
        </motion.div>)}
    </main>
  );
}

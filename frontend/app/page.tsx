"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import FloatingNumbers from "@/components/FloatingNumbers";
import { Nav, Footer, Progress, CountUp, Reveal } from "@/components/ui";

const steps = [
  ["01", "Create", "Create a campaign and define your target."],
  ["02", "Share", "Share your unique CYMOR link."],
  ["03", "Grow", "Participants join and contacts are added."],
  ["04", "Export", "Clean your list and export your VCF."],
];
const flow = ["Contact", "Save", "Connect", "Network", "Potential reach"];

export default function Home() {
  // Demo data only. No real users.
  const stats = [["Total contacts", 347], ["Unique", 329], ["Duplicates", 18], ["Countries", 12]] as const;
  return (
    <>
      <div className="relative overflow-hidden">
        <FloatingNumbers />
        <Nav />
        <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-14 text-center sm:pt-24">
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight sm:text-7xl">
            Build your network.<br /><span className="bg-gradient-to-r from-brand-soft to-brand-mint bg-clip-text text-transparent">Grow your reach.</span>
          </motion.h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg">Create a contact campaign, invite people with one simple link, watch your network grow in real time and export your finished VCF whenever you're ready.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/create" className="btn w-full sm:w-auto">Create a Session</Link>
            <Link href="/explore" className="btn-ghost w-full sm:w-auto">Explore Sessions</Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">Built for communities, creators, businesses and WhatsApp network builders.</p>

          <Reveal delay={0.1}>
            <div className="card mx-auto mt-14 max-w-3xl text-left" aria-label="Demo dashboard preview">
              <div className="flex items-center justify-between text-sm"><span className="font-semibold">Nairobi Creators Network</span><span className="text-brand-mint">LIVE ●</span></div>
              <p className="mt-4 text-3xl font-bold"><CountUp to={347} /> <span className="text-zinc-500">/ 500</span> <span className="text-base text-brand-soft">69.4%</span></p>
              <div className="mt-3"><Progress value={69.4} label="Demo campaign progress" /></div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map(([l, v]) => <div key={l} className="rounded-xl bg-white/5 p-3"><p className="text-xs text-zinc-400">{l}</p><p className="text-xl font-semibold"><CountUp to={v} /></p></div>)}
              </div>
              <svg viewBox="0 0 300 70" className="mt-5 h-20 w-full" role="img" aria-label="Demo contact growth chart">
                <motion.path d="M0 62 C40 58 60 50 100 44 S170 30 210 20 S270 8 300 4" fill="none" stroke="#7c5cff" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
              </svg>
            </div>
          </Reveal>
        </section>
      </div>

      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-bold">How CYMOR VCF works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, t, d], i) => <Reveal key={n} delay={i * 0.08}><div className="card h-full"><p className="font-mono text-sm text-brand-soft">{n}</p><h3 className="mt-2 text-xl font-semibold">{t}</h3><p className="mt-1 text-sm text-zinc-400">{d}</p></div></Reveal>)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="card">
          <h2 className="text-3xl font-bold">Turn contacts into a growing network.</h2>
          <p className="mt-3 max-w-3xl text-zinc-300">Many people create VCF campaigns to grow their WhatsApp network. When people save each other's numbers, they may become part of each other's potential WhatsApp Status audience, depending on WhatsApp's privacy and audience settings. Nothing is guaranteed.</p>
          <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            {flow.map((f, i) => (
              <motion.li key={f} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="flex items-center gap-2">
                <span className="rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 uppercase tracking-wider">{f}</span>{i < flow.length - 1 && <span aria-hidden className="text-zinc-500">→</span>}
              </motion.li>))}
          </ol>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-3xl font-bold">Clean. Organize. Export.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[["Real-time growth", "Watch contacts arrive live, with progress and activity updating instantly."], ["Smart duplicates", "Numbers are normalised, so 0712345678 and +254712345678 count once."], ["Valid VCF export", "Download clean VCF, CSV or TXT whenever you're ready."], ["Privacy first", "Public pages never show phone numbers. You control every session."], ["Three visibility modes", "Public, unlisted or private with an access code."], ["Built for mobile", "Joining takes seconds, even from a WhatsApp link."]].map(([t, d], i) => <Reveal key={t} delay={i * 0.05}><div className="card h-full"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-zinc-400">{d}</p></div></Reveal>)}
        </div>
      </section>
      <section id="faq" className="mx-auto max-w-3xl px-5 py-10">
        <h2 className="text-3xl font-bold">FAQ</h2>
        {[["Does this guarantee WhatsApp Status views?", "No. More saved connections can mean a larger potential audience, depending on everyone's WhatsApp privacy settings."], ["Who can see the numbers?", "Only you as the creator. Public pages show counts, never numbers."], ["Is it free to join a session?", "Yes. Participants only enter their number and join."]].map(([q, a]) => <details key={q} className="card mt-3"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-zinc-400">{a}</p></details>)}
      </section>
      <section className="mx-auto max-w-6xl px-5 py-10 text-center">
        <h2 className="text-3xl font-bold">One link. One growing network.</h2>
        <Link href="/create" className="btn mt-6">Create a Session</Link>
      </section>
      <Footer />
    </>
  );
}

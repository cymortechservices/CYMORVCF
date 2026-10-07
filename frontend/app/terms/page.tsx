import { Nav, Footer } from "@/components/ui";
const sections: string[] = ["Acceptable use|Only collect numbers from people who chose to join. No spam, harassment or deceptive campaigns.","Contact data|Creators are responsible for how they use exported contact data.","Accounts and sessions|Sessions belong to their creator. We may suspend accounts or sessions that abuse the platform.","Third parties and WhatsApp|Cymor VCF is independent and not affiliated with WhatsApp or Meta. No Status views or reach are guaranteed."];
export default function Page() {
  return (<><Nav /><main className="mx-auto max-w-3xl px-5 py-10"><h1 className="text-3xl font-bold">Terms of Service</h1>
    <p className="mt-2 text-sm text-zinc-500">Draft structure. Replace with reviewed legal text before launch.</p>
    {sections.map((s) => { const [h, b] = s.split("|"); return <section key={h} className="mt-6"><h2 className="text-lg font-semibold">{h}</h2><p className="mt-1 text-zinc-400">{b}</p></section>; })}
  </main><Footer /></>);
}

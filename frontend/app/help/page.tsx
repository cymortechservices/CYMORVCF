import { Nav, Footer } from "@/components/ui";
const faq = [
  ["What is CYMOR VCF?", "A tool for running collaborative contact campaigns: create a session, share one link, collect contacts and export a VCF."],
  ["Does this guarantee WhatsApp Status views?", "No. Saved contacts may become part of each other's potential Status audience, depending on each person's WhatsApp privacy settings."],
  ["Who can see phone numbers?", "Only the session creator and platform administrators. Public pages never show numbers."],
  ["How are duplicates handled?", "Numbers are normalised, so 0712345678 and +254712345678 count as the same number. Duplicates are blocked and counted."],
  ["How do I delete my data?", "Creators can delete contacts or whole sessions in the dashboard. For anything else, contact CYMOR TECH SERVICES."],
];
export default function Help() {
  return (<><Nav /><main className="mx-auto max-w-3xl px-5 py-10"><h1 className="text-3xl font-bold">Help</h1>
    {faq.map(([q, a]) => <section key={q} className="mt-6"><h2 className="text-lg font-semibold">{q}</h2><p className="mt-1 text-zinc-400">{a}</p></section>)}
    <p className="mt-10 text-xs text-zinc-500">Cymor VCF is an independent service and is not affiliated with WhatsApp or Meta.</p></main><Footer /></>);
}

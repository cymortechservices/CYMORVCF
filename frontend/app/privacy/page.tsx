import { Nav, Footer } from "@/components/ui";
const sections: string[] = ["What data we collect|Account details for creators; phone numbers submitted by participants to a session.","Why numbers are processed|To build the contact list of the session a participant chose to join, and to detect duplicates.","How sessions work|Creators control their sessions and can pause, export or delete them. Public pages never show phone numbers.","Retention and deletion|Contacts are kept until the creator or an admin deletes them. Deletion requests: contact CYMOR TECH SERVICES."];
export default function Page() {
  return (<><Nav /><main className="mx-auto max-w-3xl px-5 py-10"><h1 className="text-3xl font-bold">Privacy Policy</h1>
    <p className="mt-2 text-sm text-zinc-500">Draft structure. Replace with reviewed legal text before launch.</p>
    {sections.map((s) => { const [h, b] = s.split("|"); return <section key={h} className="mt-6"><h2 className="text-lg font-semibold">{h}</h2><p className="mt-1 text-zinc-400">{b}</p></section>; })}
  </main><Footer /></>);
}

import Link from "next/link";
export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-5 text-center"><div><p className="text-6xl font-bold text-brand-soft">404</p><h1 className="mt-3 text-2xl font-semibold">Page not found</h1><Link href="/" className="btn mt-6">Back home</Link></div></main>;
}

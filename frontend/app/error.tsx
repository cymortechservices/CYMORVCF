"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center px-5 text-center"><div><p className="text-6xl font-bold text-brand-soft">500</p><h1 className="mt-3 text-2xl font-semibold">Something went wrong</h1><p className="mt-2 text-zinc-400">Please try again.</p><button className="btn mt-6" onClick={reset}>Try again</button></div></main>;
}

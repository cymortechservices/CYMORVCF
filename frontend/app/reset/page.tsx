"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { post } from "@/lib/api";
import { Logo, ErrorNote } from "@/components/ui";
function Form() {
  const r = useRouter(); const token = useSearchParams().get("token") ?? ""; const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  return (<form className="card w-full max-w-sm space-y-4" onSubmit={async (e) => { e.preventDefault(); try { await post("/api/auth/reset", { token, password: pw }); r.push("/login"); } catch (x: any) { setErr(x.message); } }}>
    <Logo /><h1 className="text-2xl font-bold">Choose a new password</h1>
    <div><label className="label" htmlFor="p">New password</label><input id="p" type="password" minLength={8} required className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></div><ErrorNote msg={err} /><button className="btn w-full">Update password</button></form>);
}
export default function Reset() { return <main className="grid min-h-screen place-items-center px-5"><Suspense><Form /></Suspense></main>; }

"use client";
import { useState } from "react";
import { post } from "@/lib/api";
import { Logo, ErrorNote } from "@/components/ui";
export default function Forgot() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [err, setErr] = useState("");
  return (<main className="grid min-h-screen place-items-center px-5"><form className="card w-full max-w-sm space-y-4" onSubmit={async (e) => { e.preventDefault(); try { await post("/api/auth/forgot", { email }); setSent(true); } catch (x: any) { setErr(x.message); } }}>
    <Logo /><h1 className="text-2xl font-bold">Reset your password</h1>
    {sent ? <p className="text-sm text-zinc-300">If that email has an account, a reset link is on its way.</p> : <>
      <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div><ErrorNote msg={err} /><button className="btn w-full">Send reset link</button></>}
  </form></main>);
}

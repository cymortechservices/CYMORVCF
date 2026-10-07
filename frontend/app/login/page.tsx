"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { Logo, ErrorNote } from "@/components/ui";

export default function Login() {
  const r = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ email: "", password: "", displayName: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await post(`/api/auth/${mode}`, mode === "login" ? { email: f.email, password: f.password } : f); r.push("/dashboard"); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <Logo /><h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        {mode === "register" && <div><label className="label" htmlFor="dn">Display name</label><input id="dn" className="input" required minLength={2} value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} /></div>}
        <div><label className="label" htmlFor="em">Email</label><input id="em" type="email" className="input" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" className="input" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <ErrorNote msg={err} />
        <button className="btn w-full" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</button>
        <button type="button" className="w-full text-sm text-zinc-400 hover:text-white" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
        {mode === "login" && <a href="/forgot" className="block text-center text-xs text-zinc-500 hover:text-white">Forgot password?</a>}
      </form>
    </main>
  );
}

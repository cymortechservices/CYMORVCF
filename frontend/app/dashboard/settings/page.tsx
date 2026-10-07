"use client";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { useMe } from "@/components/useMe";
import { Skeleton } from "@/components/ui";

export default function Settings() {
  const me = useMe(); const r = useRouter();
  return (
    <main className="mx-auto max-w-2xl px-5 py-6"><h1 className="text-3xl font-bold">Settings</h1>
      {!me ? <Skeleton className="mt-5 h-32" /> : <div className="card mt-5 space-y-2 text-sm">
        <p><span className="text-zinc-400">Name:</span> {me.displayName}</p><p><span className="text-zinc-400">Email:</span> {me.email} {me.emailVerified ? "(verified)" : "(not verified)"}</p>
        <button className="btn-ghost mt-3" onClick={async () => { await post("/api/auth/logout", {}); r.push("/"); }}>Log out</button></div>}
      <p className="mt-6 text-xs text-zinc-500">To change your password use "Forgot password" on the login page. To delete your account or data, contact CYMOR TECH SERVICES.</p>
    </main>);
}

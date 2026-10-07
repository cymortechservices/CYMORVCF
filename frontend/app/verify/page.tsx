"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { post } from "@/lib/api";
function V() {
  const token = useSearchParams().get("token") ?? ""; const [s, setS] = useState("Verifying...");
  useEffect(() => { post("/api/auth/verify-email", { token }).then(() => setS("Email verified.")).catch((e) => setS(e.message)); }, [token]);
  return <div className="card text-center"><p>{s}</p><Link href="/dashboard" className="btn mt-4">Go to dashboard</Link></div>;
}
export default function Verify() { return <main className="grid min-h-screen place-items-center px-5"><Suspense><V /></Suspense></main>; }

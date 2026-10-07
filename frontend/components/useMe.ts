"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
export interface Me { id: string; email: string; displayName: string; role: "USER" | "SUPERADMIN"; emailVerified: boolean }

/** Client-side redirect for UX only. Every API route enforces auth and roles on the server. */
export function useMe(role?: "SUPERADMIN") {
  const r = useRouter(); const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    api<Me>("/api/auth/me").then((x) => { if (role && x.data.role !== role) r.replace("/403"); else setMe(x.data); })
      .catch((e) => r.replace(e.status === 429 ? "/429" : "/login"));
  }, [r, role]);
  return me;
}

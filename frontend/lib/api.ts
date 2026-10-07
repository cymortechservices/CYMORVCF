export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? API_URL;

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<{ data: T; meta?: any }> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  } catch { throw new ApiError(0, "Can't reach the server. Check your connection and try again."); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Something went wrong. Please try again.");
  return body;
}
export const post = (path: string, data: unknown) => api(path, { method: "POST", body: JSON.stringify(data) });
export const patch = (path: string, data: unknown) => api(path, { method: "PATCH", body: JSON.stringify(data) });
export const del = (path: string) => api(path, { method: "DELETE" });
export const siteUrl = () => (typeof window !== "undefined" ? window.location.origin : "");

/** Authenticated file download (VCF/CSV/TXT). */
export async function download(path: string) {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, "Export failed. Please try again.");
  const url = URL.createObjectURL(await res.blob()); const a = document.createElement("a");
  a.href = url; a.download = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "contacts.vcf"; a.click(); URL.revokeObjectURL(url);
}
export const timeAgo = (d: string | Date) => {
  const s = Math.max(1, Math.round((Date.now() - +new Date(d)) / 1000));
  return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago`;
};
export interface Session { sessionId: string; name: string; description: string; target: number; contacts: number; progress: number; status: string; visibility: string; region?: string; createdAt: string; requiresCode?: boolean; creator?: string; duplicates?: number; whatsappUrl?: string; prefix?: string; vcfFilename?: string; owner?: string }
export interface Activity { _id: string; type: string; message: string; createdAt: string; sessionId?: any }

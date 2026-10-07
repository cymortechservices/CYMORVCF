export interface Row { createdAt: Date | string; country?: string; countryCode?: string }
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function computeAnalytics(rows: Row[], o: { days?: number | null; now?: Date; target?: number } = {}) {
  const now = o.now ?? new Date();
  const all = rows.map((r) => ({ ...r, t: new Date(r.createdAt) }));
  const since = o.days ? new Date(now.getTime() - o.days * 864e5) : null;
  const list = all.filter((r) => !since || r.t >= since);
  const total = list.length;

  const byDay = new Map<string, number>(); const perHour: number[] = Array(24).fill(0);
  const cmap = new Map<string, { country: string; code: string; count: number }>();
  let first = Infinity;
  for (const r of list) {
    byDay.set(dayKey(r.t), (byDay.get(dayKey(r.t)) ?? 0) + 1);
    perHour[r.t.getUTCHours()]++;
    first = Math.min(first, r.t.getTime());
    const code = r.countryCode ?? "??"; const c = cmap.get(code) ?? { country: r.country ?? "Unknown", code, count: 0 };
    c.count++; cmap.set(code, c);
  }
  const startDay = since ?? (total ? new Date(first) : now);
  const perDay: { date: string; count: number; cumulative: number }[] = [];
  let cum = 0;
  const d = new Date(Date.UTC(startDay.getUTCFullYear(), startDay.getUTCMonth(), startDay.getUTCDate()));
  for (let i = 0; i < 400 && d <= now; i++, d.setUTCDate(d.getUTCDate() + 1)) {
    const n = byDay.get(dayKey(d)) ?? 0; cum += n; perDay.push({ date: dayKey(d), count: n, cumulative: cum });
  }
  const week = 7 * 864e5;
  const last7 = all.filter((r) => r.t.getTime() > now.getTime() - week).length;
  const prev7 = all.filter((r) => r.t.getTime() <= now.getTime() - week && r.t.getTime() > now.getTime() - 2 * week).length;
  const growthRate = last7 === 0 && prev7 === 0 ? null : prev7 === 0 ? 100 : Math.round(((last7 - prev7) / prev7) * 1000) / 10;
  const maxHour = Math.max(...perHour);
  const countries = [...cmap.values()].sort((a, b) => b.count - a.count).map((c) => ({ ...c, pct: total ? Math.round((c.count / total) * 1000) / 10 : 0 }));
  const hours = total ? Math.max(1, (now.getTime() - first) / 36e5) : 1;
  return {
    total, perDay, perHour: perHour.map((count, hour) => ({ hour, count })), peakHour: total ? perHour.indexOf(maxHour) : null,
    avgPerDay: perDay.length ? Math.round((total / perDay.length) * 10) / 10 : 0, avgPerHour: Math.round((total / hours) * 100) / 100,
    growthRate, countries, completion: o.target ? Math.min(100, Math.round((all.length / o.target) * 1000) / 10) : null,
  };
}
export const rangeToDays = (r: unknown) => (r === "7" ? 7 : r === "30" ? 30 : r === "90" ? 90 : null);

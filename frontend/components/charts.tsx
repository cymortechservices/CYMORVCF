"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tip = { contentStyle: { background: "#0d0f17", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, fontSize: 12 } };
const axis = { stroke: "#71717a", fontSize: 11, tickLine: false, axisLine: false } as const;

export function GrowthChart({ data, dataKey = "cumulative" }: { data: { date: string; [k: string]: any }[]; dataKey?: string }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Growth chart">
      <ResponsiveContainer><AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} /><stop offset="100%" stopColor="#7c5cff" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="date" {...axis} tickFormatter={(d) => String(d).slice(5)} minTickGap={24} /><YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tip} /><Area type="monotone" dataKey={dataKey} stroke="#7c5cff" strokeWidth={2.5} fill="url(#g)" animationDuration={900} />
      </AreaChart></ResponsiveContainer>
    </div>);
}
export function BarsChart({ data, x, y }: { data: any[]; x: string; y: string }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Bar chart">
      <ResponsiveContainer><BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey={x} {...axis} minTickGap={12} /><YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tip} cursor={{ fill: "rgba(255,255,255,.04)" }} /><Bar dataKey={y} fill="#34d399" radius={[6, 6, 0, 0]} animationDuration={900} />
      </BarChart></ResponsiveContainer>
    </div>);
}

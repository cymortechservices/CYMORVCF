"use client";
import { useEffect, useState } from "react";

const PREFIXES = ["+254 7", "+254 1", "+234 8", "+256 7", "+255 7", "+233 5"];
interface Item { text: string; left: number; size: number; o: number; d: number; s: number; blur: number }

/** Decorative masked numbers only. No real data. */
export default function FloatingNumbers({ count = 16 }: { count?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    setItems(Array.from({ length: count }, (_, i) => ({
      text: `${PREFIXES[i % PREFIXES.length]}XX XXX XXX`,
      left: Math.random() * 92, size: 11 + Math.random() * 6, o: 0.1 + Math.random() * 0.2,
      d: 22 + Math.random() * 26, s: -Math.random() * 40, blur: Math.random() > 0.6 ? 1.5 : 0,
    })));
  }, [count]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, i) => (
        <span key={i} className="drift absolute bottom-0 whitespace-nowrap font-mono text-brand-soft"
          style={{ left: `${it.left}%`, fontSize: it.size, filter: `blur(${it.blur}px)`, ["--o" as string]: it.o, ["--d" as string]: `${it.d}s`, ["--s" as string]: `${it.s}s` }}>
          {it.text}
        </span>
      ))}
    </div>
  );
}

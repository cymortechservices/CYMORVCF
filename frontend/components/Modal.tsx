"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Confirm({ open, title, body, confirmLabel = "Confirm", danger, onConfirm, onCancel }:
  { open: boolean; title: string; body: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; ref.current?.focus(); const k = (e: KeyboardEvent) => e.key === "Escape" && onCancel(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open, onCancel]);
  return (
    <AnimatePresence>{open && (
      <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
        <motion.div role="dialog" aria-modal="true" aria-label={title} className="card w-full max-w-sm bg-[#0d0f17]" initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm text-zinc-400">{body}</p>
          <div className="mt-5 flex justify-end gap-3">
            <button className="btn-ghost !py-2" onClick={onCancel}>Cancel</button>
            <button ref={ref} className={`btn !py-2 ${danger ? "!bg-red-600 !shadow-red-600/20" : ""}`} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </motion.div>
      </motion.div>)}
    </AnimatePresence>
  );
}

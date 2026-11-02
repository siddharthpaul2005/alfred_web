/**
 * ALFRED's signature visual: the core. A watch-bezel ring of ticks, slow
 * counter-rotating orbits, the permission gate ring and a lit centre.
 * Pure SVG + CSS animation, so it stays sharp at any size and costs almost nothing.
 */
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { onPulse, type PulseKind } from "../lib";

const PULSE_COLOR: Record<PulseKind, string> = { act: "var(--color-accent-soft)", ask: "#fbbf24", done: "#4ade80" };

const TICKS = Array.from({ length: 144 }, (_, i) => i);
const NODES = [0, 1, 2, 3, 4, 5];

export function Core({ className = "" }: { className?: string }) {
  // Every action on the page sends a ring of light out from the centre.
  const [rings, setRings] = useState<{ id: number; kind: PulseKind }[]>([]);
  useEffect(
    () =>
      onPulse((kind) => {
        const id = Date.now() + Math.random();
        setRings((r) => [...r.slice(-3), { id, kind }]);
        setTimeout(() => setRings((r) => r.filter((x) => x.id !== id)), 1800);
      }),
    [],
  );

  return (
    <div className={`pointer-events-none relative aspect-square select-none text-fg ${className}`} aria-hidden="true">
      <div className="glow-accent breathe absolute inset-[28%] rounded-full opacity-70" />
      <svg viewBox="0 0 800 800" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <radialGradient id="core-fill" cx="50%" cy="42%" r="60%">
            <stop offset="0" stopColor="var(--color-canvas)" stopOpacity="0.95" />
            <stop offset="0.25" stopColor="var(--color-accent-soft)" stopOpacity="0.8" />
            <stop offset="0.6" stopColor="var(--color-accent)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="arc" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-accent-soft)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--color-accent-soft)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* outer bezel */}
        <g className="spin" style={{ ["--d" as string]: "240s" }}>
          {TICKS.map((i) => (
            <line
              key={i}
              x1="400"
              y1="18"
              x2="400"
              y2={i % 12 === 0 ? 44 : 30}
              transform={`rotate(${i * 2.5} 400 400)`}
              stroke="currentColor"
              strokeOpacity={i % 12 === 0 ? 0.32 : 0.1}
              strokeWidth={i % 12 === 0 ? 1.5 : 1}
            />
          ))}
        </g>
        <circle cx="400" cy="400" r="350" fill="none" stroke="currentColor" strokeOpacity="0.06" />

        {/* device orbit with nodes */}
        <g className="spin-rev" style={{ ["--d" as string]: "90s" }}>
          <circle cx="400" cy="400" r="290" fill="none" stroke="currentColor" strokeOpacity="0.09" strokeDasharray="2 10" />
          {NODES.map((i) => {
            const a = (i / NODES.length) * Math.PI * 2;
            const x = 400 + Math.cos(a) * 290;
            const y = 400 + Math.sin(a) * 290;
            return (
              <g key={i}>
                <line x1="400" y1="400" x2={x} y2={y} stroke="var(--color-accent-soft)" strokeOpacity="0.07" />
                <circle cx={x} cy={y} r="9" fill="var(--color-canvas)" stroke="var(--color-accent-soft)" strokeOpacity="0.5" />
                <circle cx={x} cy={y} r="2.5" fill="var(--color-accent-soft)" />
              </g>
            );
          })}
        </g>

        {/* agent ring with a travelling light arc */}
        <circle cx="400" cy="400" r="215" fill="none" stroke="currentColor" strokeOpacity="0.1" />
        <g className="spin" style={{ ["--d" as string]: "9s" }}>
          <circle cx="400" cy="400" r="215" fill="none" stroke="url(#arc)" strokeWidth="2" strokeLinecap="round" strokeDasharray="230 1121" />
        </g>
        <g className="spin-rev" style={{ ["--d" as string]: "14s" }}>
          <circle cx="400" cy="400" r="215" fill="none" stroke="var(--color-accent-soft)" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="40 1311" />
        </g>

        {/* permission gate */}
        <circle cx="400" cy="400" r="150" fill="none" stroke="#fbbf24" strokeOpacity="0.18" strokeDasharray="1 7" />
        <circle cx="400" cy="400" r="122" fill="none" stroke="currentColor" strokeOpacity="0.14" />

        <AnimatePresence>
          {rings.map((r) => (
            <motion.circle
              key={r.id}
              cx="400"
              cy="400"
              fill="none"
              stroke={PULSE_COLOR[r.kind]}
              initial={{ r: 120, opacity: 0.8, strokeWidth: 3 }}
              animate={{ r: 360, opacity: 0, strokeWidth: 0.5 }}
              transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </AnimatePresence>

        {/* lit centre */}
        <circle cx="400" cy="400" r="120" fill="url(#core-fill)" className="breathe" />
        <circle cx="400" cy="400" r="58" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
        <circle cx="400" cy="400" r="6" fill="currentColor" />
      </svg>
    </div>
  );
}

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { story } from "../data";
import { Eyebrow } from "../components/ui";

const ACCENT = "#a9b9ff";
const WAIT = "#fbbf24";
const OK = "#4ade80";
const CORE = { x: 320, y: 220 };
const devices = [
  { name: "Phone", y: 100 },
  { name: "Laptop", y: 180 },
  { name: "PC", y: 260 },
  { name: "Telegram", y: 340 },
];
const agentNodes = [
  { name: "Email", y: 120 },
  { name: "Files", y: 220 },
  { name: "Calendar", y: 320 },
];
const ledger = ["task.submitted", "step.approved · user:phone", "step.done · files.move"];

function Pulse({ from, to, color, delay = 0 }: { from: [number, number]; to: [number, number]; color: string; delay?: number }) {
  return (
    <motion.circle
      r="4.5"
      fill={color}
      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      initial={{ cx: from[0], cy: from[1], opacity: 0 }}
      animate={{ cx: [from[0], to[0]], cy: [from[1], to[1]], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function Node({ x, y, label, state }: { x: number; y: number; label: string; state: "idle" | "on" | "wait" | "ok" }) {
  const stroke = state === "on" ? ACCENT : state === "wait" ? WAIT : state === "ok" ? OK : "rgba(255,255,255,0.14)";
  return (
    <g>
      <motion.rect
        x={x - 55}
        y={y - 20}
        width="110"
        height="40"
        rx="12"
        fill="#0c0c0e"
        animate={{ stroke }}
        strokeWidth="1"
        transition={{ duration: 0.4 }}
        style={state !== "idle" ? { filter: `drop-shadow(0 0 14px ${stroke}55)` } : undefined}
      />
      <text x={x} y={y + 5} textAnchor="middle" className="fill-fg font-sans text-[13px]" opacity={state === "idle" ? 0.55 : 1}>
        {label}
        {state === "ok" ? " ✓" : ""}
      </text>
    </g>
  );
}

function Diagram({ step }: { step: number }) {
  const dev = (name: string) => (step === 0 && name === "Phone" ? "on" : step === 2 && name === "Phone" ? "wait" : "idle");
  const agent = (name: string) => (name === "Files" && step >= 3 ? (step === 3 ? "on" : "ok") : "idle");

  return (
    <svg viewBox="0 0 640 460" className="w-full" role="img" aria-label="How a request flows through ALFRED">
      {/* wires */}
      {devices.map((d) => (
        <motion.line
          key={d.name}
          x1="150" y1={d.y} x2={CORE.x - 52} y2={CORE.y}
          animate={{ stroke: dev(d.name) === "on" ? ACCENT : dev(d.name) === "wait" ? WAIT : "rgba(255,255,255,0.08)" }}
        />
      ))}
      {agentNodes.map((a) => (
        <motion.line
          key={a.name}
          x1={CORE.x + 52} y1={CORE.y} x2="490" y2={a.y}
          animate={{ stroke: agent(a.name) !== "idle" ? ACCENT : "rgba(255,255,255,0.08)" }}
        />
      ))}

      {/* gate ring */}
      <motion.circle
        cx={CORE.x} cy={CORE.y} r="82" fill="none" strokeDasharray="3 6"
        animate={{ stroke: step === 2 ? WAIT : "rgba(255,255,255,0.12)", strokeWidth: step === 2 ? 2 : 1 }}
      />
      <AnimatePresence>
        {step === 2 && (
          <motion.text
            key="gate"
            x={CORE.x} y={CORE.y + 112} textAnchor="middle"
            className="font-mono text-[12px]" fill={WAIT}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            T2 · email.send → asks you
          </motion.text>
        )}
      </AnimatePresence>

      {/* core */}
      <motion.circle cx={CORE.x} cy={CORE.y} r="70" fill={ACCENT} animate={{ opacity: step === 1 ? 0.22 : 0.1 }} style={{ filter: "blur(18px)" }} />
      <circle cx={CORE.x} cy={CORE.y} r="52" fill="#0c0c0e" stroke="rgba(255,255,255,0.5)" />
      <g style={{ transformOrigin: `${CORE.x}px ${CORE.y}px`, animation: `spin-cw ${step === 1 ? 1.2 : 4}s linear infinite` }}>
        <circle cx={CORE.x} cy={CORE.y} r="52" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeDasharray="60 267" />
      </g>
      <text x={CORE.x} y={CORE.y + 5} textAnchor="middle" className="fill-fg font-sans text-[14px] font-medium tracking-[0.12em]">ALFRED</text>

      {/* plan chips */}
      <AnimatePresence>
        {step === 1 &&
          ["1 search", "2 save", "3 move", "4 send"].map((c, i) => (
            <motion.g key={c} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.12 }}>
              <rect x={196 + i * 64} y="104" width="58" height="24" rx="12" fill="#141417" stroke="rgba(169,185,255,0.45)" />
              <text x={225 + i * 64} y="120" textAnchor="middle" className="fill-accent-soft font-mono text-[11px]">{c}</text>
            </motion.g>
          ))}
      </AnimatePresence>

      {devices.map((d) => (
        <Node key={d.name} x={95} y={d.y} label={d.name} state={dev(d.name)} />
      ))}
      {agentNodes.map((a) => (
        <Node key={a.name} x={545} y={a.y} label={a.name} state={agent(a.name)} />
      ))}

      {/* pulses */}
      {step === 0 && <Pulse key="p0" from={[150, 100]} to={[CORE.x - 52, CORE.y]} color={ACCENT} />}
      {step === 2 && <Pulse key="p2" from={[CORE.x - 52, CORE.y]} to={[150, 100]} color={WAIT} />}
      {step === 3 && <Pulse key="p3" from={[CORE.x + 52, CORE.y]} to={[490, 220]} color={ACCENT} />}

      {/* audit ledger */}
      <rect x="170" y="382" width="300" height="80" rx="12" fill="#0c0c0e" stroke={step === 4 ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.08)"} />
      <text x="186" y="402" className="fill-fg-2 font-sans text-[11px] font-medium">Audit log</text>
      <AnimatePresence>
        {step === 4 &&
          ledger.map((l, i) => (
            // Slide the group, not the text: motion's x on <text> is a transform added to the x attribute.
            <motion.g key={l} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.15 }}>
              <text x="186" y={421 + i * 14} className="font-mono text-[11px]">
                <tspan fill="rgb(125 211 252 / 0.6)">{["8a0b4c2e", "3f19d7a1", "c27e90b4"][i]}</tspan>
                <tspan dx="10" fill={["#a9b9ff", "#4ade80", "#4ade80"][i]}>{l.split(" · ")[0]}</tspan>
                {l.includes(" · ") && <tspan fill="#6b6862">{" · " + l.split(" · ")[1]}</tspan>}
              </text>
            </motion.g>
          ))}
      </AnimatePresence>
    </svg>
  );
}

/** Pinned scroll story: the page scrolls, the scene stays and advances one step at a time. */
export function Story() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(story.length - 1, Math.max(0, Math.floor(v * story.length)))));
  const s = story[step];

  return (
    <section id="how" ref={ref} className="relative h-[460vh]">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div className="glow-accent absolute right-[-10%] top-1/2 h-[600px] w-[600px] -translate-y-1/2 opacity-[0.15]" />
        <div className="container-page grid w-full items-center gap-5 pt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <Eyebrow>How it works</Eyebrow>
            <div className="mt-4 flex gap-1.5 sm:mt-6">
              {story.map((_, i) => (
                <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-fg/[0.08]">
                  <motion.div className="h-full bg-accent" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                </div>
              ))}
            </div>
            <div className="relative mt-5 min-h-[220px] sm:mt-8 sm:min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="font-mono text-[13px] text-accent-soft">{String(step + 1).padStart(2, "0")} / {String(story.length).padStart(2, "0")}</p>
                  <h2 className="display mt-3 text-[32px] text-balance sm:mt-4 sm:text-[60px]">{s.title}</h2>
                  <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-fg-2 text-pretty sm:mt-6 sm:text-[19px]">{s.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="card mx-auto max-w-[360px] rounded-[24px] p-2 sm:max-w-none sm:rounded-[28px] sm:p-6">
              <Diagram step={step} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

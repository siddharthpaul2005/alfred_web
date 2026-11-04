import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { story } from "../data";
import { Eyebrow } from "../components/ui";

const ACCENT = "#a9b9ff";
const WAIT = "#fbbf24";
const OK = "#4ade80";
const CORE = { x: 320, y: 200 };
const R = 42; // core radius
const devices = [
  { name: "Phone", y: 92, dot: "#3ddc84" },
  { name: "Laptop", y: 160, dot: "#a5b4fc" },
  { name: "PC", y: 228, dot: "#00a4ef" },
  { name: "Telegram", y: 296, dot: "#26a5e4" },
];
const agentNodes = [
  { name: "Email", y: 126, dot: "#f59e0b" },
  { name: "Files", y: 200, dot: "#4ade80" },
  { name: "Calendar", y: 274, dot: "#f472b6" },
];
const ledger = [
  { hash: "8a0b4c2e", kind: "task.submitted", detail: "", color: ACCENT },
  { hash: "3f19d7a1", kind: "step.approved", detail: "user:phone", color: OK },
  { hash: "c27e90b4", kind: "step.done", detail: "files.move", color: OK },
];

// Soft S-curves from each chip into the core, so the wiring reads as one system.
const inWire = (y: number) => `M 168 ${y} C 230 ${y}, 236 ${CORE.y}, ${CORE.x - R} ${CORE.y}`;
const outWire = (y: number) => `M ${CORE.x + R} ${CORE.y} C 404 ${CORE.y}, 410 ${y}, 472 ${y}`;

/** A spark travelling along a wire. Native SVG animateMotion keeps it on the curve. */
function Spark({ path, color, reverse = false }: { path: string; color: string; reverse?: boolean }) {
  return (
    <circle r="3.5" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
      <animateMotion dur="1.6s" repeatCount="indefinite" path={path} keyPoints={reverse ? "1;0" : "0;1"} keyTimes="0;1" calcMode="linear" />
    </circle>
  );
}

function Chip({ x, y, label, dot, state, align }: { x: number; y: number; label: string; dot: string; state: "idle" | "on" | "wait" | "ok"; align: "left" | "right" }) {
  const ring = state === "on" ? ACCENT : state === "wait" ? WAIT : state === "ok" ? OK : "rgba(255,255,255,0.07)";
  const w = 128;
  const left = align === "left" ? x : x - w;
  return (
    <g>
      <motion.rect
        x={left} y={y - 17} width={w} height="34" rx="17"
        fill="rgba(255,255,255,0.025)" strokeWidth="1"
        animate={{ stroke: ring }} transition={{ duration: 0.4 }}
        style={state !== "idle" ? { filter: `drop-shadow(0 0 12px ${ring}66)` } : undefined}
      />
      <circle cx={left + 18} cy={y} r="3.5" fill={dot} opacity={state === "idle" ? 0.55 : 1} />
      <text x={left + 32} y={y + 4.5} className="fill-fg font-sans text-[13px]" opacity={state === "idle" ? 0.5 : 1}>
        {label}
      </text>
      {state === "ok" && (
        <path d={`M ${left + w - 26} ${y} l 4 4 l 8 -8`} fill="none" stroke={OK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </g>
  );
}

function Diagram({ step }: { step: number }) {
  const dev = (name: string) => (step === 0 && name === "Phone" ? "on" : step === 2 && name === "Phone" ? "wait" : "idle");
  const agent = (name: string) => (name === "Files" && step >= 3 ? (step === 3 ? "on" : "ok") : "idle");
  const wireColor = (st: string) => (st === "on" || st === "ok" ? ACCENT : st === "wait" ? WAIT : "rgba(255,255,255,0.06)");

  return (
    <svg viewBox="0 0 640 470" className="w-full" role="img" aria-label="How a request flows through ALFRED">
      <defs>
        <radialGradient id="story-core" cx="50%" cy="40%" r="65%">
          <stop offset="0" stopColor="#1d1f2a" />
          <stop offset="1" stopColor="#0e0e10" />
        </radialGradient>
      </defs>

      {/* wires */}
      {devices.map((d) => (
        <motion.path key={d.name} d={inWire(d.y)} fill="none" strokeWidth="1.2" animate={{ stroke: wireColor(dev(d.name)) }} />
      ))}
      {agentNodes.map((a) => (
        <motion.path key={a.name} d={outWire(a.y)} fill="none" strokeWidth="1.2" animate={{ stroke: wireColor(agent(a.name)) }} />
      ))}

      {/* sparks */}
      {step === 0 && <Spark path={inWire(92)} color={ACCENT} />}
      {step === 2 && <Spark path={inWire(92)} color={WAIT} reverse />}
      {step === 3 && <Spark path={outWire(200)} color={ACCENT} />}

      {/* permission gate: only shows when ALFRED stops to ask */}
      <AnimatePresence>
        {step === 2 && (
          <motion.g key="gate" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ transformOrigin: `${CORE.x}px ${CORE.y}px` }}>
            <circle cx={CORE.x} cy={CORE.y} r={R + 16} fill="none" stroke={WAIT} strokeOpacity="0.7" strokeWidth="1.2" strokeDasharray="2 5" />
            <rect x={CORE.x - 62} y={CORE.y + 70} width="124" height="26" rx="13" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.4)" />
            <text x={CORE.x} y={CORE.y + 87} textAnchor="middle" className="font-sans text-[12px]" fill={WAIT}>Waiting for your yes</text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* core */}
      <motion.circle cx={CORE.x} cy={CORE.y} r={R + 26} fill={ACCENT} animate={{ opacity: step === 1 ? 0.16 : 0.07 }} style={{ filter: "blur(22px)" }} />
      <circle cx={CORE.x} cy={CORE.y} r={R} fill="url(#story-core)" stroke="rgba(255,255,255,0.16)" />
      <g style={{ transformOrigin: `${CORE.x}px ${CORE.y}px`, animation: `spin-cw ${step === 1 ? 1.2 : 5}s linear infinite` }}>
        <circle cx={CORE.x} cy={CORE.y} r={R} fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="40 224" />
      </g>
      <text x={CORE.x} y={CORE.y + 4} textAnchor="middle" className="fill-fg font-sans text-[11px] font-medium tracking-[0.22em]">ALFRED</text>

      {/* plan: four steps line up above the core */}
      <AnimatePresence>
        {step === 1 &&
          ["Search", "Save", "Move", "Send"].map((c, i) => (
            <motion.g key={c} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.12 }}>
              <rect x={204 + i * 60} y="96" width="52" height="24" rx="12" fill="rgba(169,185,255,0.08)" stroke="rgba(169,185,255,0.35)" />
              <text x={230 + i * 60} y="112" textAnchor="middle" className="fill-accent-soft font-sans text-[11px]">{c}</text>
              {i < 3 && <path d={`M ${257 + i * 60} 108 h 6`} stroke="rgba(169,185,255,0.4)" />}
            </motion.g>
          ))}
      </AnimatePresence>

      {devices.map((d) => (
        <Chip key={d.name} x={40} y={d.y} label={d.name} dot={d.dot} state={dev(d.name)} align="left" />
      ))}
      {agentNodes.map((a) => (
        <Chip key={a.name} x={600} y={a.y} label={a.name} dot={a.dot} state={agent(a.name)} align="right" />
      ))}

      {/* audit ledger */}
      <motion.rect
        x="140" y="350" width="360" height="104" rx="16" fill="rgba(255,255,255,0.025)"
        animate={{ stroke: step === 4 ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.07)" }}
      />
      <text x="162" y="377" className="fill-fg-2 font-sans text-[12px] font-medium">Audit log</text>
      <AnimatePresence>
        {step === 4 && (
          <motion.text key="intact" x="478" y="377" textAnchor="end" className="font-sans text-[11px]" fill={OK} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            chain intact
          </motion.text>
        )}
      </AnimatePresence>
      <line x1="162" x2="478" y1="388" y2="388" stroke="rgba(255,255,255,0.06)" />
      {step < 4 && <text x="162" y="414" className="fill-fg-3 font-sans text-[12px]">Every step lands here.</text>}
      <AnimatePresence>
        {step === 4 &&
          ledger.map((l, i) => (
            // Slide the group, not the text: motion's x on <text> is a transform added to the x attribute.
            <motion.g key={l.hash} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.15 }}>
              <circle cx="166" cy={405 + i * 18} r="2.5" fill={l.color} />
              <text x="178" y={409 + i * 18} className="font-mono text-[11px]">
                <tspan fill="rgba(125,211,252,0.55)">{l.hash}</tspan>
                <tspan dx="12" fill={l.color}>{l.kind}</tspan>
                {l.detail && <tspan fill="#6b6862">{"  " + l.detail}</tspan>}
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

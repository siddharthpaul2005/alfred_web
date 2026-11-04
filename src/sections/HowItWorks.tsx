import { AnimatePresence, motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { agents, type Tier } from "../data";
import { Reveal, Section, SectionHead, TierBadge } from "../components/ui";

const manifesto =
  "AI got very good at answering questions. It never learned to take responsibility for the work. ALFRED is built the other way around. It opens the file, moves money only when you say yes, writes everything down, and keeps going when you close the laptop.";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
}

/** Words light up one by one as the paragraph scrolls through the screen. */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = manifesto.split(" ");
  return (
    <Section>
      <p ref={ref} className="display max-w-5xl text-[30px] leading-[1.15] tracking-[-0.035em] text-pretty sm:text-[42px] lg:text-[50px]">
        {words.map((w, i) => (
          <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
        ))}
      </p>
    </Section>
  );
}

/** Each agent's own colour, used for its tile, its wire and the detail card. */
const AGENT_COLOR: Record<string, string> = {
  Email: "#4f6bff",
  Calendar: "#8b5cf6",
  Files: "#14b8a6",
  Research: "#3b82f6",
  Dev: "#06b6d4",
  System: "#6366f1",
  Messaging: "#10b981",
  Media: "#d946ef",
  Phone: "#0ea5e9",
  Hands: "#f43f5e",
};

/** A soft two-tone fill from a lighter shade of the agent's colour into the colour itself. */
const fillOf = (c: string) => `linear-gradient(145deg, color-mix(in oklab, ${c} 62%, white), ${c})`;

const ICONS: Record<string, string> = {
  Email: "M4 7h16v10H4z M4 7l8 6 8-6",
  Calendar: "M5 6h14v13H5z M5 10h14 M9 4v4 M15 4v4",
  Files: "M5 5h6l2 2h6v12H5z",
  Research: "M11 5a6 6 0 1 1 0 12a6 6 0 0 1 0-12z M16 16l4 4",
  Dev: "M9 8l-4 4 4 4 M15 8l4 4-4 4",
  System: "M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8z M12 3v3 M12 18v3 M3 12h3 M18 12h3",
  Messaging: "M5 6h14v9H9l-4 3z",
  Media: "M8 6l10 6-10 6z",
  Phone: "M8 3h8v18H8z M11 18h2",
  Hands: "M8 12V6a1.5 1.5 0 0 1 3 0v5 M11 11V5a1.5 1.5 0 0 1 3 0v6 M14 11V7a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L8 14",
};

export function Agents() {
  const [sel, setSel] = useState(0);
  const [auto, setAuto] = useState(true);
  const a = agents[sel];

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setSel((s) => (s + 1) % agents.length), 3200);
    return () => clearInterval(t);
  }, [auto]);

  const pick = (i: number) => {
    setAuto(false);
    setSel(i);
  };

  const R = 205;
  const pos = (i: number) => {
    const ang = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
    return { x: 280 + Math.cos(ang) * R, y: 280 + Math.sin(ang) * R, ang };
  };
  const p = pos(sel);
  const hue = AGENT_COLOR[a.name];
  return (
    <Section id="agents">
      <SectionHead
        eyebrow="Agents"
        dim="One brain."
        title="Many hands."
        body="A single orchestrator knows every agent, every device and every task. Ten specialist agents do the work. Only one of them, Hands, is ever allowed to click on your screen."
      />

      <Reveal className="mt-10 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[560px]">
          {/* soft wash in the selected agent's colour */}
          <motion.div
            className="absolute inset-[18%] rounded-full blur-3xl"
            animate={{ backgroundColor: hue, opacity: 0.18 }}
            transition={{ duration: 0.8 }}
          />
          <svg viewBox="0 0 560 560" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="spoke" gradientUnits="userSpaceOnUse" x1="280" y1="280" x2={p.x} y2={p.y}>
                <stop offset="0" stopColor={hue} stopOpacity="0" />
                <stop offset="1" stopColor={hue} stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* orbit track, with a slow travelling highlight */}
            <circle cx="280" cy="280" r={R} fill="none" className="stroke-line" />
            <g style={{ transformOrigin: "280px 280px", animation: "spin-cw 40s linear infinite" }}>
              <circle cx="280" cy="280" r={R} fill="none" stroke="var(--color-fg)" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="120 1168" strokeLinecap="round" />
            </g>
            {/* only the active agent is wired up */}
            <motion.line key={`l${sel}`} x1="280" y1="280" x2={p.x} y2={p.y} stroke="url(#spoke)" strokeWidth="1.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} />
            <motion.circle key={`d${sel}`} r="3.5" fill={hue}
              initial={{ cx: 280, cy: 280, opacity: 0 }}
              animate={{ cx: p.x, cy: p.y, opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>

          {/* the core: a dark, solid centre so it reads as the brain on a light page */}
          <div className="absolute left-1/2 top-1/2 grid size-[28%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#2a2c38,#111113_70%)] shadow-[0_30px_60px_-20px_rgb(20_19_17/0.55),inset_0_1px_0_rgb(255_255_255/0.12)]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" style={{ animation: "spin-cw 6s linear infinite" }} aria-hidden="true">
              <circle cx="50" cy="50" r="48" fill="none" stroke={hue} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="34 268" style={{ transition: "stroke .6s" }} />
            </svg>
            <div className="text-center">
              <p className="text-[13px] font-medium tracking-[0.22em] text-[#f4f2ed] sm:text-[15px]">ALFRED</p>
              <p className="mt-1 text-[10px] text-[#8c877e] sm:text-[11px]">orchestrator</p>
            </div>
          </div>

          {agents.map((ag, i) => {
            const { x, y } = pos(i);
            const on = i === sel;
            const c = AGENT_COLOR[ag.name];
            return (
              <button
                key={ag.name}
                onClick={() => pick(i)}
                onMouseEnter={() => pick(i)}
                aria-pressed={on}
                aria-label={`${ag.name} agent`}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                style={{ left: `${(x * 100) / 560}%`, top: `${(y * 100) / 560}%` }}
              >
                <span
                  className={`grid size-11 place-items-center rounded-2xl transition-all duration-300 sm:size-14 ${
                    on ? "scale-110" : "bg-surface shadow-[0_1px_0_rgb(20_19_17/0.04),0_8px_20px_-12px_rgb(20_19_17/0.35)] group-hover:-translate-y-0.5"
                  }`}
                  style={on ? { background: fillOf(c), color: "#fff", boxShadow: `0 14px 32px -10px ${c}` } : { color: c }}
                >
                  <svg viewBox="0 0 24 24" className="size-5 sm:size-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICONS[ag.name]} />
                  </svg>
                </span>
                <span className={`hidden text-[12px] transition-colors sm:block ${on ? "font-medium text-fg" : "text-fg-3"}`}>{ag.name}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
        {/* aura: a soft glow around the card in the selected agent's colour */}
        <motion.div
          aria-hidden="true"
          className="absolute -inset-5 rounded-[44px] blur-2xl"
          animate={{ background: `radial-gradient(60% 70% at 30% 20%, ${hue}, transparent 70%), radial-gradient(60% 70% at 80% 90%, #3d5afe, transparent 70%)`, opacity: 0.32 }}
          transition={{ duration: 0.8 }}
        />
        <div className="card relative min-h-[360px] overflow-hidden rounded-[28px] p-8 sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: fillOf(hue) }}>
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[a.name]} /></svg>
                  </span>
                  <p className="font-mono text-[12px] text-fg-3">{a.name.toLowerCase()}.*</p>
                </div>
                {a.hands && <span className="rounded-full border border-wait/30 px-2.5 py-0.5 font-mono text-[11px] text-wait">guarded</span>}
              </div>
              <h3 className="display mt-5 text-[40px] sm:text-[48px]">{a.name}</h3>
              <p className="mt-4 max-w-md text-[17px] leading-relaxed text-fg-2">{a.desc}</p>
              <div className="mt-8 space-y-2">
                {a.tiers.map((t, k) =>
                  t ? (
                    <div key={k} className="flex items-center gap-4 rounded-xl border border-line bg-canvas/50 px-4 py-3">
                      <TierBadge tier={k as Tier} />
                      <span className="text-[15px] text-fg">{t}</span>
                    </div>
                  ) : null,
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        </div>
      </Reveal>
    </Section>
  );
}

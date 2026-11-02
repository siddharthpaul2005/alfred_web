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
          <svg viewBox="0 0 560 560" className="absolute inset-0 size-full" aria-hidden="true">
            <circle cx="280" cy="280" r={R} fill="none" className="stroke-line-strong" />
            <circle cx="280" cy="280" r="130" fill="none" className="stroke-line" strokeDasharray="2 8" />
            {agents.map((_, i) => {
              const ang = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
              const on = i === sel;
              return (
                <motion.line
                  key={i}
                  x1="280" y1="280" x2={280 + Math.cos(ang) * R} y2={280 + Math.sin(ang) * R}
                  animate={{ stroke: on ? "var(--color-accent)" : "var(--color-line)", strokeWidth: on ? 1.5 : 1 }}
                  transition={{ duration: 0.4 }}
                />
              );
            })}
            <motion.circle
              key={sel}
              r="4" className="fill-accent"
              initial={{ cx: 280, cy: 280, opacity: 0 }}
              animate={{
                cx: 280 + Math.cos((sel / agents.length) * Math.PI * 2 - Math.PI / 2) * R,
                cy: 280 + Math.sin((sel / agents.length) * Math.PI * 2 - Math.PI / 2) * R,
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>

          {/* the core */}
          <div className="absolute left-1/2 top-1/2 grid size-[30%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-surface shadow-[0_0_80px_-10px_var(--color-accent),inset_0_1px_0_rgb(255_255_255/0.08)]">
            <div className="text-center">
              <p className="text-[15px] font-medium tracking-[0.1em] sm:text-[17px]">ALFRED</p>
              <p className="mt-1 font-mono text-[10px] text-fg-3 sm:text-[11px]">orchestrator</p>
            </div>
          </div>

          {agents.map((ag, i) => {
            const ang = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
            const on = i === sel;
            return (
              <button
                key={ag.name}
                onClick={() => pick(i)}
                onMouseEnter={() => pick(i)}
                aria-pressed={on}
                aria-label={`${ag.name} agent`}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                style={{ left: `${50 + (Math.cos(ang) * R * 100) / 560}%`, top: `${50 + (Math.sin(ang) * R * 100) / 560}%` }}
              >
                <span
                  className={`grid size-11 place-items-center rounded-2xl border transition-all duration-300 sm:size-14 ${
                    on
                      ? "scale-110 border-accent-soft/70 bg-raised text-fg shadow-[0_0_30px_-4px_var(--color-accent)]"
                      : ag.hands
                        ? "border-wait/30 bg-surface text-fg-2 group-hover:text-fg"
                        : "border-line-strong bg-surface text-fg-2 group-hover:text-fg"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="size-5 sm:size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICONS[ag.name]} />
                  </svg>
                </span>
                <span className={`hidden text-[12px] transition-colors sm:block ${on ? "text-fg" : "text-fg-3"}`}>{ag.name}</span>
              </button>
            );
          })}
        </div>

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
                <p className="font-mono text-[12px] text-accent-soft">{a.name.toLowerCase()}.*</p>
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
      </Reveal>
    </Section>
  );
}

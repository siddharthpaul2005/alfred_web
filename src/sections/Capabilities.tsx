import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SurfaceLogo } from "../components/SurfaceLogo";
import { prefersReducedMotion, pulse } from "../lib";
import { pickVoice } from "../voice";
import { Reveal, Section, SectionHead } from "../components/ui";

function Card({ tag, title, body, children, className = "" }: { tag: string; title: string; body: string; children?: ReactNode; className?: string }) {
  return (
    <Reveal className={className}>
      <article className="card group relative flex h-full flex-col overflow-hidden rounded-[24px] p-6 transition-colors duration-500 hover:border-line-strong sm:p-7">
        <div className="glow-accent absolute -right-24 -top-24 size-64 opacity-0 transition-opacity duration-700 group-hover:opacity-25" />
        <p className="text-[13px] font-medium text-accent-soft">{tag}</p>
        <h3 className="display mt-2 text-[28px] sm:text-[32px]">{title}</h3>
        <p className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-fg-2">{body}</p>
        {children && <div className="relative mt-6 flex-1">{children}</div>}
      </article>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Reach: one task travelling between your devices through the PC hub */
/* ------------------------------------------------------------------ */

// Shared coordinate box: the SVG wires and the HTML tiles both use it, so they line up at any width.
const BOX = { w: 600, h: 230 };
const HUB = { x: 300, y: 115 };

const devices = [
  { id: "phone", label: "Phone", logo: "Android", color: "#3ddc84", x: 78, y: 52 },
  { id: "laptop", label: "Laptop", logo: "Laptop", color: "#6366f1", x: 78, y: 178 },
  { id: "telegram", label: "Telegram", logo: "Telegram", color: "#26a5e4", x: 522, y: 52 },
  { id: "web", label: "Web", logo: "Web", color: "#f59e0b", x: 522, y: 178 },
] as const;
type DeviceId = (typeof devices)[number]["id"];

// The story the loop tells, one beat at a time.
const beats: { caption: string; wires: DeviceId[]; inbound: boolean; badge?: { on: DeviceId; text: string } }[] = [
  { caption: "You start a task on your laptop", wires: ["laptop"], inbound: true },
  { caption: "Your PC asks your phone for a yes", wires: ["phone"], inbound: false, badge: { on: "phone", text: "Approve?" } },
  { caption: "Approved from your phone", wires: ["phone"], inbound: true, badge: { on: "phone", text: "Approved" } },
  { caption: "The result lands everywhere", wires: ["laptop", "telegram", "web"], inbound: false },
];

// A soft S-curve from the hub out to a device.
const wire = (x: number, y: number) => {
  const mx = (x + HUB.x) / 2;
  return `M ${HUB.x} ${HUB.y} C ${mx} ${HUB.y}, ${mx} ${y}, ${x} ${y}`;
};
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function Constellation() {
  const [beat, setBeat] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });

  // Only run the loop while it's on screen.
  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const t = window.setInterval(() => setBeat((b) => (b + 1) % beats.length), 2400);
    return () => clearInterval(t);
  }, [inView]);

  const b = beats[beat];
  const live = (id: DeviceId) => b.wires.includes(id);

  return (
    <div ref={ref} className="relative mx-auto mb-10 mt-2 w-full max-w-[600px]" style={{ aspectRatio: `${BOX.w} / ${BOX.h}` }}>
      <svg viewBox={`0 0 ${BOX.w} ${BOX.h}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          {devices.map((d) => (
            <linearGradient key={d.id} id={`wire-${d.id}`} gradientUnits="userSpaceOnUse" x1={HUB.x} y1={HUB.y} x2={d.x} y2={d.y}>
              <stop offset="0%" stopColor="#3d5afe" />
              <stop offset="100%" stopColor={d.color} />
            </linearGradient>
          ))}
        </defs>
        {devices.map((d) => {
          const path = wire(d.x, d.y);
          const on = live(d.id);
          return (
            <g key={d.id}>
              {/* resting wire */}
              <path d={path} fill="none" className="stroke-fg/10" strokeWidth="1.5" />
              {/* lit wire for this beat */}
              <motion.path
                d={path}
                fill="none"
                stroke={`url(#wire-${d.id})`}
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* a spark riding the wire, in the direction the task is moving */}
              {on && (
                <circle key={`${beat}-${d.id}`} r="4.5" fill={b.inbound ? d.color : "#3d5afe"}>
                  <animateMotion dur="1.1s" fill="freeze" path={path} keyPoints={b.inbound ? "1;0" : "0;1"} keyTimes="0;1" calcMode="linear" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="1.1s" fill="freeze" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* device tiles */}
      {devices.map((d) => {
        const on = live(d.id);
        const badge = b.badge?.on === d.id ? b.badge : undefined;
        const right = d.x > HUB.x;
        return (
          <div key={d.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(d.x, BOX.w), top: pct(d.y, BOX.h) }}>
            <motion.div
              animate={{ scale: on ? 1.08 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative flex size-12 items-center justify-center rounded-2xl bg-surface sm:size-14"
              style={{
                color: d.color,
                boxShadow: on
                  ? `0 0 0 1.5px ${d.color}, 0 10px 30px -8px ${d.color}88`
                  : "0 0 0 1px rgb(24 22 18 / 0.08), 0 8px 20px -10px rgb(24 22 18 / 0.25)",
                transition: "box-shadow .5s",
              }}
            >
              <SurfaceLogo name={d.logo} className="size-6 sm:size-7" />
              <AnimatePresence>
                {badge && (
                  <motion.span
                    key={badge.text}
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${badge.text === "Approved" ? "bg-ok" : "bg-wait"}`}
                  >
                    {badge.text === "Approved" ? "✓ Approved" : badge.text}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
            <p className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[13px] transition-colors duration-500 ${right ? "left-full ml-3" : "right-full mr-3"} ${on ? "text-fg" : "text-fg-3"}`}>
              {d.label}
            </p>
          </div>
        );
      })}

      {/* the hub: your PC, holding the one task list */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(HUB.x, BOX.w), top: pct(HUB.y, BOX.h) }}>
        <motion.span
          key={beat}
          className="absolute inset-0 rounded-[20px] border border-accent"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <div className="relative flex items-center gap-3 rounded-[20px] bg-[#141311] py-3 pl-3 pr-5 shadow-[0_20px_40px_-16px_rgb(20_19_17/0.6)]">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.07] text-[#00a4ef]">
            <SurfaceLogo name="Windows PC" className="size-5" />
          </span>
          <span>
            <span className="block text-[14px] font-medium text-white">Your PC</span>
            <span className="block font-mono text-[10.5px] text-white/50">one task list</span>
          </span>
        </div>
      </div>

      {/* caption for the current beat */}
      <div className="absolute inset-x-0 -bottom-9 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={beat}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-[13px] text-fg-2"
          >
            <span className="font-mono text-[11px] text-fg-4">0{beat + 1}</span>
            {b.caption}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Voice: press play and ALFRED greets the visitor out loud            */
/* ------------------------------------------------------------------ */

function greeting() {
  const h = new Date().getHours();
  const part = h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${part}. I'm ALFRED. Tell me what you need, on any device you own, and consider it done.`;
}

const BARS = 36;

function Waveform() {
  const [text] = useState(greeting);
  const [speaking, setSpeaking] = useState(false);
  const [spoken, setSpoken] = useState(-1); // index of the last character reached, for the live caption
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const energy = useRef(0.25); // how loud the waveform looks right now
  const target = useRef(0.25); // where it is heading: a quiet hum when idle, syllable kicks while talking
  const talking = useRef(false);

  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.getVoices(); // voices load lazily in some browsers; this kicks it off
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  // Drive the bars from a small envelope instead of a fixed CSS loop, so they move like speech:
  // each spoken word kicks the level up, it decays between words, and the shape is fuller in the middle.
  const box = useRef<HTMLDivElement>(null);
  const onScreen = useInView(box);
  useEffect(() => {
    if (prefersReducedMotion() || !onScreen) return; // no work at all while it's off screen
    let raf = 0;
    const n = BARS;
    const tick = (now: number) => {
      const t = now / 1000;
      if (talking.current) target.current = Math.max(0.35, target.current * 0.965);
      else target.current = 0.25;
      energy.current += (target.current - energy.current) * 0.18;
      for (let i = 0; i < n; i++) {
        const el = bars.current[i];
        if (!el) continue;
        const centre = 1 - Math.abs(i - (n - 1) / 2) / (n / 2); // 1 in the middle, 0 at the edges
        const shape = 0.35 + 0.65 * Math.sin((centre * Math.PI) / 2);
        const wobble =
          0.55 + 0.25 * Math.sin(t * (6 + (i % 5)) + i * 1.7) + 0.2 * Math.sin(t * (11 + (i % 3) * 2) + i * 0.6);
        const h = Math.min(1, 0.06 + energy.current * shape * wobble * 1.35);
        el.style.transform = `scaleY(${h.toFixed(3)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onScreen]);

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      talking.current = false;
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-GB";
    u.rate = 1;
    u.pitch = 0.95;
    u.onstart = () => {
      talking.current = true;
      target.current = 0.9;
      setSpeaking(true);
      setSpoken(0);
      pulse("act");
    };
    u.onboundary = (e) => {
      target.current = 0.75 + Math.random() * 0.25; // a fresh word: kick the level up
      setSpoken(e.charIndex + (e.charLength || 1));
    };
    u.onend = u.onerror = () => {
      talking.current = false;
      setSpeaking(false);
      setSpoken(text.length);
    };
    synth.speak(u);
  }

  return (
    <div ref={box} className="flex h-full flex-col justify-between gap-5">
      {/* the exchange: you say the wake word, ALFRED answers */}
      <div className="space-y-2.5">
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-br-md bg-canvas px-3.5 py-2 text-[14px] text-fg-2">
            “Hey ALFRED”
            <span className="ml-2 font-mono text-[10.5px] text-fg-4">wake word</span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#141311] text-[10px] font-semibold tracking-[0.08em] text-white">A</span>
          <p className="rounded-2xl rounded-bl-md bg-[#141311] px-3.5 py-2.5 text-[14px] leading-snug">
            {/* live caption: words light up as they are spoken */}
            <span className="text-white">{spoken < 0 ? text : text.slice(0, spoken)}</span>
            <span className="text-white/35">{spoken < 0 ? "" : text.slice(spoken)}</span>
          </p>
        </div>
      </div>

      {/* the voice itself */}
      <div className="rounded-[20px] border border-line bg-canvas/60 p-3 pr-4">
        <div className="flex items-center gap-3">
          {supported && (
            <button
              onClick={toggle}
              aria-label={speaking ? "Stop ALFRED" : "Hear ALFRED say hello"}
              className="relative grid size-12 shrink-0 place-items-center rounded-full bg-fg text-canvas transition-colors hover:bg-accent"
            >
              {speaking &&
                [0, 1].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full border border-accent"
                    initial={{ opacity: 0.7, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.6 }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                  />
                ))}
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {speaking ? (
                  <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
                ) : (
                  <>
                    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none" />
                    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
                  </>
                )}
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
          <p className="text-[12px] text-fg-3">{speaking ? "Speaking, tap to interrupt" : supported ? "Tap to hear ALFRED" : "Speech isn't available here"}</p>
          <div className="mt-1 flex h-11 items-center justify-between" aria-hidden="true">
            {Array.from({ length: BARS }, (_, i) => (
              <span
                key={i}
                ref={(el) => {
                  bars.current[i] = el;
                }}
                className="h-full w-[3px] origin-center rounded-full transition-colors duration-500"
                style={{
                  transform: "scaleY(0.12)",
                  background: speaking ? "linear-gradient(to bottom, #8b5cf6, #3d5afe)" : "var(--color-fg-4)",
                }}
              />
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* what the voice can do */}
      <div className="flex flex-wrap gap-1.5">
        {["Wake word", "Interruptible", "Talks back"].map((c) => (
          <span key={c} className="rounded-full border border-line-strong px-2.5 py-1 text-[12px] text-fg-2">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function UiTree() {
  const rows = [
    { d: 0, t: "Window · WhatsApp" },
    { d: 1, t: "Pane · Chat with Priya" },
    { d: 2, t: "Edit · Type a message" },
    { d: 2, t: "Button · Send", hit: true },
  ];
  return (
    <div className="rounded-2xl border border-line bg-canvas/70 p-4 font-mono text-[12px]">
      {rows.map((r) => (
        <div
          key={r.t}
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${r.hit ? "bg-accent/10 text-fg shadow-[inset_0_0_0_1px_var(--color-accent)]" : "text-fg-3"}`}
          style={{ marginLeft: r.d * 16 }}
        >
          <span className="text-fg-4">{r.d ? "└" : "▸"}</span>
          {r.t}
          {r.hit && <span className="ml-auto text-accent-soft">click ✓</span>}
        </div>
      ))}
    </div>
  );
}

function Timeline() {
  const ev = [
    { t: "07:58", e: "Laptop battery 18%", a: "told you" },
    { t: "09:50", e: "Standup in 10 min", a: "opened notes" },
    { t: "13:02", e: "Invoice email arrived", a: "filed to Bills" },
  ];
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {ev.map((x, i) => (
        <motion.li
          key={x.t}
          className="relative"
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.25 }}
        >
          <span className="absolute -left-[24.5px] top-1.5 size-2 rounded-full bg-accent" />
          <p className="font-mono text-[12px] text-fg-3">{x.t}</p>
          <p className="text-[14px] text-fg">
            {x.e} <span className="text-fg-3">→ {x.a}</span>
          </p>
        </motion.li>
      ))}
    </ol>
  );
}

function Memory() {
  const chips = ["Siddharth → siddharth@…", "College folder → D:\\College", "Prefers PDF", "Standup · 10:00", "Mom → +91 …", "Never call after 22:00", "Priya → project sync"];
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c, i) => (
        <motion.span
          key={c}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.07 }}
          className="rounded-full border border-line-strong bg-canvas/60 px-3.5 py-1.5 font-mono text-[12px] text-fg-2"
        >
          {c}
        </motion.span>
      ))}
    </div>
  );
}

function Resume() {
  return (
    <div className="space-y-3">
      <div className="relative h-2 rounded-full bg-fg/[0.06]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          initial={{ width: "0%" }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ duration: 2.4, ease: "easeInOut", delay: 0.3 }}
        />
        <span className="absolute left-[46%] top-1/2 h-5 w-px -translate-y-1/2 bg-wait" />
      </div>
      <div className="flex justify-between font-mono text-[12px] text-fg-3">
        <span>Day 1 · started</span>
        <span className="text-wait">reboot</span>
        <span className="text-ok">Day 3 · done</span>
      </div>
    </div>
  );
}

function Verify() {
  return (
    <div className="space-y-2 font-mono text-[12px]">
      <div className="flex items-center justify-between rounded-lg border border-line bg-canvas/60 px-3 py-2 text-fg-2">
        files.move <span className="text-fg-3">→ D:\College</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-ok/25 bg-ok/[0.05] px-3 py-2 text-fg">
        verify: file present, checksum ok <span className="text-ok">✓</span>
      </div>
    </div>
  );
}

const small = [
  { t: "Live web, watched", b: "Search, read, summarize, and watch a page so ALFRED tells you the moment it changes." },
  { t: "Many hands at once", b: "Big goals split into independent steps that run at the same time across agents and devices." },
  { t: "Bring any tool", b: "New agents drop in without touching the core. Any MCP server can join, with risk tiers set on install." },
];

export function Capabilities() {
  return (
    <>
    <Section id="capabilities">
      <SectionHead
        eyebrow="Capabilities"
        dim="Not a chat window."
        title="A life that runs itself."
        body="Everything a real assistant should do, built on one rule: it acts on its own when an action can be undone, and asks you when it can't."
      />
      <div className="mt-12 grid gap-4 lg:grid-cols-6">
        <Card className="lg:col-span-4" tag="Reach" title="Every device. One ALFRED." body="Start a task on your laptop, approve it from your phone, see the result everywhere. One conversation and one task list, whichever device is in your hand.">
          <Constellation />
        </Card>
        <Card className="lg:col-span-2" tag="Voice" title="Just say it." body="Talk to it like a person. It listens, answers out loud, and stops the moment you cut in.">
          <Waveform />
        </Card>
      </div>
    </Section>
    <Section>
      <div className="grid gap-4 lg:grid-cols-6">
        <Card className="lg:col-span-2" tag="Act" title="Real hands in real apps." body="It reads each app's interface like a screen reader, so it clicks the button named Send, not a guess at pixels.">
          <UiTree />
        </Card>
        <Card className="lg:col-span-2" tag="Proactive" title="It doesn't wait to be asked." body="A heartbeat wakes ALFRED on a schedule and on events.">
          <Timeline />
        </Card>
        <Card className="lg:col-span-2" tag="Memory" title="Learns “Siddharth” once." body="Contacts, preferences and past outcomes, kept on your machine and searchable.">
          <Memory />
        </Card>
        <Card className="lg:col-span-3" tag="Endurance" title="Tasks that last for days." body="Every task is saved as it moves. It survives a reboot and picks up exactly where it stopped.">
          <Resume />
        </Card>
        <Card className="lg:col-span-3" tag="Verify" title="Done means checked." body="After every action ALFRED looks again. If the file isn't where it should be, the step fails honestly and re-plans.">
          <Verify />
        </Card>
      </div>
      <Reveal className="mt-4 grid gap-4 md:grid-cols-3">
        {small.map((s) => (
          <div key={s.t} className="rounded-[22px] border border-line p-5">
            <h4 className="text-[16px] font-medium tracking-[-0.015em]">{s.t}</h4>
            <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{s.b}</p>
          </div>
        ))}
      </Reveal>
    </Section>
    </>
  );
}

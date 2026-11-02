import { motion } from "motion/react";
import type { ReactNode } from "react";
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

function Constellation() {
  const nodes = [
    { x: 70, y: 50, l: "Phone" },
    { x: 70, y: 150, l: "Laptop" },
    { x: 530, y: 50, l: "Telegram" },
    { x: 530, y: 150, l: "Web" },
  ];
  return (
    <svg viewBox="0 0 600 200" className="mx-auto max-h-[180px] w-full" aria-hidden="true">
      {nodes.map((n, i) => (
        <g key={n.l}>
          <line x1="300" y1="100" x2={n.x} y2={n.y} className="stroke-accent/30" strokeDasharray="3 5" />
          <motion.circle
            r="3.5" className="fill-accent"
            animate={{ cx: [n.x, 300], cy: [n.y, 100], opacity: [0, 1, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }}
          />
          <rect x={n.x - 46} y={n.y - 17} width="92" height="34" rx="10" className="fill-surface stroke-line-strong" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" className="fill-fg-2 font-sans text-[13px]">{n.l}</text>
        </g>
      ))}
      <rect x="240" y="76" width="120" height="48" rx="14" className="fill-fg" />
      <text x="300" y="98" textAnchor="middle" className="fill-canvas font-sans text-[14px] font-medium">PC · hub</text>
      <text x="300" y="114" textAnchor="middle" className="fill-fg-4 font-mono text-[10px]">one task list</text>
    </svg>
  );
}

function Waveform() {
  return (
    <div className="flex h-full flex-col justify-end gap-5">
      <div className="flex h-16 items-center gap-[5px]" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="h-full w-[4px] rounded-full bg-fg/80"
            style={{ animation: `wave ${0.9 + ((i * 37) % 7) / 10}s ease-in-out ${-((i * 13) % 10) / 10}s infinite`, opacity: 0.35 + ((i * 29) % 10) / 15 }}
          />
        ))}
      </div>
      <p className="text-[15px] text-fg">“Clear my afternoon and tell everyone I'll be late.”</p>
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
        <Card className="lg:col-span-4" tag="Reach" title="Every device. One ALFRED." body="Start a task on your PC, approve it from your phone, see the result on your laptop. One conversation and one task list, whichever device is in your hand.">
          <Constellation />
        </Card>
        <Card className="lg:col-span-2" tag="Voice" title="Just say it." body="Wake word, streaming speech and spoken replies you can interrupt.">
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

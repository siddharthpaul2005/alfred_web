import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { dialRows, safety, tierName, tiers } from "../data";
import { hash } from "../lib";
import { Reveal, Section, SectionHead, TierBadge } from "../components/ui";

const levels = ["Ask always", "Ask for tier 2", "Trusted"];
const tierLine = { 0: "bg-fg-2/60", 1: "bg-t1", 2: "bg-wait" } as const;
const tierGlow = { 0: "bg-fg", 1: "bg-t1", 2: "bg-wait" } as const;

function AutonomyDial() {
  const [level, setLevel] = useState(1);
  return (
    <div className="card flex flex-col rounded-[28px] p-7 sm:p-9">
      <p className="text-[13px] font-medium text-accent-soft">Autonomy dial</p>
      <h3 className="mt-4 text-[28px] font-medium leading-tight tracking-[-0.03em]">You decide how much it does alone</h3>
      <div role="radiogroup" aria-label="Autonomy level" className="relative mt-7 grid grid-cols-3 rounded-full border border-line bg-canvas p-1">
        <motion.span
          className="absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-fg shadow-[0_4px_24px_-6px_var(--color-accent)]"
          animate={{ x: `${level * 100}%` }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        />
        {levels.map((l, i) => (
          <button
            key={l}
            role="radio"
            aria-checked={i === level}
            onClick={() => setLevel(i)}
            className={`relative z-10 rounded-full py-2 text-[13px] font-medium transition-colors ${i === level ? "text-canvas" : "text-fg-2 hover:text-fg"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mt-6 divide-y divide-line border-y border-line">
        {dialRows.map((r) => {
          const runs = r.tier === 0 || (r.tier === 1 && level !== 0) || (r.tier === 2 && level === 2 && !!r.trustable);
          return (
            <div key={r.label} className="flex items-center gap-3 py-3 text-[14px]">
              <TierBadge tier={r.tier} label={false} />
              <span className="min-w-0 flex-1 text-fg">{r.label}</span>
              <span className={`shrink-0 font-mono text-[12px] ${runs ? "text-ok" : "text-wait"}`}>{runs ? "runs alone" : "asks first"}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-auto pt-6 text-[13px] leading-relaxed text-fg-3">
        Trusted only skips a confirmation you've given five times with the exact same details. Payments and deletes never become automatic.
      </p>
    </div>
  );
}

const baseKinds = ["task.submitted", "step.dispatched", "step.approved", "step.done", "task.done", "autonomy.set"];
const swaps: Record<string, string> = { approved: "denied", dispatched: "cancelled", done: "failed", submitted: "cancelled", set: "reset" };
const link = (prev: string, i: number, kind: string) => hash(`${prev}|${i}|${kind}`);

function sealed() {
  let prev = "genesis";
  return baseKinds.map((kind, i) => {
    prev = link(prev, i, kind);
    return { kind, stored: prev, tampered: false };
  });
}

function AuditChain() {
  const [entries, setEntries] = useState(sealed);

  // Re-verify from scratch: the first mismatch breaks every entry after it.
  const brokenAt = useMemo(() => {
    let prev = "genesis";
    for (let i = 0; i < entries.length; i++) {
      if (link(prev, i, entries[i].kind) !== entries[i].stored) return i;
      prev = entries[i].stored;
    }
    return -1;
  }, [entries]);

  const tamper = (i: number) =>
    setEntries((es) =>
      es.map((e, k) => (k !== i || e.tampered ? e : { ...e, tampered: true, kind: e.kind.replace(/\.(\w+)$/, (_, v: string) => "." + (swaps[v] ?? v + " (edited)")) })),
    );

  return (
    <div className="card flex flex-col rounded-[28px] p-7 sm:p-9">
      <p className="text-[13px] font-medium text-accent-soft">Tamper-evident audit</p>
      <h3 className="mt-4 text-[28px] font-medium leading-tight tracking-[-0.03em]">Try to rewrite history</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-fg-2">Each entry's fingerprint includes the one before it. Edit any entry and everything after it breaks. Click one.</p>
      <ol className="mt-6 overflow-hidden rounded-2xl border border-line bg-canvas/60">
        {entries.map((e, i) => {
          const broken = brokenAt !== -1 && i >= brokenAt;
          return (
            <li key={i} className="border-line not-last:border-b">
              <button
                onClick={() => tamper(i)}
                className={`flex w-full items-center gap-4 px-4 py-2.5 text-left font-mono text-[12px] transition-colors hover:bg-surface ${broken ? "bg-bad/[0.06]" : ""}`}
                title="Tamper with this entry"
              >
                <span className="text-fg-3">#{String(i + 1).padStart(2, "0")}</span>
                <span className={`flex-1 ${e.tampered ? "text-bad line-through decoration-bad/40" : "text-fg"}`}>{e.kind}</span>
                <span className={broken ? "text-bad" : "text-fg-3"}>{e.stored.slice(0, 10)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex items-center justify-between gap-4">
        <p className={`font-mono text-[12px] ${brokenAt === -1 ? "text-ok" : "text-bad"}`}>
          {brokenAt === -1 ? `Verified · ${entries.length} entries intact` : `Broken at #${String(brokenAt + 1).padStart(2, "0")} · ${entries.length - brokenAt} entries untrusted`}
        </p>
        <button onClick={() => setEntries(sealed())} className="shrink-0 rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] text-fg-2 transition-colors hover:text-fg">
          Restore
        </button>
      </div>
    </div>
  );
}

export function Trust() {
  return (
    <>
    <Section id="trust">
      <SectionHead
        eyebrow="Trust"
        dim="No limits on reach."
        title="Real brakes."
        body="Giving an AI your whole computer only works if you can trust it with your whole computer. ALFRED's safety isn't a policy page. It's built into how every single step runs."
      />

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {tiers.map((t, i) => (
          <Reveal key={t.tier} delay={i * 0.08}>
            <div className="card relative h-full overflow-hidden rounded-[28px] p-8">
              <div className={`absolute inset-x-8 top-0 h-px ${tierLine[t.tier]}`} />
              <div className={`absolute -top-20 left-1/2 size-48 -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl ${tierGlow[t.tier]}`} />
              <div className="relative flex items-start justify-between">
                <span className="display text-[88px] leading-[0.8]">{t.tier}</span>
                <TierBadge tier={t.tier} />
              </div>
              <h3 className="relative mt-7 text-[22px] font-medium tracking-[-0.02em]">{tierName[t.tier]}</h3>
              <p className="relative mt-2 text-[15px] text-fg-2">{t.summary}</p>
              <ul className="relative mt-7 space-y-2.5 text-[15px] text-fg">
                {t.examples.map((x) => (
                  <li key={x} className="flex items-center gap-3">
                    <span className="h-px w-4 bg-fg-3" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-5 font-mono text-[12px] text-fg-3">Forgot to set a tier? It's treated as tier 2. When in doubt, ALFRED asks.</p>
    </Section>
    <Section>
      <Reveal className="grid gap-4 lg:grid-cols-2">
        <AutonomyDial />
        <AuditChain />
      </Reveal>
    </Section>
    <Section>
      <Reveal>
        <div className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {safety.map((x, i) => (
            <div key={x.title} className="bg-canvas p-8 transition-colors duration-500 hover:bg-surface">
              <p className="font-mono text-[12px] text-fg-3">{String(i + 1).padStart(2, "0")}</p>
              <h4 className="mt-6 text-[19px] font-medium tracking-[-0.02em]">{x.title}</h4>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-2">{x.body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
    </>
  );
}

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { scenarios, type Scenario } from "../data";
import { hash, prefersReducedMotion, pulse, sleep } from "../lib";
import { TierBadge } from "./ui";

type StepState = "hidden" | "pending" | "waiting" | "running" | "done" | "denied";
type TaskState = "idle" | "planning" | "running" | "awaiting approval" | "done" | "stopped";
type AuditLine = { id: string; hash: string; kind: string };

/** Plays one scenario: types the request, plans, gates, runs and records it. */
function useScenario(scenario: Scenario, active: boolean, onFinished: () => void, patient: boolean) {
  const [typed, setTyped] = useState("");
  const [steps, setSteps] = useState<StepState[]>([]);
  const [task, setTask] = useState<TaskState>("idle");
  const [approval, setApproval] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditLine[]>([]);
  // Resolves the approval card when the visitor taps Approve or Deny.
  const decide = useRef<((yes: boolean) => void) | null>(null);
  const finished = useRef(onFinished);
  finished.current = onFinished;

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const fast = prefersReducedMotion();
    const wait = (ms: number) => sleep(fast ? Math.min(ms, 150) : ms);
    let prev = "0000000000000000";
    const record = (kind: string) => {
      prev = hash(prev + kind + Date.now());
      const line = { id: prev + Math.random(), hash: prev.slice(0, 8), kind };
      setAudit((a) => [line, ...a].slice(0, 6));
      pulse(kind.startsWith("step.approval") ? "ask" : kind === "task.done" ? "done" : "act");
    };
    const set = (i: number, s: StepState) => setSteps((all) => all.map((v, k) => (k === i ? s : v)));

    (async () => {
      const n = scenario.steps.length;
      setTyped(""); setSteps(Array(n).fill("hidden")); setTask("idle"); setApproval(null); setAudit([]);
      for (let c = 1; c <= scenario.prompt.length; c++) {
        if (!alive) return;
        setTyped(scenario.prompt.slice(0, c));
        await sleep(fast ? 0 : 18);
      }
      record("task.submitted");
      setTask("planning");
      await wait(600);
      for (let i = 0; i < n; i++) {
        if (!alive) return;
        set(i, "pending");
        await wait(110);
      }
      record("task.planned");
      await wait(450);

      let i = 0;
      while (i < n) {
        if (!alive) return;
        const group = [i];
        if (scenario.steps[i].parallel) while (i + group.length < n && scenario.steps[i + group.length].parallel) group.push(i + group.length);
        for (const k of group) {
          const s = scenario.steps[k];
          if (s.tier === 2) {
            set(k, "waiting");
            setTask("awaiting approval");
            record("step.approval_requested");
            setApproval(s.approval ?? s.cap);
            // A visitor's own request waits for their tap; the built-in demos approve themselves.
            const yes = await Promise.race([
              new Promise<boolean>((r) => (decide.current = r)),
              wait(patient ? 12000 : 2400).then(() => true),
            ]);
            decide.current = null;
            if (!alive) return;
            setApproval(null);
            if (!yes) {
              set(k, "denied");
              record("step.denied · user:you");
              setTask("stopped");
              record("task.stopped · nothing sent");
              await wait(4000);
              if (alive) finished.current();
              return;
            }
            record(patient ? "step.approved · user:you" : "step.approved · user:phone");
          }
          set(k, "running");
          record(`step.dispatched · ${s.cap}`);
        }
        setTask("running");
        await wait(1000 + Math.random() * 400);
        if (!alive) return;
        for (const k of group) {
          set(k, "done");
          record(`step.done · ${scenario.steps[k].cap}`);
        }
        i += group.length;
        await wait(220);
      }
      setTask("done");
      record("task.done");
      await wait(4000);
      if (alive) finished.current();
    })();
    return () => {
      alive = false;
    };
  }, [scenario, active]);

  const answer = (yes: boolean) => decide.current?.(yes);
  return { typed, steps, task, approval, audit, answer };
}

const taskColor: Record<TaskState, string> = {
  idle: "bg-fg-3",
  planning: "bg-fg-2",
  running: "bg-accent",
  "awaiting approval": "bg-wait",
  done: "bg-ok",
  stopped: "bg-bad",
};

function StepIcon({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="grid size-5 place-items-center rounded-full bg-ok/15 text-ok">
        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m3.5 8.5 3 3 6-7" /></svg>
      </span>
    );
  if (state === "denied")
    return <span className="grid size-5 place-items-center rounded-full bg-bad/15 font-mono text-[11px] text-bad">✕</span>;
  if (state === "running") return <span className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-accent-soft" />;
  if (state === "waiting") return <span className="grid size-5 place-items-center"><span className="size-2 animate-pulse rounded-full bg-wait" /></span>;
  return <span className="size-5 rounded-full border border-line-strong" />;
}

/** `custom` plays a visitor's own request once, then the built-in examples resume. */
/** Audit entries read at a glance: blue = started, amber = waiting on you, green = finished, red = stopped. */
function eventColor(kind: string) {
  if (/denied|stopped/.test(kind)) return "text-bad";
  if (/approval_requested/.test(kind)) return "text-wait";
  if (/approved|done/.test(kind)) return "text-ok";
  if (/planned/.test(kind)) return "text-[#c4b5fd]";
  return "text-accent-soft";
}

export function ProductWindow({ custom = null, onCustomDone }: { custom?: Scenario | null; onCustomDone?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sc = custom ?? scenarios[idx];
  const { typed, steps, task, approval, audit, answer } = useScenario(
    sc,
    active || !!custom,
    () => (custom ? onCustomDone?.() : setIdx((i) => (i + 1) % scenarios.length)),
    !!custom,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setActive(true), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <div role="tablist" aria-label="Example tasks" className="mx-auto mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface/80 p-1 backdrop-blur">
        {scenarios.map((s, i) => (
          <button
            key={s.label}
            role="tab"
            aria-selected={!custom && i === idx}
            onClick={() => { onCustomDone?.(); setIdx(i); setActive(true); }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors sm:px-4 ${!custom && i === idx ? "bg-raised text-fg shadow-[inset_0_0_0_1px_var(--color-line-strong)]" : "text-fg-3 hover:text-fg-2"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[22px] border border-line-strong bg-surface/90 backdrop-blur-xl shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_80px_160px_-40px_rgb(0_0_0/1)]">
        <div className="flex h-12 items-center justify-between border-b border-line px-4 sm:px-5">
          <div className="flex items-center gap-2 text-[13px] text-fg-2">
            <span className="mr-3 hidden gap-1.5 sm:flex"><i className="size-2.5 rounded-full bg-fg/10" /><i className="size-2.5 rounded-full bg-fg/10" /><i className="size-2.5 rounded-full bg-fg/10" /></span>
            <span className="font-medium text-fg">Tasks</span>
            <span className="text-fg-3">/</span>
            <span className="truncate">{sc.label}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[12px] text-fg-2">
            <span className={`size-1.5 rounded-full ${taskColor[task]}`} />
            {task}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 p-5 sm:p-7">
            <div className="rounded-xl border border-line bg-canvas px-4 py-4 text-[15px] leading-relaxed shadow-[inset_0_1px_0_rgb(255_255_255/0.03)] sm:text-[17px]">
              <span className="mr-2 font-mono text-[12px] text-fg-3">you</span>
              {typed}
              {task === "idle" && <span className="caret" />}
            </div>

            <ol className="mt-5 min-h-[248px] space-y-1">
              {sc.steps.map((s, i) => {
                const st = steps[i] ?? "hidden";
                if (st === "hidden") return null;
                return (
                  <motion.li
                    key={`${sc.label}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${st === "running" ? "bg-accent/[0.07] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_25%,transparent)]" : st === "waiting" ? "bg-wait/[0.06] shadow-[inset_0_0_0_1px_rgb(251_191_36/0.25)]" : ""}`}
                  >
                    <StepIcon state={st} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-mono text-[13px] text-fg">
                        {s.cap}
                        {s.parallel && <span className="rounded border border-line px-1 text-[10px] text-fg-3">parallel</span>}
                      </div>
                      <div className="truncate text-[13px] text-fg-3">{s.note}</div>
                    </div>
                    <TierBadge tier={s.tier} />
                  </motion.li>
                );
              })}
            </ol>
          </div>

          <aside className="border-t border-line lg:border-t-0 lg:border-l">
            <div className="border-b border-line p-5">
              <p className="mb-3 text-[12px] font-medium text-fg-2">Approvals · Phone</p>
              <div className="relative h-[124px]">
                <AnimatePresence mode="wait">
                  {approval ? (
                    <motion.div
                      key="ask"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 rounded-xl border border-wait/30 bg-raised p-3.5"
                    >
                      <div className="flex items-center gap-2 text-[12px] text-wait">
                        <span className="size-1.5 rounded-full bg-wait" /> Needs your yes
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-fg">{approval.replace(/\?$/, "")}?</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                        <button onClick={() => answer(false)} className="rounded-md border border-line py-1.5 text-center text-fg-2 transition-colors hover:border-bad/50 hover:text-bad">Deny</button>
                        <button onClick={() => answer(true)} className="rounded-md bg-fg py-1.5 text-center font-medium text-canvas shadow-[0_0_24px_-4px_var(--color-wait)] transition-transform active:scale-95">Approve</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center rounded-xl border border-dashed border-line text-[13px] text-fg-3">
                      Nothing waiting
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-3 text-[12px] font-medium text-fg-2">Audit log</p>
              <ul className="h-[156px] space-y-1.5 overflow-hidden font-mono text-[12px]">
                <AnimatePresence initial={false}>
                  {audit.map((a) => (
                    <motion.li key={a.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-3 truncate">
                      <span className="text-[#7dd3fc]/60">{a.hash}</span>
                      <span className="truncate text-fg-2">
                        <span className={eventColor(a.kind)}>{a.kind.split(" · ")[0]}</span>
                        {a.kind.includes(" · ") && <span className="text-fg-3"> · {a.kind.split(" · ").slice(1).join(" · ")}</span>}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

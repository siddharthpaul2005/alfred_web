import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { onAsk, prefersReducedMotion, pulse } from "../lib";

/**
 * A continuous loop of requests reaching ALFRED: each one arrives, gets handled
 * (or waits for a yes, then gets handled), and clears to make room for the next.
 */
const events: { device: string; doing: string; done: string; ask?: boolean }[] = [
  { device: "PC", doing: "Moving Invoice_Oct.pdf to Bills", done: "Moved Invoice_Oct.pdf to Bills" },
  { device: "Phone", doing: "Reply to Priya: “Thursday works”", done: "Sent your reply to Priya", ask: true },
  { device: "Laptop", doing: "Battery at 18%, switching to saver", done: "Saver mode on, 2h 40m left" },
  { device: "PC", doing: "Backing up your thesis", done: "Thesis backed up to D:\\Backups" },
  { device: "Phone", doing: "Standup in 10 min, opening notes", done: "Notes open on your laptop" },
  { device: "Web", doing: "Pay the electricity bill, ₹1,240", done: "Bill paid, receipt saved", ask: true },
  { device: "Web", doing: "Checking the laptop you watched", done: "Price dropped 12%, link sent" },
  { device: "Telegram", doing: "Reading 34 unread messages", done: "Summary sent to Telegram" },
];

type Phase = "working" | "waiting" | "approved" | "denied" | "done";
type Entry = { device: string; doing: string; done: string; ask?: boolean };
// `mine` items are what the visitor asked for; they jump the queue.
type Item = { id: number; e: Entry; phase: Phase; mine?: boolean };

const status: Record<Phase, { label: string; color: string; dot: string }> = {
  working: { label: "Working", color: "text-accent-soft", dot: "bg-accent" },
  waiting: { label: "Needs your yes", color: "text-wait", dot: "bg-wait" },
  approved: { label: "Approved, sending", color: "text-ok", dot: "bg-ok" },
  denied: { label: "Stopped by you", color: "text-fg-3", dot: "bg-fg-3" },
  done: { label: "Done", color: "text-ok", dot: "bg-ok" },
};

export function LiveFeed() {
  const [items, setItems] = useState<Item[]>([]);
  const [off] = useState(false);
  const timers = useRef<number[]>([]);
  const phases = useRef<Record<number, Phase>>({});
  const busy = useRef(false);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const setPhase = (id: number, phase: Phase) => {
    phases.current[id] = phase;
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, phase } : x)));
  };
  const finish = (id: number, phase: Phase) => {
    setPhase(id, phase);
    pulse(phase === "denied" ? "act" : "done");
    later(2600, () => {
      setItems((xs) => {
        const left = xs.filter((x) => x.id !== id);
        if (!left.some((x) => x.mine && x.phase !== "done" && x.phase !== "denied")) busy.current = false;
        return left;
      });
    });
  };

  useEffect(() => {
    if (off || prefersReducedMotion()) return;
    let n = 0;
    const push = () => {
      if (busy.current) return; // the visitor's own request has the floor
      const e = events[n++ % events.length];
      const id = Date.now();
      const ask = !!e.ask;
      phases.current[id] = ask ? "waiting" : "working";
      setItems((xs) => [...xs.filter((x) => !x.mine).slice(-2), ...xs.filter((x) => x.mine), { id, e, phase: phases.current[id] }]);
      pulse(ask ? "ask" : "act");
      if (ask) {
        // If nobody answers, the demo approves it so the loop keeps moving.
        later(4200, () => phases.current[id] === "waiting" && approve(id));
      } else {
        later(2800, () => finish(id, "done"));
      }
    };
    const stopAsk = onAsk(({ text, needsYes, device }) => {
      const id = Date.now() + 1;
      const e: Entry = { device, doing: text, done: `Done: ${text}`, ask: needsYes };
      busy.current = true;
      phases.current[id] = "working";
      setItems((xs) => [{ id, e, phase: "working", mine: true }, ...xs.filter((x) => !x.mine).slice(-2)]);
      pulse("act");
      // Plan first, then either ask for a yes or just do it.
      later(1600, () => {
        if (needsYes) {
          setPhase(id, "waiting");
          pulse("ask");
          later(12000, () => phases.current[id] === "waiting" && approve(id));
        } else {
          later(2400, () => finish(id, "done"));
        }
      });
    });
    const first = window.setTimeout(push, 1500);
    const t = window.setInterval(push, 3200);
    const pending = timers.current;
    return () => {
      stopAsk();
      clearTimeout(first);
      clearInterval(t);
      pending.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [off]);

  function approve(id: number) {
    setPhase(id, "approved");
    later(1400, () => finish(id, "done"));
  }

  if (off) return null;
  return (
    <aside
      className="dark pointer-events-auto absolute left-5 top-[34svh] flex w-[330px] flex-col min-[1680px]:w-[min(330px,calc((100vw-1240px)/2-40px))]"
      aria-label="Example ALFRED activity"
    >
      <ol className="flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((it) => {
            const e = it.e;
            const s = status[it.phase];
            const settled = it.phase === "done" || it.phase === "denied";
            return (
              <motion.li
                key={it.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(8px)" }}
                animate={{ opacity: settled ? 0.75 : 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -40, scale: 0.95, transition: { duration: 0.4 } }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className={`relative overflow-hidden rounded-[16px] border bg-canvas px-4 py-3.5 ${it.mine ? "border-accent shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_30%,transparent),0_24px_60px_-24px_rgb(0_0_0/0.55)]" : "border-line-strong shadow-[0_24px_60px_-24px_rgb(0_0_0/0.55)]"}`}
              >
                <div className="flex items-center gap-2 text-[12px]">
                  <motion.span layout className={`size-2 rounded-full ${s.dot}`} />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={it.phase}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className={`font-medium ${s.color}`}
                    >
                      {s.label}
                    </motion.span>
                  </AnimatePresence>
                  <span className="ml-auto text-fg-3">{it.mine ? "Your request" : e.device}</span>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={settled ? "done" : "doing"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1.5 text-[14.5px] leading-snug text-fg"
                  >
                    {settled ? (it.phase === "denied" ? `Cancelled: ${e.doing}` : e.done) : e.doing}
                  </motion.p>
                </AnimatePresence>
                {it.phase === "waiting" && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => finish(it.id, "denied")} className="h-8 flex-1 rounded-full border border-line-strong text-[13px] text-fg-2 hover:text-fg">Deny</button>
                    <button onClick={() => approve(it.id)} className="h-8 flex-1 rounded-full bg-fg text-[13px] font-medium text-canvas">Approve</button>
                  </div>
                )}
                {/* progress line while it works */}
                {(it.phase === "working" || it.phase === "approved") && (
                  <motion.span
                    className="absolute bottom-0 left-0 h-[2px] bg-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: it.phase === "working" ? 2.8 : 1.4, ease: "linear" }}
                  />
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </aside>
  );
}

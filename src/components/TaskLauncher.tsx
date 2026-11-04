import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AskBar } from "./AskBar";
import { openChat } from "../lib";

/**
 * The hero's call to action for trying ALFRED: "Add a task" opens the task bar on demand,
 * "Talk to ALFRED" opens the floating chat, and a slow ribbon of example tasks can be tapped
 * to drop one straight into the queue.
 */
const examples = [
  { t: "Reply to Priya that Thursday works", c: "#10b981" },
  { t: "Move Siddharth's PDF to College", c: "#14b8a6" },
  { t: "Brief me every morning at 8", c: "#8b5cf6" },
  { t: "Find a cheaper flight to Goa", c: "#3b82f6" },
  { t: "Clean up my inbox", c: "#4f6bff" },
  { t: "Text Mom I'll be late", c: "#0ea5e9" },
  { t: "Back up my thesis tonight", c: "#6366f1" },
  { t: "Play my focus playlist", c: "#d946ef" },
  { t: "Book a table for Friday", c: "#8b5cf6" },
  { t: "Tell me when this laptop gets cheaper", c: "#3b82f6" },
];

export function TaskLauncher({ onTask }: { onTask: (text: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div key="bar" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }}>
            <AskBar onAsk={onTask} onClose={() => setOpen(false)} />
          </motion.div>
        ) : (
          <motion.div key="actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex flex-col items-center">
            {/* two ways in */}
            <div className="flex items-center gap-1 rounded-full border border-line-strong bg-canvas/60 p-1.5 shadow-[0_20px_50px_-24px_rgb(24_22_18/.45)] backdrop-blur-xl">
              <button onClick={() => setOpen(true)} className="flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-[15px] font-medium text-canvas transition-colors hover:bg-accent">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add a task
              </button>
              <button onClick={openChat} className="flex h-11 items-center gap-2.5 rounded-full px-5 text-[15px] font-medium text-fg transition-colors hover:bg-fg/[0.06]">
                <span className="size-4 rounded-full bg-[conic-gradient(from_0deg,#3d5afe,#8b5cf6,#ff9f80,#22d3ee,#3d5afe)] shadow-[inset_0_0_0_3px_#0c0e1a]" />
                Talk to ALFRED
              </button>
            </div>

            {/* or just tap one */}
            <p className="mt-6 text-[13px] text-fg-3">Or tap one and watch it join the queue</p>
            <div className="group relative mt-3 w-[min(100vw-32px,880px)] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
              <ul className="flex w-max gap-2 py-1 [animation:marquee_45s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:[animation:none]">
                {[...examples, ...examples].map((x, i) => (
                  <li key={i} aria-hidden={i >= examples.length}>
                    <button
                      onClick={() => onTask(x.t)}
                      tabIndex={i >= examples.length ? -1 : 0}
                      className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface/70 px-3.5 py-2 text-[13.5px] text-fg-2 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:text-fg hover:shadow-[0_10px_24px_-14px_rgb(24_22_18/.5)]"
                    >
                      <span className="size-1.5 rounded-full" style={{ background: x.c }} />
                      {x.t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

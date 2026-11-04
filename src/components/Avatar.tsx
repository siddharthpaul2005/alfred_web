import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { askAlfred, type ChatMsg } from "../alfredBrain";
import { announceAsk, onOpenChat, prefersReducedMotion, pulse } from "../lib";
import { canSpeak, speak, stopSpeaking } from "../voice";

/**
 * ALFRED as a living presence on the page: a floating orb with eyes that follow you,
 * blink, think and glow while it talks. It sits in the hero's empty right side, docks to
 * the corner once you scroll, and opens into a chat you can keep going for as long as you like.
 * Tasks you give it in the chat go into the queue on the left of the hero.
 */

type Mode = "idle" | "listening" | "thinking" | "speaking" | "sleeping";

const INTRO = [
  "Hi, I'm ALFRED.",
  "You can talk to me whenever you like. I'm always here.",
  "Everything, everywhere. Just remember me, and I'm present.",
  "Tap me and tell me what you need.",
];
const FIRST: ChatMsg = {
  role: "assistant",
  content: "Hi, I'm ALFRED. Talk to me about anything, for as long as you like, or give me something to do and I'll put it in my queue.",
};
const STORE = "alfred-chat-v2"; // bumped so old offline-only conversations are dropped
const SLEEP_KEY = "alfred-asleep";
// What ALFRED says when it drifts over to keep you company for a moment.
const FOLLOW_LINES = ["Just keeping you company.", "Still here if you need me.", "Ooh, what are we reading?", "Don't mind me.", "Wherever you go, I go."];
const narrowOk = () => window.innerWidth >= 640;

/* ------------------------------------------------------------------ */
/* The orb itself                                                      */
/* ------------------------------------------------------------------ */

function Orb({ size, mode, energy, look }: { size: number; mode: Mode; energy: MotionValue<number>; look: { x: number; y: number } }) {
  const scale = useTransform(energy, [0, 1], [1, 1.07]);
  const glow = useTransform(energy, [0, 1], [0.55, 1]);
  const [blink, setBlink] = useState(false);

  // Blink every few seconds, at slightly uneven intervals like a living thing.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let t: number;
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
        loop();
      }, 2600 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  // Eyes: thinking looks up and squints, otherwise they follow the pointer.
  const asleep = mode === "sleeping";
  const eyeX = asleep ? 0 : mode === "thinking" ? size * 0.06 : look.x * size * 0.07;
  const eyeY = asleep ? size * 0.05 : mode === "thinking" ? -size * 0.07 : look.y * size * 0.05;
  const eyeH = asleep ? 0.12 : blink ? 0.1 : mode === "thinking" ? 0.55 : mode === "listening" ? 1.12 : 1;

  return (
    <motion.div className="relative" style={{ width: size, height: size, scale }}>
      {/* aura */}
      <motion.div
        className="absolute -inset-[45%] rounded-full blur-2xl"
        style={{ opacity: asleep ? 0.25 : glow, background: "radial-gradient(circle, rgb(110 139 255 / .55), rgb(196 170 255 / .3) 40%, rgb(255 178 140 / .12) 60%, transparent 72%)" }}
      />
      {/* body */}
      <div className="absolute inset-0 overflow-hidden rounded-full bg-[#0c0e1a] shadow-[0_24px_50px_-18px_rgb(30_34_80/.7)]">
        <div
          className="absolute -inset-1/4 opacity-90 blur-[14px]"
          style={{
            background: "conic-gradient(from 0deg, #3d5afe, #8b5cf6, #ff9f80, #22d3ee, #3d5afe)",
            animation: `spin-cw ${mode === "thinking" ? 3 : asleep ? 60 : 14}s linear infinite`,
            filter: asleep ? "blur(14px) saturate(.35) brightness(.7)" : undefined,
          }}
        />
        <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle_at_50%_45%,#141833_0%,#0c0e1a_70%)] opacity-80" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_22%,rgb(255_255_255/.5),transparent_32%)]" />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/.14)]" />
      </div>
      {/* face */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ gap: size * 0.13 }}
        animate={{ x: eyeX, y: eyeY }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      >
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="rounded-full bg-white shadow-[0_0_12px_rgb(255_255_255/.8)]"
            style={{ width: size * 0.085, height: size * 0.2 }}
            animate={{ scaleY: eyeH }}
            transition={{ duration: blink ? 0.07 : 0.25 }}
          />
        ))}
      </motion.div>
      {/* Zs drifting up while it sleeps */}
      {asleep &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute right-[-6%] top-[-4%] font-serif italic text-fg-3"
            style={{ fontSize: size * (0.2 + i * 0.06) }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 0.9, 0], x: size * 0.25, y: -size * 0.5 }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
          >
            z
          </motion.span>
        ))}
      {/* a little moon that orbits while it thinks or talks */}
      {(mode === "thinking" || mode === "speaking") && (
        <div className="absolute -inset-[14%]" style={{ animation: "spin-cw 2.4s linear infinite" }}>
          <span className="absolute left-1/2 top-0 size-[7%] -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_white]" />
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Typed speech bubble for the intro lines                             */
/* ------------------------------------------------------------------ */

function useTyped(lines: string[], on: boolean) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    const line = lines[i];
    if (n < line.length) {
      const t = window.setTimeout(() => setN(n + 1), 38);
      return () => clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setI((i + 1) % lines.length);
      setN(0);
    }, 2800);
    return () => clearTimeout(t);
  }, [on, i, n, lines]);
  return lines[i].slice(0, n);
}

/* ------------------------------------------------------------------ */
/* The presence: orb + bubble + chat                                    */
/* ------------------------------------------------------------------ */

export function Avatar() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [inHero, setInHero] = useState(true);
  const [wide, setWide] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [vh, setVh] = useState(800);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [voiceOn, setVoiceOn] = useState(true);
  const [offline, setOffline] = useState<string | false>(false); // true when the last reply came from the built-in fallback, not Groq
  const [asleep, setAsleep] = useState(() => {
    try {
      return localStorage.getItem(SLEEP_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [follow, setFollow] = useState<{ x: number; y: number } | null>(null);
  const [note, setNote] = useState<string | null>(null); // a one-off line that overrides the intro bubble
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {
      /* storage unavailable */
    }
    return [FIRST];
  });
  const [draft, setDraft] = useState("");
  const [spokenUpTo, setSpokenUpTo] = useState<number | null>(null);

  const orbRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMove = useRef(0);
  const following = useRef(false);
  const raw = useMotionValue(0);
  const energy = useSpring(raw, { stiffness: 220, damping: 18 });

  // Where am I? In the hero on a wide screen I float big on the right; otherwise I dock in the corner.
  useEffect(() => {
    const update = () => {
      setInHero(window.scrollY < window.innerHeight * 0.45);
      setWide(window.innerWidth >= 1280);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Step aside while someone fills in the waitlist form.
  useEffect(() => {
    const join = document.getElementById("join");
    if (!join) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.35 });
    io.observe(join);
    return () => io.disconnect();
  }, []);

  // Eyes follow the pointer.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // touch scrolling shouldn't re-render the orb every frame
      const r = orbRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.max(1, Math.hypot(dx, dy));
      const k = Math.min(1, d / 400);
      setLook({ x: (dx / d) * k, y: (dy / d) * k });
      lastMove.current = Date.now();
      if (following.current) setFollow({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  // Remember the conversation for this visit.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-40)));
    } catch {
      /* storage unavailable */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, mode]);

  useEffect(() => {
    if (open) {
      setMode((m) => (m === "idle" ? "listening" : m));
      window.setTimeout(() => inputRef.current?.focus(), 250);
    } else {
      stopSpeaking();
      setMode("idle");
      raw.set(0);
    }
  }, [open, raw]);

  // "Talk to ALFRED" buttons elsewhere on the page open the chat (waking it if needed).
  useEffect(
    () =>
      onOpenChat(() => {
        setAsleep(false);
        setOpen(true);
      }),
    [],
  );

  // Sleep is remembered across visits.
  useEffect(() => {
    try {
      localStorage.setItem(SLEEP_KEY, asleep ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
    if (asleep) {
      setOpen(false);
      stopSpeaking();
    }
  }, [asleep]);

  // Now and then (not all the time, so it never gets annoying) ALFRED drifts over and
  // trails your cursor for a few seconds, says something small, then goes home.
  const canFollow = !asleep && !open && !hidden && narrowOk() && !prefersReducedMotion();
  useEffect(() => {
    if (!canFollow) return;
    let t: number;
    const schedule = () => {
      t = window.setTimeout(() => {
        // Only if you're actually moving the mouse around right now.
        if (Date.now() - lastMove.current > 4000) return schedule();
        following.current = true;
        setNote(FOLLOW_LINES[Math.floor(Math.random() * FOLLOW_LINES.length)]);
        t = window.setTimeout(() => {
          following.current = false;
          setFollow(null);
          setNote(null);
          schedule();
        }, 7000);
      }, 30000 + Math.random() * 25000);
    };
    schedule();
    return () => {
      clearTimeout(t);
      following.current = false;
      setFollow(null);
      setNote(null);
    };
  }, [canFollow]);

  function sleep() {
    setAsleep(true);
    setNote(null);
  }
  function wake() {
    setAsleep(false);
    setNote("I'm awake. What do you need?");
    window.setTimeout(() => setNote(null), 3500);
  }

  const docked = open || asleep || !!follow || !inHero || !wide;
  // On phones the hero has no spare room (the Ask bar sits at the bottom), so I appear once you scroll.
  const away = hidden || (inHero && !narrowOk());
  const size = docked ? 60 : 132;
  let right = docked ? 20 : Math.max(32, window.innerWidth * 0.06);
  let bottom = docked ? 20 : vh / 2 - size / 2 + 20;
  if (follow) {
    // Sit just below-right of the cursor (or flip to the other side near the edges), never under it.
    const W = window.innerWidth;
    const H = window.innerHeight;
    const left = follow.x + 110 + size > W ? follow.x - 50 - size : follow.x + 50;
    const top = follow.y + 70 + size > H ? follow.y - 40 - size : follow.y + 40;
    right = Math.min(W - size - 12, Math.max(12, W - left - size));
    bottom = Math.min(H - size - 12, Math.max(12, H - top - size));
  }
  const typed = useTyped(INTRO, !open && !away && !asleep);
  const bubble = note ?? (asleep ? null : typed);
  const orbMode: Mode = asleep ? "sleeping" : mode;

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || mode === "thinking") return;
    setDraft("");
    stopSpeaking();
    const next: ChatMsg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setMode("thinking");
    pulse("act");

    const r = await askAlfred(next);
    setOffline(r.offline ? r.why || "unknown reason" : false);
    setMsgs((m) => [...m, { role: "assistant", content: r.reply, task: r.task, needsYes: r.needsYes }]);
    if (r.task) announceAsk({ text: r.task, needsYes: r.needsYes, device: "Chat" });

    if (voiceOn && canSpeak()) {
      setSpokenUpTo(0);
      speak(r.reply, {
        onStart: () => setMode("speaking"),
        onWord: (ci, len) => {
          raw.set(0.6 + Math.random() * 0.4);
          window.setTimeout(() => raw.set(0.15), 140);
          setSpokenUpTo(ci + len);
        },
        onEnd: () => {
          raw.set(0);
          setSpokenUpTo(null);
          setMode((m) => (m === "speaking" ? "listening" : m));
        },
      });
      // Some browsers never fire onstart for a muted tab; don't get stuck thinking.
      window.setTimeout(() => setMode((m) => (m === "thinking" ? "listening" : m)), 1500);
    } else {
      setMode("listening");
    }
  }

  return (
    <>
      {/* the floating presence (not rendered at all while tucked away, so it costs nothing) */}
      {!(away && !open) && (
      <motion.div
        className="fixed z-40"
        initial={false}
        animate={{ right, bottom, opacity: away && !open ? 0 : 1, scale: away && !open ? 0.8 : 1 }}
        transition={follow ? { type: "spring", stiffness: 45, damping: 14 } : { type: "spring", stiffness: 140, damping: 20 }}
        style={{ pointerEvents: away && !open ? "none" : "auto" }}
      >
        <motion.div className="group" animate={prefersReducedMotion() || asleep ? { y: 0 } : { y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <button
            ref={orbRef}
            onClick={() => (asleep ? wake() : setOpen((o) => !o))}
            aria-label={asleep ? "Wake ALFRED up" : open ? "Close the chat with ALFRED" : "Talk to ALFRED"}
            title={asleep ? "ALFRED is asleep. Tap to wake." : undefined}
            className="block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Orb size={size} mode={orbMode} energy={energy} look={look} />
          </button>

          {/* sleep switch: shows on hover */}
          {!asleep && !open && (
            <button
              onClick={sleep}
              aria-label="Put ALFRED to sleep"
              title="Put ALFRED to sleep"
              className="absolute -left-1 -top-1 grid size-7 place-items-center rounded-full bg-surface text-fg-2 opacity-0 shadow-[0_0_0_1px_rgb(24_22_18/.08),0_6px_16px_-6px_rgb(24_22_18/.4)] transition-opacity hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
              </svg>
            </button>
          )}

          {/* intro bubble */}
          <AnimatePresence>
            {!open && bubble && (
              <motion.button
                onClick={() => setOpen(true)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className={`absolute w-max max-w-[230px] rounded-2xl bg-surface px-4 py-2.5 text-left text-[14px] leading-snug text-fg shadow-[0_0_0_1px_rgb(24_22_18/.06),0_16px_40px_-16px_rgb(24_22_18/.35)] ${
                  docked ? "bottom-1/2 right-full mr-3 translate-y-1/2 rounded-br-md" : "bottom-full right-0 mb-6 rounded-br-md"
                } ${docked ? "hidden sm:block" : ""}`}
              >
                {bubble}
                <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      )}

      {/* the chat */}
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "100% 100%" }}
            className="dark fixed bottom-[96px] right-4 z-40 flex h-[min(540px,calc(100svh-140px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-line-strong bg-canvas text-fg shadow-[0_40px_80px_-30px_rgb(0_0_0/.6)] sm:right-5"
            aria-label="Chat with ALFRED"
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="size-8 shrink-0 rounded-full bg-[conic-gradient(from_0deg,#3d5afe,#8b5cf6,#ff9f80,#22d3ee,#3d5afe)] shadow-[inset_0_0_0_6px_#0c0e1a]" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">ALFRED</p>
                <p className="flex items-center gap-1.5 text-[11.5px] text-fg-3">
                  <span className="size-1.5 rounded-full bg-wait" />
                  {mode === "thinking" ? "Thinking…" : mode === "speaking" ? "Speaking" : offline ? "Offline replies · chat backend not reachable" : "Preview · not connected yet"}
                </p>
                {offline && <p className="mt-0.5 line-clamp-2 break-all font-mono text-[10px] text-bad/80" title={offline}>{offline}</p>}
              </div>
              <button onClick={sleep} aria-label="Put ALFRED to sleep" title="Put ALFRED to sleep" className="grid size-8 place-items-center rounded-full text-fg-2 hover:bg-fg/[0.06] hover:text-fg">
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                  <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
                </svg>
              </button>
              {canSpeak() && (
                <button
                  onClick={() => {
                    if (voiceOn) stopSpeaking();
                    setVoiceOn((v) => !v);
                  }}
                  aria-label={voiceOn ? "Mute ALFRED's voice" : "Turn ALFRED's voice on"}
                  className="grid size-8 place-items-center rounded-full text-fg-2 hover:bg-fg/[0.06] hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
                    {voiceOn ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="m16 9.5 5 5m0-5-5 5" />}
                  </svg>
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full text-fg-2 hover:bg-fg/[0.06] hover:text-fg">
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.map((m, i) => {
                const last = i === msgs.length - 1;
                const speakingThis = last && m.role === "assistant" && spokenUpTo !== null;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === "user" ? "flex justify-end" : "flex"}>
                    <div className={`max-w-[85%] ${m.role === "user" ? "" : "space-y-2"}`}>
                      <p
                        className={`rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                          m.role === "user" ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-fg/[0.06] text-fg"
                        }`}
                      >
                        {speakingThis ? (
                          <>
                            {m.content.slice(0, spokenUpTo!)}
                            <span className="text-fg-3">{m.content.slice(spokenUpTo!)}</span>
                          </>
                        ) : (
                          m.content
                        )}
                      </p>
                      {m.task && (
                        <p className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-[12px] text-fg-2">
                          <span className={`size-1.5 shrink-0 rounded-full ${m.needsYes ? "bg-wait" : "bg-accent"}`} />
                          <span className="min-w-0 flex-1 truncate">Queued: {m.task}</span>
                          {m.needsYes && <span className="text-wait">needs your yes</span>}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {mode === "thinking" && (
                <div className="flex gap-1 px-1 py-2" aria-label="ALFRED is thinking">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-fg-3"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Say anything, or give me a task"
                className="h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 text-[14px] text-fg outline-none placeholder:text-fg-4 focus:border-accent"
              />
              <button
                type="submit"
                disabled={!draft.trim() || mode === "thinking"}
                aria-label="Send"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-canvas transition-opacity disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

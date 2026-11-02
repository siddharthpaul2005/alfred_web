import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

const ideas = [
  "Reply to Priya that Thursday works",
  "Move the PDF Siddharth sent to my college folder",
  "Every morning at 8, brief me on my day",
  "Text Mom that I'll be late",
  "Watch this laptop's price and tell me when it drops",
  "Pay the electricity bill",
];

// The browser's built-in speech recognition (Chrome, Edge, Safari). No server involved.
type Recognition = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null };
const SpeechRecognition: (new () => Recognition) | undefined =
  typeof window !== "undefined" ? ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Recognition) | undefined : undefined;

/** "Ask ALFRED anything": type or say a request and watch it get planned below. */
export function AskBar({ onAsk }: { onAsk: (text: string) => void }) {
  const [text, setText] = useState("");
  const [hint, setHint] = useState(0);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % ideas.length), 3200);
    return () => clearInterval(t);
  }, []);

  const submit = (value: string) => {
    const v = value.trim();
    if (!v) return;
    onAsk(v);
    setText("");
  };

  const listen = () => {
    if (!SpeechRecognition) return;
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = true;
    let last = "";
    r.onresult = (e) => {
      last = Array.from(e.results).map((x) => x[0].transcript).join("");
      setText(last);
    };
    r.onend = () => {
      setListening(false);
      if (last) submit(last);
    };
    rec.current = r;
    setListening(true);
    r.start();
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          submit(text || ideas[hint]);
        }}
        className="group relative flex items-center gap-2 rounded-full border border-line-strong bg-canvas/70 p-1.5 pl-5 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl transition-colors focus-within:border-accent-soft/50"
      >
        <span className="pointer-events-none absolute -inset-px rounded-full opacity-0 shadow-[0_0_40px_-6px_var(--color-accent)] transition-opacity duration-500 group-focus-within:opacity-100" />
        <div className="relative h-11 min-w-0 flex-1">
          <label htmlFor="ask" className="sr-only">Ask ALFRED to do something</label>
          <input
            id="ask"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            className="peer absolute inset-0 w-full bg-transparent text-[16px] text-fg outline-none"
          />
          {!text && (
            <AnimatePresence mode="wait">
              <motion.span
                key={hint}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none absolute inset-0 flex items-center truncate text-[16px] text-fg-3"
              >
                {listening ? "Listening…" : ideas[hint]}
              </motion.span>
            </AnimatePresence>
          )}
        </div>
        {SpeechRecognition && (
          <button
            type="button"
            onClick={listen}
            aria-label={listening ? "Stop listening" : "Say it instead"}
            className={`relative grid size-11 shrink-0 place-items-center rounded-full transition-colors ${listening ? "bg-accent text-canvas" : "text-fg-2 hover:bg-fg/[0.06] hover:text-fg"}`}
          >
            {listening && <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />}
            <svg viewBox="0 0 24 24" className="relative size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
        )}
        <button type="submit" className="relative h-11 shrink-0 rounded-full bg-fg px-5 text-[15px] font-medium text-canvas transition-transform active:scale-95">
          <span className="sm:hidden">Ask</span>
          <span className="hidden sm:inline">Ask ALFRED</span>
        </button>
      </form>
      <p className="mt-3 text-center text-[13px] text-fg-3">Type or say anything. It jumps to the front of ALFRED's queue.</p>
    </div>
  );
}

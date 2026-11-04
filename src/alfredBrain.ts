/**
 * The website ALFRED's brain.
 *
 * - `npm run dev`: talks to /api/alfred, a route inside the Vite dev server (vite.config.ts)
 *   that calls Groq with the key from .env.
 * - Built site: talks to the Apps Script backend (VITE_WAITLIST_URL) with { type: "chat" },
 *   which calls Groq with the key saved in the script's properties.
 * - If neither answers, a small offline brain keeps the conversation going, so the page never breaks.
 *
 * The Groq key itself never reaches the browser.
 */

export type ChatMsg = { role: "user" | "assistant"; content: string; task?: string | null; needsYes?: boolean };
export type BrainReply = { reply: string; task: string | null; needsYes: boolean; offline?: boolean };

const BACKEND = import.meta.env.VITE_WAITLIST_URL as string | undefined;
const ENDPOINT = import.meta.env.DEV ? "/api/alfred" : BACKEND;

export async function askAlfred(history: ChatMsg[]): Promise<BrainReply> {
  const messages = history.slice(-12).map(({ role, content }) => ({ role, content }));
  if (ENDPOINT) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        // text/plain keeps it a "simple" request, so Apps Script needs no CORS preflight.
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ type: "chat", messages, now: new Date().toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" }) }),
      });
      const data = await res.json();
      if (data.ok && data.reply) return { reply: data.reply, task: data.task ?? null, needsYes: !!data.needsYes };
      console.warn("[ALFRED chat] backend said:", data.error ?? data);
    } catch (e) {
      console.warn("[ALFRED chat] could not reach the backend, using offline replies.", e);
    }
  }
  return offline(history[history.length - 1]?.content ?? "");
}

/* ------------------------------------------------------------------ */
/* Offline brain: a few honest canned answers for when the API is away */
/* ------------------------------------------------------------------ */

const TASK_WORDS = /\b(send|email|mail|reply|text|message|call|book|schedule|remind|move|rename|delete|clean|organi[sz]e|find|search|download|pay|buy|order|open|close|set|turn|play|watch|track|back ?up|summari[sz]e|draft|write|fix|install)\b/i;
const RISKY = /\b(send|email|mail|reply|text|message|call|delete|pay|buy|order|install|share)\b/i;
let small = 0;

function offline(text: string): BrainReply {
  const t = text.trim();
  if (TASK_WORDS.test(t)) {
    const task = t.replace(/^(can you|could you|please|hey alfred,?|alfred,?)\s*/i, "").replace(/[?.!]+$/, "");
    const title = task.charAt(0).toUpperCase() + task.slice(1, 60);
    const yes = RISKY.test(t);
    return {
      reply: `On it. "${title}" is in my queue${yes ? ", and since it can't be undone I'd ask for your yes first" : ""}. I'm not wired into your devices yet, so it won't really happen today, but this is exactly how it will feel.`,
      task: title,
      needsYes: yes,
      offline: true,
    };
  }
  const lines = [
    "I'm here. Ask me anything, or hand me something to do and watch it land in my queue.",
    "I live on every device you own, so wherever you are, I am too.",
    "Think of me as the one who quietly gets things done. Want to try giving me a task?",
    "I can't reach your devices from this page yet, but I'm happy to keep you company. The waitlist below gets you in early.",
  ];
  return { reply: lines[small++ % lines.length], task: null, needsYes: false, offline: true };
}

/**
 * Server-side half of the ALFRED chat used by `npm run dev` (see vite.config.ts).
 * The Groq key is read from GROQ_API_KEY in .env and never reaches the browser.
 *
 * In production the same job is done by the Apps Script backend (waitlist/apps-script.gs),
 * which keeps its own copy of the persona. If you edit server/alfredPrompt.ts, paste the
 * same text into ALFRED_PROMPT there too.
 */
import { ALFRED_PROMPT as PROMPT } from "./alfredPrompt.js";

type Msg = { role: "user" | "assistant"; content: string };
export type ChatReply = { ok: boolean; reply?: string; task?: string | null; needsYes?: boolean; error?: string };

/** Keep only the last few turns, trimmed, so a visitor can't send us a novel. */
export function cleanHistory(raw: unknown): Msg[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Msg => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }));
}

/** Pull the optional [[task: ... | yes/no]] line off the end of a reply. */
export function splitTask(text: string): { reply: string; task: string | null; needsYes: boolean } {
  const m = text.match(/\[\[\s*task:\s*([^|\]]+?)\s*(?:\|\s*(yes|no)\s*)?\]\]/i);
  const reply = text.replace(/\[\[[\s\S]*?\]\]/g, "").replace(/^ALFRED:\s*/i, "").trim();
  return { reply, task: m ? m[1].trim().slice(0, 80) : null, needsYes: m ? (m[2] ?? "").toLowerCase() === "yes" : false };
}

// Groq retires models over time. If the chosen one is gone, fall back to the first of these that exists.
const PREFERRED = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "moonshotai/kimi-k2-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct", "llama-3.1-8b-instant"];
let workingModel: string | null = null;

async function pickModel(key: string): Promise<string | null> {
  const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) return null;
  const ids: string[] = ((await res.json())?.data ?? []).map((m: { id: string }) => m.id);
  return PREFERRED.find((p) => ids.includes(p)) ?? ids.find((id) => !/whisper|tts|guard|embed/i.test(id)) ?? null;
}

async function callGroq(key: string, model: string, system: string, messages: Msg[]) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      top_p: 0.95,
      // gpt-oss is a reasoning model: keep its thinking short (fast replies) and out of the answer.
      // Its hidden reasoning counts toward the token budget, hence the higher limit.
      ...(model.startsWith("openai/gpt-oss")
        ? { reasoning_effort: "low", include_reasoning: false, max_completion_tokens: 1024 }
        : { frequency_penalty: 0.4, max_tokens: 220 }),
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
}

export async function alfredChat(history: unknown, key: string, model?: string, now?: string): Promise<ChatReply> {
  const messages = cleanHistory(history);
  if (!messages.length) return { ok: false, error: "Say something first." };
  const system = PROMPT + (now ? `\n\nThe visitor's local time right now: ${now}.` : "");

  let use = workingModel ?? model ?? PREFERRED[0];
  let res = await callGroq(key, use, system, messages);
  if (res.status === 400 || res.status === 404) {
    // Most likely the model was retired: find one that exists and try once more.
    const next = await pickModel(key);
    if (next && next !== use) {
      use = next;
      res = await callGroq(key, use, system, messages);
    }
  }
  if (!res.ok) return { ok: false, error: `Groq ${res.status} (${use}): ${(await res.text()).slice(0, 300)}` };
  workingModel = use;

  const data = await res.json();
  const out = splitTask(String(data?.choices?.[0]?.message?.content ?? ""));
  if (!out.reply) return { ok: false, error: "Empty reply" };
  return { ok: true, ...out };
}

/**
 * Server-side half of the ALFRED chat used by `npm run dev` (see vite.config.ts).
 * The Groq key is read from GROQ_API_KEY in .env and never reaches the browser.
 *
 * In production the same job is done by the Apps Script backend (waitlist/apps-script.gs),
 * which keeps its own copy of the persona. If you edit server/alfredPrompt.ts, paste the
 * same text into ALFRED_PROMPT there too.
 */
import { ALFRED_PROMPT as PROMPT } from "./alfredPrompt";

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

export async function alfredChat(history: unknown, key: string, model = "llama-3.3-70b-versatile", now?: string): Promise<ChatReply> {
  const messages = cleanHistory(history);
  if (!messages.length) return { ok: false, error: "Say something first." };
  const context = now ? `\n\nThe visitor's local time right now: ${now}.` : "";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      top_p: 0.95,
      frequency_penalty: 0.4,
      max_tokens: 220,
      messages: [{ role: "system", content: PROMPT + context }, ...messages],
    }),
  });
  if (!res.ok) return { ok: false, error: `Groq ${res.status}: ${(await res.text()).slice(0, 200)}` };

  const data = await res.json();
  const out = splitTask(String(data?.choices?.[0]?.message?.content ?? ""));
  if (!out.reply) return { ok: false, error: "Empty reply" };
  return { ok: true, ...out };
}

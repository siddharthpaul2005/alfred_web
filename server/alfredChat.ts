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

export async function alfredChat(history: unknown, key: string, model = "llama-3.3-70b-versatile"): Promise<ChatReply> {
  const messages = cleanHistory(history);
  if (!messages.length) return { ok: false, error: "Say something first." };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: PROMPT }, ...messages],
    }),
  });
  if (!res.ok) return { ok: false, error: `Groq ${res.status}` };

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  try {
    const out = JSON.parse(text);
    return { ok: true, reply: String(out.reply ?? "").trim(), task: out.task ? String(out.task).slice(0, 80) : null, needsYes: !!out.needsYes };
  } catch {
    // The model ignored the JSON format: still show what it said.
    return { ok: true, reply: text.trim(), task: null, needsYes: false };
  }
}

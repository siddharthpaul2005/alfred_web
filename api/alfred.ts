/**
 * Vercel serverless function: POST /api/alfred  { messages, now } -> { ok, reply, task, needsYes }
 *
 * This is the live site's chat backend. It calls Groq on the server with GROQ_API_KEY from
 * Vercel's Environment Variables, so the key never reaches the browser.
 * Locally, `npm run dev` serves the same route from vite.config.ts.
 */
import { alfredChat } from "../server/alfredChat.js"; // .js on purpose: Node ESM on Vercel needs the extension

// Typed loosely so the project doesn't need @types/node.
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export async function POST(request: Request) {
  const key = env.GROQ_API_KEY;
  if (!key) return json({ ok: false, error: "GROQ_API_KEY is not set in Vercel's Environment Variables." });
  try {
    const text = await request.text();
    if (text.length > 20000) return json({ ok: false, error: "Too long." }, 413);
    const { messages, now } = JSON.parse(text || "{}");
    return json(await alfredChat(messages, key, env.GROQ_MODEL || undefined, typeof now === "string" ? now.slice(0, 60) : undefined));
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

export function GET() {
  return json({ ok: true, hint: "POST { messages } to talk to ALFRED." });
}

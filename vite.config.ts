import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { alfredChat } from "./server/alfredChat";

/**
 * Dev-only chat route: POST /api/alfred  { messages } -> { ok, reply, task, needsYes }.
 * It calls Groq on the server side with GROQ_API_KEY from .env (no VITE_ prefix, so the key
 * is never bundled into the site). The built site talks to the Apps Script backend instead.
 */
function alfredDevChat(key: string | undefined, model: string | undefined): Plugin {
  return {
    name: "alfred-dev-chat",
    configureServer(server) {
      server.middlewares.use("/api/alfred", (incoming, res) => {
        // Typed loosely so the config doesn't need @types/node.
        const req = incoming as unknown as { method?: string; on: (ev: string, cb: (chunk?: unknown) => void) => void };
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "POST") return res.end(JSON.stringify({ ok: false, error: "POST only" }));
        if (!key) return res.end(JSON.stringify({ ok: false, error: "GROQ_API_KEY is not set in .env" }));
        let body = "";
        req.on("data", (c) => (body += String(c)));
        req.on("end", async () => {
          try {
            const { messages } = JSON.parse(body || "{}");
            res.end(JSON.stringify(await alfredChat(messages, key, model)));
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // "" loads every variable in .env, including the server-only GROQ_* ones.
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react(), tailwindcss(), alfredDevChat(env.GROQ_API_KEY, env.GROQ_MODEL || undefined)],
  };
});

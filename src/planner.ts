import type { Scenario, Step } from "./data";

/**
 * A tiny in-browser stand-in for ALFRED's planner, so visitors can type any request
 * and watch it turn into tiered steps. Keyword rules only: no network, no model.
 */
type Rule = { test: RegExp; steps: (ctx: Ctx) => Step[] };
type Ctx = { who: string; what: string; quote: string };

const rules: Rule[] = [
  {
    test: /\b(stop|cancel everything|kill)\b/i,
    steps: () => [{ cap: "control.cancel_all", note: "every running task on every device", tier: 0 }],
  },
  {
    test: /\b(every|daily|each morning|each day|weekly|at \d)/i,
    steps: () => [{ cap: "heartbeat.schedule", note: "recurring · source=heartbeat", tier: 1 }],
  },
  {
    test: /\b(pdf|file|folder|document|photo|download|zip)s?\b/i,
    steps: ({ what }) => [
      { cap: "files.find", note: `${what} · all devices`, tier: 0 },
      { cap: "files.move", note: "→ the right folder (undoable)", tier: 1 },
      { cap: "files.verify", note: "file present · checksum ok", tier: 0 },
    ],
  },
  {
    test: /\b(meeting|calendar|schedule|book|tomorrow|monday|tuesday|wednesday|thursday|friday|afternoon)\b/i,
    steps: ({ who }) => [
      { cap: "calendar.find_free_slot", note: "next free 30 min", tier: 0 },
      { cap: "calendar.create_event", note: `with ${who}`, tier: 1 },
    ],
  },
  {
    test: /\b(email|mail|reply|inbox)\b/i,
    steps: ({ who, quote }) => [
      { cap: "email.search", note: `from:${who} · recent`, tier: 0 },
      { cap: "email.draft", note: quote ? `“${quote}”` : "draft in your tone", tier: 0 },
      { cap: "email.send", note: `to ${who}`, tier: 2, approval: `Send email to ${who}${quote ? `: “${quote}”` : ""}` },
    ],
  },
  {
    test: /\b(whatsapp|telegram|discord|text|message|tell)\b/i,
    steps: ({ who, quote }) => [
      { cap: "messaging.draft", note: quote ? `“${quote}”` : `to ${who}`, tier: 1 },
      { cap: "messaging.send", note: `to ${who}`, tier: 2, approval: `Send message to ${who}${quote ? `: “${quote}”` : ""}` },
    ],
  },
  {
    test: /\b(pay|buy|order|purchase|bill)\b/i,
    steps: () => [
      { cap: "research.web_search", note: "best price · trusted sellers", tier: 0 },
      { cap: "hands.fill_checkout", note: "payment window · never auto-trusted", tier: 2, approval: "Pay at checkout? Payments always need your yes" },
    ],
  },
  {
    test: /\b(delete|remove|clean up|uninstall)\b/i,
    steps: ({ what }) => [
      { cap: "files.find", note: what, tier: 0 },
      { cap: "files.delete", note: "to Recycle Bin", tier: 2, approval: `Delete ${what}?` },
    ],
  },
  {
    test: /\b(play|music|song|playlist|spotify|pause)\b/i,
    steps: () => [{ cap: "media.play", note: "living room speaker", tier: 0 }],
  },
  {
    test: /\b(volume|brightness|wifi|wi-fi|bluetooth|open|launch|shut ?down)\b/i,
    steps: () => [{ cap: "system.set", note: "PC · launch or change setting", tier: 1 }],
  },
  {
    test: /\b(alarm|wake me|sms|call)\b/i,
    steps: ({ who }) => [{ cap: "phone.set_alarm", note: `Android · ${who === "them" ? "07:00" : who}`, tier: 1 }],
  },
  {
    test: /\b(search|research|find out|price|news|watch|compare|look up|what|who|how)\b/i,
    steps: () => [
      { cap: "research.web_search", note: "live web", tier: 0, parallel: true },
      { cap: "research.read_page", note: "top 5 sources", tier: 0, parallel: true },
      { cap: "research.summarize", note: "short answer with sources", tier: 0 },
    ],
  },
];

const STOP = new Set(["I", "I'll", "I'm", "Every", "Find", "Send", "Reply", "Tell", "Move", "Play", "Book", "Remind", "Pay", "Delete", "Open", "Text", "Message", "Email", "The", "My", "And", "PDF", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "WhatsApp", "Telegram", "Discord", "Spotify", "ALFRED"]);

function context(text: string): Ctx {
  const quote = (text.match(/[“"']([^“”"']{3,60})[”"']/) ?? text.match(/\bthat (.{3,50})$/i))?.[1]?.trim() ?? "";
  const names = text.match(/\b[A-Z][a-z]+\b/g)?.filter((n) => !STOP.has(n)) ?? [];
  const rel = text.match(/\b(mom|dad|boss|team|everyone)\b/i)?.[1];
  const who = names[0] ?? (rel ? rel[0].toUpperCase() + rel.slice(1).toLowerCase() : "them");
  const what = text.match(/\b(the|my|that|this)\s+([\w\s-]{2,30}?)(?=\s+(to|from|in|into|and|on)\b|$)/i)?.[2]?.trim() ?? "matching files";
  return { who, what, quote };
}

export function plan(text: string): Scenario {
  const ctx = context(text);
  const steps: Step[] = [];
  const seen = new Set<string>();
  // Act in the order the request mentions things.
  const ordered = rules
    .map((r) => ({ r, at: text.search(r.test) }))
    .filter((x) => x.at >= 0)
    .sort((x, y) => x.at - y.at)
    .map((x) => x.r);
  for (const r of ordered) {
    for (const s of r.steps(ctx)) {
      if (seen.has(s.cap)) continue;
      seen.add(s.cap);
      steps.push(s);
    }
    if (r.steps(ctx)[0].cap === "control.cancel_all") break;
  }
  if (steps.length === 0) {
    steps.push(
      { cap: "research.web_search", note: "understand the request", tier: 0 },
      { cap: "research.summarize", note: "plan the next steps", tier: 0 },
    );
  }
  const trimmed = steps.slice(0, 5);
  trimmed.push({ cap: "voice.speak", note: "“Done. Here's what I did.”", tier: 0 });
  return { label: "Your request", prompt: text.trim(), steps: trimmed };
}

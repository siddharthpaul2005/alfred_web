export type Tier = 0 | 1 | 2;

export const tierName: Record<Tier, string> = { 0: "Free", 1: "Logged", 2: "Confirm" };

export const nav = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#agents", label: "Agents" },
  { href: "#trust", label: "Trust" },
  { href: "#compare", label: "Compare" },
]

export const surfaces = ["Windows PC", "Laptop", "Android", "Telegram", "WhatsApp", "Web", "Voice", "Hotkey", "Any MCP server"];

export type Step = { cap: string; note: string; tier: Tier; parallel?: boolean; approval?: string };
export type Scenario = { label: string; prompt: string; steps: Step[] };

export const scenarios: Scenario[] = [
  {
    label: "Move a file",
    prompt: "Find the PDF Siddharth sent last week and move it to my college folder",
    steps: [
      { cap: "email.search", note: "from:Siddharth · has:pdf · last 7 days", tier: 0 },
      { cap: "email.save_attachment", note: "DBMS_Assignment_3.pdf → Downloads", tier: 1 },
      { cap: "files.move", note: "→ D:\\College\\Sem 5\\DBMS", tier: 1 },
      { cap: "files.verify", note: "file present · 2.4 MB · checksum ok", tier: 0 },
    ],
  },
  {
    label: "Reply to email",
    prompt: "Reply to Priya that Thursday 4pm works and add it to my calendar",
    steps: [
      { cap: "email.read", note: "thread “Project sync?” · Priya", tier: 0 },
      { cap: "calendar.find_free_slot", note: "Thu 16:00–16:30 is free", tier: 0 },
      { cap: "calendar.create_event", note: "Project sync · Thu 16:00", tier: 1 },
      { cap: "email.send", note: "to Priya · “Thursday 4pm works, see you then”", tier: 2, approval: "Send reply to Priya: “Thursday 4pm works, see you then”" },
    ],
  },
  {
    label: "Morning brief",
    prompt: "Every morning at 8, brief me on mail, meetings and my laptop battery",
    steps: [
      { cap: "heartbeat.schedule", note: "daily · 08:00", tier: 1 },
      { cap: "email.search", note: "unread · important · since yesterday", tier: 0, parallel: true },
      { cap: "calendar.read", note: "today · 3 meetings · 1 conflict", tier: 0, parallel: true },
      { cap: "system.read_state", note: "laptop · battery 18%", tier: 0, parallel: true },
      { cap: "voice.speak", note: "“Good morning. One conflict at 2pm…”", tier: 0 },
    ],
  },
];

export type Agent = { name: string; desc: string; tiers: [string, string, string]; hands?: boolean };

export const agents: Agent[] = [
  { name: "Email", desc: "Searches, reads and drafts on its own. Sending always waits for you.", tiers: ["Search, read, draft", "Label, archive", "Send, forward, delete"] },
  { name: "Calendar", desc: "Finds free time, books your own events, and reschedules around conflicts.", tiers: ["Read, find free slots", "Create your own event", "Invite others, cancel"] },
  { name: "Files", desc: "Finds anything on any device, organizes it, and syncs it where it should be.", tiers: ["Find, read", "Move, rename (undoable)", "Delete, share outside"] },
  { name: "Research", desc: "Searches the live web, reads pages, summarizes, and watches pages for changes.", tiers: ["Search, read, summarize, watch", "", ""] },
  { name: "Dev", desc: "Knows your repos: status, diffs, commits, tests, and opening the right editor.", tiers: ["Status, diff", "Commit, branch", "Push, anything forced"] },
  { name: "System", desc: "Launches apps and changes settings: volume, brightness, Wi-Fi, power.", tiers: ["Read state", "Launch apps, settings", "Install, uninstall, shut down"] },
  { name: "Messaging", desc: "Reads and drafts on WhatsApp, Telegram and Discord. Sending asks first.", tiers: ["Read", "Draft", "Send"] },
  { name: "Media", desc: "Plays, pauses, queues and casts to any screen in the house.", tiers: ["Play, pause, queue, cast", "", "Purchases"] },
  { name: "Phone", desc: "Notifications, SMS, alarms, location and camera on Android.", tiers: ["Read notifications and SMS", "Set alarms", "Send SMS, call"] },
  { name: "Hands", desc: "The only part allowed to click and type. It reads each app's interface tree and checks every action worked.", tiers: ["Read the screen's interface", "Click, type in allowed apps", "Banking, payment, password windows"], hands: true },
];

export const flow = [
  { title: "You ask, anywhere", body: "Voice, hotkey, phone, Telegram, a browser tab. Same ALFRED, same task list." },
  { title: "It plans", body: "A fast local router handles simple commands offline. A cloud planner breaks big goals into steps." },
  { title: "It checks permission", body: "Every step has a risk tier. Reversible steps run. Irreversible ones wait for your yes." },
  { title: "It acts and verifies", body: "The right agent on the right device does the step, then looks again to confirm it worked." },
  { title: "It records", body: "Every step, approval and result lands in a tamper-evident log you can check from any device." },
];

export const capabilities = [
  { tag: "Reach", title: "Every device, one ALFRED", body: "Start a task on your PC, approve it from your phone, check the result on your laptop. One task list, whichever device you're holding." },
  { tag: "Act", title: "Real hands in real apps", body: "ALFRED reads each app's interface the way a screen reader does, so it clicks the button named “Send”, not a guess at pixels." },
  { tag: "Voice", title: "Just say it", body: "Wake word, streaming speech and spoken replies you can interrupt. Push-to-talk on the PC." },
  { tag: "Proactive", title: "It doesn't wait to be asked", body: "A heartbeat wakes ALFRED on a schedule and on events: a new email, a file appearing, a meeting in ten minutes." },
  { tag: "Endurance", title: "Tasks that last days", body: "Every task is saved as it moves. It survives a reboot and picks up where it stopped." },
  { tag: "Memory", title: "Learns “Siddharth” once", body: "Your contacts, preferences and past outcomes, kept locally and searchable. Say a name once and ALFRED knows who you mean." },
  { tag: "Research", title: "Live web, watched", body: "Search, read, summarize, and watch a page so ALFRED tells you the moment it changes." },
  { tag: "Parallel", title: "Many hands at once", body: "Big goals split into independent steps that run at the same time across agents and devices." },
  { tag: "Pluggable", title: "Bring any tool", body: "New agents drop in without touching the core, and any MCP server can join, with risk tiers set when you install it." },
  { tag: "Verify", title: "Done means checked", body: "After every action ALFRED looks again. If the file isn't where it should be, the step fails honestly and re-plans once." },
];

export const tiers: { tier: Tier; summary: string; examples: string[] }[] = [
  { tier: 0, summary: "Runs immediately.", examples: ["Read email", "Search files", "Search the web"] },
  { tier: 1, summary: "Runs, is recorded, and can be undone.", examples: ["Move a file", "Label an email", "Create your own event"] },
  { tier: 2, summary: "Waits for your yes, on whatever device you're holding.", examples: ["Send, post, pay", "Delete, install", "Anything leaving the machine"] },
];

export const dialRows: { label: string; tier: Tier; trustable?: boolean }[] = [
  { label: "Search your email", tier: 0 },
  { label: "Move a file to Archive", tier: 1 },
  { label: "Send “On my way” to Mom, approved 5× before", tier: 2, trustable: true },
  { label: "Pay an electricity bill", tier: 2 },
];

export const safety = [
  { title: "Kill switch", body: "One hotkey, or the word “stop”, cancels every running task on every device." },
  { title: "Untrusted text is data", body: "Emails, web pages and messages are labeled as data, so a sneaky email can't give ALFRED orders." },
  { title: "Paired devices only", body: "Each device pairs once with a key you approve. Lose your phone, revoke it from anywhere." },
  { title: "Secrets in the vault", body: "Passwords stay in Windows Credential Manager or Android Keystore. Never in files, never in a prompt." },
  { title: "Signed agents only", body: "Only agents you built or approved can connect. No open store full of strangers' code." },
  { title: "Never re-run blindly", body: "If a risky step was interrupted, ALFRED asks again instead of guessing whether it happened." },
];

export type Mark = "y" | "p" | "n" | "u";
export const compareCols = ["ALFRED", "Grok Bot", "Meta Muse", "OpenClaw", "Perplexity Computer"];
export const compareRows: { label: string; marks: Mark[] }[] = [
  { label: "Runs on your own devices, not a rented cloud computer", marks: ["y", "n", "u", "y", "n"] },
  { label: "Operates your real apps and files", marks: ["y", "y", "u", "p", "p"] },
  { label: "Acts on its own, on schedules and events", marks: ["y", "y", "u", "y", "p"] },
  { label: "Fixed risk tier on every action: reversible runs, permanent asks", marks: ["y", "p", "u", "n", "p"] },
  { label: "Tamper-evident log of every action", marks: ["y", "n", "u", "n", "n"] },
  { label: "Memory stays on your machine", marks: ["y", "n", "u", "y", "n"] },
  { label: "Simple commands work offline", marks: ["y", "n", "u", "p", "n"] },
  { label: "Controls your Android phone itself: SMS, alarms, notifications", marks: ["y", "n", "u", "n", "n"] },
];

export const versus = [
  { title: "Versus Grok Bot", body: "Grok Bot is a strong cloud teammate: it gets its own computer in xAI's cloud, signs into your accounts there and runs 24/7. ALFRED does the work on your own machines, keeps your passwords in your OS vault, and writes every action to a log you can verify." },
  { title: "Versus Meta's Muse", body: "Muse is Meta's personal agent, built around Meta's apps and Meta's cloud. ALFRED lives on your devices, keeps its memory locally, and answers to you." },
  { title: "Versus OpenClaw", body: "OpenClaw proved people want an agent that acts on its own. It also showed the cost of skipping safety. ALFRED keeps the autonomy and adds the brakes." },
];


export const story = [
  { title: "You ask. Anywhere.", body: "Say it, type it or text it, from your phone, your PC, Telegram or a browser tab. It's the same ALFRED and the same task list everywhere." },
  { title: "It plans.", body: "A fast local router handles simple commands offline. Bigger goals go to a planner that breaks them into steps, each naming exactly what will happen." },
  { title: "It asks before anything permanent.", body: "Every step carries a risk tier. Reading and moving run on their own. Sending, paying and deleting wait for your yes, on whatever device you're holding." },
  { title: "It acts, then checks.", body: "The right agent on the right device does the work, then looks again to confirm it actually happened. Done means verified." },
  { title: "It writes everything down.", body: "Every step, approval and result lands in a tamper-evident log. If anyone edits history, the chain visibly breaks." },
];

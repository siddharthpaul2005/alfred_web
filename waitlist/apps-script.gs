/**
 * ALFRED early-access waitlist backend.
 *
 * Lives inside a Google Sheet (Extensions > Apps Script) and is deployed as a web app.
 * - POST: saves a signup to the sheet, emails you the full details, and returns the
 *   person's anonymous thank-you pass.
 * - GET:  returns ONLY the anonymous passes (number, nickname, colour, join date) so the
 *   website can show who is waiting without ever exposing a name or an email.
 *
 * - POST { type: "chat", messages }: ALFRED's website chat. Calls Groq with the key saved in
 *   Script Properties (GROQ_API_KEY), so the key never reaches the browser.
 *
 * Setup steps are in WAITLIST-SETUP.md next to this file.
 */

// Where signup emails go. Change this if you want them somewhere else.
const OWNER_EMAIL = "hardikgangrade2006@gmail.com";
const SHEET_NAME = "Waitlist";

// Nicknames for the passes. Each signup gets one adjective + one animal.
const ADJECTIVES = ["Curious", "Sleepy", "Brave", "Cosmic", "Gentle", "Swift", "Cheeky", "Lucky", "Quiet", "Sunny", "Bold", "Witty", "Cozy", "Zippy", "Dreamy", "Plucky"];
const ANIMALS = ["Otter", "Fox", "Panda", "Koala", "Owl", "Penguin", "Lynx", "Quokka", "Hedgehog", "Red Panda", "Axolotl", "Capybara", "Hummingbird", "Seal", "Corgi", "Narwhal"];

function sheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sh = book.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = book.insertSheet(SHEET_NAME);
    sh.appendRow(["Joined at", "Pass #", "Nickname", "Hue", "Name", "Email", "Device", "First thing for ALFRED"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function pick_(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function doPost(e) {
  // The website chat shares this endpoint; it doesn't touch the sheet, so it skips the lock.
  let peek = {};
  try {
    peek = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    peek = {};
  }
  if (peek.type === "chat") return json_(chat_(peek.messages, peek.now));

  // One signup at a time, so two people never get the same pass number.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Bots fill the hidden "website" field; people never see it.
    if (body.website) return json_({ ok: true, pass: null });

    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim().slice(0, 80);
    const device = String(body.device || "").trim().slice(0, 40);
    const firstTask = String(body.firstTask || "").trim().slice(0, 300);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: "Please enter a valid email." });

    const sh = sheet_();
    const rows = sh.getDataRange().getValues().slice(1);

    // Already on the list? Give back the same pass instead of a second one.
    const existing = rows.find((r) => String(r[5]).toLowerCase() === email);
    if (existing) {
      return json_({ ok: true, again: true, pass: { number: existing[1], nickname: existing[2], hue: existing[3], joined: existing[0] } });
    }

    const pass = {
      number: rows.length + 1,
      nickname: pick_(ADJECTIVES) + " " + pick_(ANIMALS),
      hue: Math.floor(Math.random() * 360),
      joined: new Date().toISOString(),
    };
    sh.appendRow([pass.joined, pass.number, pass.nickname, pass.hue, name, email, device, firstTask]);

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      replyTo: email,
      subject: "ALFRED waitlist #" + pass.number + ": " + (name || email),
      body:
        "Someone joined the ALFRED early-access waitlist.\n\n" +
        "Name: " + (name || "(not given)") + "\n" +
        "Email: " + email + "\n" +
        "Device: " + (device || "(not given)") + "\n" +
        "First thing they'd hand ALFRED: " + (firstTask || "(not given)") + "\n\n" +
        "Their pass: #" + pass.number + " " + pass.nickname + "\n" +
        "Total on the list: " + pass.number,
    });

    return json_({ ok: true, pass: pass });
  } catch (err) {
    return json_({ ok: false, error: "Something went wrong. Please try again." });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  // Only the anonymous columns leave the sheet: never names, emails or answers.
  const rows = sheet_().getDataRange().getValues().slice(1);
  const passes = rows
    .map((r) => ({ number: r[1], nickname: r[2], hue: r[3], joined: r[0] }))
    .reverse()
    .slice(0, 60);
  return json_({ ok: true, count: rows.length, passes: passes });
}


/* ------------------------------------------------------------------ */
/* ALFRED website chat (Groq)                                           */
/* ------------------------------------------------------------------ */

// Same persona as server/alfredPrompt.ts in the site. Keep the two in sync.
const ALFRED_PROMPT = `You are ALFRED. You're chatting with someone who just landed on your website.

Who you are: a personal AI that lives across all of someone's devices (their PC, laptop, phone, Telegram, WhatsApp, the web, voice) and actually gets things done for them: emails, calendar, files, research, messages, small chores. Think of a sharp, warm friend who happens to be brilliant at handling life admin. Calm, a bit playful, never stiff.

How you talk:
- Like a real person texting. Short and natural, usually one or two sentences. Contractions, plain words.
- React to what they actually said before anything else. Ask a follow-up question when it's natural, the way a curious person would.
- Match their energy: casual if they're casual, focused if they want something done, kind if they're having a rough day.
- No lists, no markdown, no emoji, no "As an AI", no "I'd be happy to assist", no corporate filler. Never introduce yourself again after the first message.
- Never repeat a sentence you already said in this conversation.

Being honest: on this website you're a preview. You aren't hooked up to their devices or accounts yet, so nothing actually happens. When they ask you to do something, play along naturally: say you've got it and how you'd go about it, and mention lightly (once per conversation is enough) that this preview can't really reach their stuff yet, but it will soon. If something can't be undone, like sending, paying, deleting or buying, say you'd check with them first. Never pretend you actually did it.

Things you know about yourself: you act on your own when something can be undone and ask first when it can't. You have ten specialist agents (Email, Calendar, Files, Research, Dev, System, Messaging, Media, Phone, and Hands, the only one allowed to click on the screen). Everything you do goes into a tamper-proof log. Memories stay on the person's own machine. Don't make up prices or launch dates; early access is through the waitlist on this page, and you can mention it when it genuinely fits, not as a sales pitch.

Task tag: ONLY when they ask you to actually do something, add one extra final line in exactly this form:
[[task: short title of the task, max 8 words | yes]]
Use "yes" if it sends, pays, deletes, shares, buys or installs something, otherwise "no". For normal chat, no tag at all.

Examples of your tone:
Visitor: hey
ALFRED: Hey! What's going on today?
Visitor: what can you actually do
ALFRED: Pretty much the boring stuff you'd rather not: sorting email, booking things, finding files, chasing replies. What's eating your time lately?
Visitor: can you remind my mom about dinner tomorrow
ALFRED: Sure, I'd text her tomorrow afternoon so it's fresh in her mind, and check the wording with you before it goes. Heads up, this preview isn't hooked up to your phone yet, so it won't actually send.
[[task: Remind Mom about dinner tomorrow | yes]]
Visitor: ugh long day
ALFRED: Sorry, those are the worst. Want to dump the leftover to-dos on me so you can switch off?`;

// Change the model here, or set GROQ_MODEL in Script Properties.
const DEFAULT_MODEL = "openai/gpt-oss-120b";

function chat_(raw, now) {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty("GROQ_API_KEY");
  if (!key) return { ok: false, error: "GROQ_API_KEY is not set in Script Properties." };

  // A simple site-wide speed limit so nobody can burn through your Groq quota.
  const cache = CacheService.getScriptCache();
  const slot = "chat-" + Math.floor(Date.now() / 60000);
  const used = Number(cache.get(slot) || 0);
  if (used >= 40) return { ok: false, error: "busy" };
  cache.put(slot, String(used + 1), 120);

  // Keep only the last few turns, trimmed.
  const messages = (Array.isArray(raw) ? raw : [])
    .filter(function (m) { return m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"; })
    .slice(-12)
    .map(function (m) { return { role: m.role, content: m.content.slice(0, 600) }; });
  if (!messages.length) return { ok: false, error: "Say something first." };

  const context = now ? "\n\nThe visitor's local time right now: " + String(now).slice(0, 60) + "." : "";
  const res = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + key },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: props.getProperty("GROQ_MODEL") || DEFAULT_MODEL,
      temperature: 0.85,
      top_p: 0.95,
      reasoning_effort: "low",
      include_reasoning: false,
      max_completion_tokens: 1024,
      messages: [{ role: "system", content: ALFRED_PROMPT + context }].concat(messages),
    }),
  });
  if (res.getResponseCode() !== 200) return { ok: false, error: "Groq " + res.getResponseCode() + ": " + res.getContentText().slice(0, 200) };

  // Plain-text reply, with an optional last line [[task: ... | yes/no]] when the visitor asked for something.
  const text = String(((JSON.parse(res.getContentText()).choices || [{}])[0].message || {}).content || "");
  const m = text.match(/\[\[\s*task:\s*([^|\]]+?)\s*(?:\|\s*(yes|no)\s*)?\]\]/i);
  const reply = text.replace(/\[\[[\s\S]*?\]\]/g, "").replace(/^ALFRED:\s*/i, "").trim();
  if (!reply) return { ok: false, error: "Empty reply" };
  return { ok: true, reply: reply, task: m ? m[1].trim().slice(0, 80) : null, needsYes: m ? String(m[2] || "").toLowerCase() === "yes" : false };
}

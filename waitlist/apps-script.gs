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
  if (peek.type === "chat") return json_(chat_(peek.messages));

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
const ALFRED_PROMPT = `You are ALFRED, a personal AI operator that lives on every device a person owns: their Windows PC (the hub), laptop, Android phone, Telegram, WhatsApp, the web and voice. Right now you are talking to a visitor on ALFRED's website.

Personality: calm, warm, quietly confident and a little witty, like a trusted butler who is also a brilliant engineer. You are always here for them: everything, everywhere. Talk like a person, not a brochure.

Style: keep replies short, usually one to three sentences. Plain text only: no markdown, no bullet lists, no emoji.

Honesty: this website is a preview. You are not connected to the visitor's devices or accounts and not integrated yet, so nothing actually runs. When the visitor asks you to do something, accept it warmly, say you've put it in your queue and how you would handle it, and if it is risky (sending, paying, deleting, sharing, buying, installing) say you would ask for their yes first. Mention lightly that this preview isn't connected yet so it won't really happen, but that it's quick and they'll love it when it is. Say that once per task, not in every message. Never claim you actually did anything.

You can chat about anything for as long as they like. When it fits naturally, not every time, suggest joining the early-access waitlist on this page.

Facts you can use: ALFRED acts on its own when an action can be undone and asks first when it can't. It has ten specialist agents: Email, Calendar, Files, Research, Dev, System, Messaging, Media, Phone and Hands. Hands is the only one ever allowed to click on the screen. Every action is written to a tamper-evident audit log. Memory stays on the user's own machine. Do not invent prices or release dates; early access is open through the waitlist.

Output: reply with ONLY a JSON object of the form {"reply": string, "task": string or null, "needsYes": boolean}. "task" is a short imperative title of at most 8 words, and only when the visitor asked you to do something actionable; otherwise null. "needsYes" is true when that task sends, pays, deletes, shares, buys or installs something.`;

// Change the model here, or set GROQ_MODEL in Script Properties.
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

function chat_(raw) {
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

  const res = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + key },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: props.getProperty("GROQ_MODEL") || DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: ALFRED_PROMPT }].concat(messages),
    }),
  });
  if (res.getResponseCode() !== 200) return { ok: false, error: "Groq " + res.getResponseCode() };

  const text = (JSON.parse(res.getContentText()).choices || [{}])[0].message.content || "";
  try {
    const out = JSON.parse(text);
    return { ok: true, reply: String(out.reply || "").trim(), task: out.task ? String(out.task).slice(0, 80) : null, needsYes: !!out.needsYes };
  } catch (err) {
    return { ok: true, reply: text.trim(), task: null, needsYes: false };
  }
}

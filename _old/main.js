(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Nav ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  // Highlight the nav link for the section in view
  const sectionLinks = new Map($$("#navLinks a").map((a) => [a.getAttribute("href").slice(1), a]));
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        sectionLinks.forEach((a) => a.classList.remove("active"));
        sectionLinks.get(e.target.id)?.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sectionLinks.forEach((_, id) => { const el = document.getElementById(id); if (el) navObserver.observe(el); });

  /* ---------- Cursor glow ---------- */
  const glow = $(".cursor-glow");
  if (finePointer && !reduceMotion) {
    window.addEventListener("pointermove", (e) => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, { passive: true });
  } else {
    glow.style.display = "none";
  }

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el, i) => {
    if (el.closest(".bento") || el.closest(".timeline")) el.style.transitionDelay = (i % 4) * 70 + "ms";
    revealObserver.observe(el);
  });

  /* ---------- Hero canvas: a living sphere of thought with orbiting devices ---------- */
  function heroCanvas() {
    const canvas = $("#heroCanvas");
    const ctx = canvas.getContext("2d");
    let w, h, dpr, cx, cy, R;
    const N = 520;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r, s: Math.random() });
    }
    const sats = ["PC", "Laptop", "Phone", "Telegram", "Web", "Voice"].map((label, i) => ({
      label, a: (i / 6) * Math.PI * 2, tilt: 0.35 + (i % 3) * 0.18, speed: 0.12 + (i % 2) * 0.05,
    }));
    const pulses = [];
    let mx = 0, my = 0, tx = 0, ty = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h * 0.5;
      R = Math.min(w, h) * (w < 700 ? 0.42 : 0.36);
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (e) => {
      mx = (e.clientX / w - 0.5) * 2;
      my = (e.clientY / h - 0.5) * 2;
    }, { passive: true });

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

    let last = performance.now(), rot = 0;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) { requestAnimationFrame(frame); return; }
      rot += dt * 0.12;
      tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;
      ctx.clearRect(0, 0, w, h);

      const ry = rot + tx * 0.4, rx = -0.25 + ty * 0.25;
      const cyR = Math.cos(ry), syR = Math.sin(ry), cxR = Math.cos(rx), sxR = Math.sin(rx);
      const breathe = 1 + Math.sin(now / 1400) * 0.015;

      // core glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
      g.addColorStop(0, "rgba(124,243,255,0.16)");
      g.addColorStop(0.45, "rgba(167,139,250,0.07)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // sphere points
      for (const p of pts) {
        let x = p.x * cyR - p.z * syR;
        let z = p.x * syR + p.z * cyR;
        let y = p.y * cxR - z * sxR;
        z = p.y * sxR + z * cxR;
        const wobble = 1 + Math.sin(now / 900 + p.s * 12) * 0.012;
        const persp = 1 / (1.9 - z * 0.6);
        const px = cx + x * R * breathe * wobble * persp * 1.3;
        const py = cy + y * R * breathe * wobble * persp * 1.3;
        const depth = (z + 1) / 2;
        const size = 0.5 + depth * 1.6;
        const hue = 185 + (1 - depth) * 80 + p.s * 20;
        ctx.fillStyle = `hsla(${hue}, 95%, ${60 + depth * 15}%, ${0.15 + depth * 0.75})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // satellites
      const satPos = [];
      for (const s of sats) {
        s.a += dt * s.speed;
        const orbitR = R * 1.75;
        const x3 = Math.cos(s.a) * orbitR;
        const z3 = Math.sin(s.a) * orbitR;
        const y3 = z3 * Math.sin(s.tilt) * 0.55;
        const zz = z3 * Math.cos(s.tilt);
        const persp = 1 / (1.9 - (zz / orbitR) * 0.6);
        const px = cx + x3 * persp * 0.95 + tx * 14;
        const py = cy + y3 * persp + ty * 10;
        satPos.push({ px, py, depth: (zz / orbitR + 1) / 2, s });
      }
      // links + pulses
      for (const sp of satPos) {
        ctx.strokeStyle = `rgba(124,243,255,${0.04 + sp.depth * 0.12})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sp.px, sp.py);
        ctx.stroke();
      }
      if (Math.random() < dt * 2.2) {
        const i = Math.floor(Math.random() * sats.length);
        pulses.push({ i, t: 0, out: Math.random() < 0.5 });
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const pu = pulses[k];
        pu.t += dt * 0.8;
        if (pu.t >= 1) { pulses.splice(k, 1); continue; }
        const sp = satPos[pu.i];
        const t = pu.out ? pu.t : 1 - pu.t;
        const px = cx + (sp.px - cx) * t, py = cy + (sp.py - cy) * t;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 10);
        pg.addColorStop(0, pu.out ? "rgba(124,243,255,0.95)" : "rgba(244,114,182,0.95)");
        pg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
      }
      for (const sp of satPos) {
        const a = 0.35 + sp.depth * 0.65;
        ctx.fillStyle = `rgba(10,12,20,${0.6 + sp.depth * 0.3})`;
        ctx.strokeStyle = `rgba(167,139,250,${a * 0.7})`;
        ctx.beginPath(); ctx.arc(sp.px, sp.py, 5 + sp.depth * 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(238,241,248,${a * 0.8})`;
      }
      requestAnimationFrame(frame);
    }
    if (reduceMotion) { frame(performance.now()); visible = false; }
    else requestAnimationFrame(frame);
  }
  heroCanvas();

  /* ---------- Hero typing ---------- */
  const heroLines = [
    "Find the PDF Mradul sent last week and move it to my college folder.",
    "Clear my afternoon and tell everyone I'll be late.",
    "Watch this page and ping me the moment the price drops.",
    "Every morning at 8, brief me on email, calendar and battery.",
    "Stop.",
  ];
  async function typeLoop(el, lines) {
    if (reduceMotion) { el.textContent = lines[0]; return; }
    let i = 0;
    for (;;) {
      const line = lines[i % lines.length];
      for (let c = 0; c <= line.length; c++) { el.textContent = line.slice(0, c); await sleep(28 + Math.random() * 40); }
      await sleep(2200);
      for (let c = line.length; c >= 0; c--) { el.textContent = line.slice(0, c); await sleep(12); }
      await sleep(350);
      i++;
    }
  }
  typeLoop($("#heroType"), heroLines);

  /* ---------- Manifesto: words light up as you scroll ---------- */
  const man = $("#manifesto");
  man.innerHTML = man.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span> `).join("");
  const words = $$(".w", man);
  function lightWords() {
    const r = man.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
    const n = Math.round(progress * words.length);
    words.forEach((w, i) => w.classList.toggle("lit", i < n));
  }
  if (reduceMotion) words.forEach((w) => w.classList.add("lit"));
  else { window.addEventListener("scroll", lightWords, { passive: true }); lightWords(); }

  /* ---------- Orbit of agents ---------- */
  const agents = [
    { ico: "✉", name: "Email", desc: "Searches, reads and drafts on its own. Sending always waits for you.", t: ["search, read, draft", "label, archive", "send, forward, delete"] },
    { ico: "◷", name: "Calendar", desc: "Finds free time, books your own events, and reschedules around conflicts.", t: ["read, find free slots", "create your own event", "invite others, cancel"] },
    { ico: "▤", name: "Files", desc: "Finds anything on any device, organizes it, and syncs it where it should be.", t: ["find, read", "move, rename (undoable)", "delete, share outside"] },
    { ico: "⌕", name: "Research", desc: "Searches the live web, reads pages, summarizes, and watches pages for changes.", t: ["search, read, summarize, watch", "", ""] },
    { ico: "⟨⟩", name: "Dev", desc: "Knows your repos: status, diffs, commits, tests, and opening the right editor.", t: ["status, diff", "commit, branch", "push, anything forced"] },
    { ico: "⚙", name: "System", desc: "Launches apps and changes settings: volume, brightness, Wi-Fi, power.", t: ["read state", "launch apps, settings", "install, uninstall, shutdown"] },
    { ico: "✆", name: "Messaging", desc: "Reads and drafts on WhatsApp, Telegram and Discord. Sending asks first.", t: ["read", "draft", "send"] },
    { ico: "▶", name: "Media", desc: "Plays, pauses, queues and casts to any screen in the house.", t: ["play, pause, queue, cast", "", "purchases"] },
    { ico: "▯", name: "Phone", desc: "Notifications, SMS, alarms, location and camera on Android.", t: ["read notifications and SMS", "set alarms", "send SMS, call"] },
    { ico: "✋", name: "Hands", desc: "The only part allowed to click and type. It reads each app's interface tree and checks every action worked.", t: ["read the screen's interface", "click, type in allowed apps", "banking, payment, password windows"], hands: true },
  ];
  const orbit = $("#orbit");
  const odName = $("#odName"), odDesc = $("#odDesc"), odTiers = $("#odTiers");
  const nodes = agents.map((a, i) => {
    const el = document.createElement("button");
    el.className = "agent-node" + (a.hands ? " hands" : "");
    el.innerHTML = `<span class="an-ico">${a.ico}</span><span>${a.name}</span>`;
    el.setAttribute("aria-label", a.name + " agent");
    const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
    el.dataset.angle = angle;
    orbit.appendChild(el);
    const show = () => selectAgent(i);
    el.addEventListener("mouseenter", show);
    el.addEventListener("focus", show);
    el.addEventListener("click", show);
    return el;
  });
  function selectAgent(i) {
    const a = agents[i];
    nodes.forEach((n, k) => n.classList.toggle("active", k === i));
    odName.textContent = a.name + " agent";
    odDesc.textContent = a.desc;
    const labels = ["Free", "Logged", "Confirm"];
    odTiers.innerHTML = a.t.map((txt, k) => txt ? `<div class="tier-row"><span class="badge t${k}">T${k} · ${labels[k]}</span><span>${txt}</span></div>` : "").join("");
  }
  let orbitRot = 0, orbitPaused = false;
  orbit.addEventListener("mouseenter", () => (orbitPaused = true));
  orbit.addEventListener("mouseleave", () => (orbitPaused = false));
  function placeNodes() {
    nodes.forEach((n) => {
      const ang = +n.dataset.angle + orbitRot;
      n.style.left = 50 + Math.cos(ang) * 38.3 + "%";
      n.style.top = 50 + Math.sin(ang) * 38.3 + "%";
    });
  }
  function orbitLoop() {
    if (!orbitPaused && !reduceMotion) orbitRot += 0.0016;
    placeNodes();
    requestAnimationFrame(orbitLoop);
  }
  placeNodes();
  orbitLoop();
  selectAgent(0);
  let autoAgent = 0;
  const agentTimer = setInterval(() => {
    if (orbitPaused) return;
    autoAgent = (autoAgent + 1) % agents.length;
    selectAgent(autoAgent);
  }, 3200);
  orbit.addEventListener("click", () => clearInterval(agentTimer), { once: true });

  /* ---------- Card spotlight + tilt ---------- */
  $$("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      if (finePointer && !reduceMotion) {
        const rx = ((y / r.height) - 0.5) * -5, ry = ((x / r.width) - 0.5) * 5;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------- Hash helper (demo only, not cryptographic) ---------- */
  function hash(str) {
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619);
      h2 = Math.imul(h2 ^ c, 2246822519) ^ (h2 >>> 13);
    }
    return ((h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0"));
  }

  /* ---------- Live demo ---------- */
  const scenarios = [
    {
      prompt: "find the PDF Mradul sent last week and move it to my college folder",
      steps: [
        { cap: "email.search", note: "from:Mradul · has:pdf · last 7 days", tier: 0 },
        { cap: "email.save_attachment", note: "DBMS_Assignment_3.pdf → Downloads", tier: 1 },
        { cap: "files.move", note: "→ D:\\College\\Sem 5\\DBMS", tier: 1 },
        { cap: "files.verify", note: "file present · 2.4 MB · checksum ok", tier: 0 },
      ],
    },
    {
      prompt: "reply to Priya that Thursday 4pm works and add it to my calendar",
      steps: [
        { cap: "email.read", note: "thread: “Project sync?” · Priya", tier: 0 },
        { cap: "calendar.find_free_slot", note: "Thu 16:00–16:30 is free", tier: 0 },
        { cap: "calendar.create_event", note: "Project sync · Thu 16:00", tier: 1 },
        { cap: "email.send", note: "to Priya · “Thursday 4pm works, see you then”", tier: 2, approval: "Send reply to Priya: “Thursday 4pm works, see you then”?" },
      ],
    },
    {
      prompt: "every morning at 8, brief me on mail, meetings and my laptop battery",
      steps: [
        { cap: "heartbeat.schedule", note: "daily · 08:00 · source=heartbeat", tier: 1 },
        { cap: "email.search", note: "unread · important · since yesterday", tier: 0, parallel: true },
        { cap: "calendar.read", note: "today · 3 meetings · 1 conflict found", tier: 0, parallel: true },
        { cap: "system.read_state", note: "device: laptop · battery 18%", tier: 0, parallel: true },
        { cap: "voice.speak", note: "“Good morning. One conflict at 2pm…”", tier: 0 },
      ],
    },
  ];
  const tierLabel = ["T0 · free", "T1 · logged", "T2 · confirm"];
  const demoPrompt = $("#demoPrompt"), demoSteps = $("#demoSteps"), demoState = $("#demoState"), demoStateText = $("#demoStateText");
  const approval = $("#approval"), approvalText = $("#approvalText"), approvalOk = $("#approvalOk"), phoneIdle = $("#phoneIdle");
  const demoAudit = $("#demoAudit");
  let runId = 0, prevHash = "0000000000000000", demoStarted = false;

  function setState(s) { demoState.dataset.s = s; demoStateText.textContent = s.replace("_", " "); }
  function audit(kind) {
    const h = hash(prevHash + kind + Date.now());
    prevHash = h;
    const li = document.createElement("li");
    li.innerHTML = `<span class="h">${h.slice(0, 8)}</span><span>${kind}</span>`;
    demoAudit.prepend(li);
    while (demoAudit.children.length > 6) demoAudit.lastChild.remove();
  }

  async function runScenario(idx) {
    const id = ++runId;
    const alive = () => id === runId;
    const sc = scenarios[idx];
    demoSteps.innerHTML = ""; demoAudit.innerHTML = ""; demoPrompt.textContent = "";
    approval.classList.remove("show"); phoneIdle.style.opacity = 1;
    setState("idle");
    for (let c = 0; c <= sc.prompt.length; c++) {
      if (!alive()) return;
      demoPrompt.textContent = sc.prompt.slice(0, c);
      await sleep(reduceMotion ? 0 : 22);
    }
    audit("task.submitted");
    setState("planning");
    await sleep(700);
    if (!alive()) return;
    const els = sc.steps.map((s) => {
      const li = document.createElement("li");
      li.className = "step";
      li.innerHTML = `<span class="s-ico"></span><span class="s-cap">${s.cap}${s.parallel ? ' <span style="color:var(--violet)">∥</span>' : ""}<small>${s.note}</small></span><span class="badge t${s.tier}">${tierLabel[s.tier]}</span>`;
      demoSteps.appendChild(li);
      return li;
    });
    for (let i = 0; i < els.length; i++) { await sleep(120); if (!alive()) return; els[i].classList.add("show"); }
    audit("task.planned");
    await sleep(500);

    let i = 0;
    while (i < sc.steps.length) {
      if (!alive()) return;
      // gather a parallel group
      const group = [i];
      if (sc.steps[i].parallel) while (group.length + i < sc.steps.length && sc.steps[i + group.length].parallel) group.push(i + group.length);
      for (const k of group) {
        const s = sc.steps[k];
        if (s.tier === 2) {
          els[k].classList.add("waiting");
          setState("awaiting_approval");
          audit("step.approval_requested");
          approvalText.textContent = s.approval;
          approval.classList.add("show"); phoneIdle.style.opacity = 0;
          await sleep(1900); if (!alive()) return;
          approvalOk.classList.add("press"); await sleep(220); approvalOk.classList.remove("press");
          approval.classList.remove("show"); phoneIdle.style.opacity = 1;
          audit("step.approved · user:phone");
          els[k].classList.remove("waiting");
        }
        els[k].classList.add("running");
        audit(`step.dispatched · ${s.cap}`);
      }
      setState("running");
      await sleep(1100 + Math.random() * 500);
      if (!alive()) return;
      for (const k of group) {
        els[k].classList.remove("running");
        els[k].classList.add("done");
        audit(`step.done · ${sc.steps[k].cap}`);
      }
      i += group.length;
      await sleep(250);
    }
    setState("done");
    audit("task.done");
    await sleep(4200);
    if (alive()) { const next = (idx + 1) % scenarios.length; selectTab(next); }
  }
  const tabs = $$(".demo-tab");
  function selectTab(i) {
    tabs.forEach((t, k) => { t.classList.toggle("active", k === i); t.setAttribute("aria-selected", String(k === i)); });
    runScenario(i);
  }
  tabs.forEach((t, i) => t.addEventListener("click", () => selectTab(i)));
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !demoStarted) { demoStarted = true; selectTab(0); }
  }, { threshold: 0.3 }).observe($("#demo"));

  /* ---------- Autonomy dial ---------- */
  const dialBtns = $$(".dial button"), thumb = $(".dial-thumb"), dialResult = $("#dialResult");
  const dialRows = [
    { label: "Search your email", tier: 0 },
    { label: "Move a file to Archive", tier: 1 },
    { label: "Send “On my way” to Mom, approved 5× before", tier: 2, trustable: true },
    { label: "Pay an electricity bill", tier: 2, never: true },
  ];
  function setDial(level) {
    dialBtns.forEach((b, i) => { b.classList.toggle("active", i === level); b.setAttribute("aria-checked", String(i === level)); });
    thumb.style.transform = `translateX(${level * 100}%)`;
    dialResult.innerHTML = dialRows.map((r) => {
      let run;
      if (r.tier === 0) run = true;
      else if (r.tier === 1) run = level !== 0;
      else run = level === 2 && r.trustable && !r.never;
      const state = run ? `<span class="dr-state run">runs on its own</span>` : `<span class="dr-state ask">asks you first</span>`;
      return `<div class="dr-row"><span class="dr-left"><span class="badge t${r.tier}">T${r.tier}</span>${r.label}</span>${state}</div>`;
    }).join("");
  }
  dialBtns.forEach((b, i) => b.addEventListener("click", () => setDial(i)));
  setDial(1);

  /* ---------- Audit hash chain ---------- */
  const chainEl = $("#chain"), chainStatus = $("#chainStatus");
  const baseEntries = [
    "task.submitted", "step.dispatched", "step.approved", "step.done", "task.done", "autonomy.set",
  ];
  let entries;
  function resetChain() {
    entries = baseEntries.map((kind) => ({ kind }));
    let prev = "genesis";
    entries.forEach((e, i) => { e.stored = hash(prev + "|" + i + "|" + e.kind); prev = e.stored; });
    renderChain();
  }
  function renderChain() {
    // Recompute the chain from the stored data; the first mismatch breaks everything after it.
    let prev = "genesis", brokenAt = -1;
    const rows = entries.map((e, i) => {
      const expect = hash(prev + "|" + i + "|" + e.kind);
      const ok = brokenAt === -1 && expect === e.stored;
      if (!ok && brokenAt === -1) brokenAt = i;
      prev = brokenAt === -1 ? e.stored : expect;
      return { e, i, ok };
    });
    chainEl.innerHTML = rows.map(({ e, i, ok }) => `
      <button class="block ${!ok ? "broken" : ""} ${e.tampered ? "tampered" : ""}" data-i="${i}" title="Tamper with this entry">
        <span class="b-seq">#${String(i + 1).padStart(2, "0")}</span>
        <span class="b-kind">${e.kind}</span>
        <span class="b-hash">${e.stored.slice(0, 10)}…</span>
      </button>`).join("");
    chainStatus.innerHTML = brokenAt === -1
      ? `<span class="ok">✓ Audit verified · ${entries.length} entries intact</span>`
      : `<span class="bad">✗ BROKEN at entry ${brokenAt + 1} · ${entries.length - brokenAt} entries can't be trusted</span>`;
    $$(".block", chainEl).forEach((b) => b.addEventListener("click", () => tamper(+b.dataset.i)));
  }
  function tamper(i) {
    const e = entries[i];
    if (e.tampered) return;
    const swaps = { approved: "denied", dispatched: "cancelled", done: "failed", submitted: "cancelled", set: "reset" };
    e.kind = e.kind.replace(/\.(\w+)$/, (m, v) => "." + (swaps[v] || v + " (edited)"));
    e.tampered = true;
    renderChain();
  }
  $("#chainReset").addEventListener("click", resetChain);
  resetChain();

  /* ---------- Counters ---------- */
  const counterObserver = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      counterObserver.unobserve(e.target);
      const target = +e.target.dataset.count;
      if (reduceMotion || target === 0) { e.target.textContent = target; return; }
      const start = performance.now(), dur = 1400;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        e.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$(".stat-num").forEach((el) => counterObserver.observe(el));

  /* ---------- Join canvas: drifting network ---------- */
  (function joinCanvas() {
    const c = $("#joinCanvas"), ctx = c.getContext("2d");
    let w, h, dots = [], visible = false;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 9000);
      dots = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 }));
    }
    resize();
    window.addEventListener("resize", resize);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(c);
    function frame() {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const d of dots) {
          if (!reduceMotion) { d.x += d.vx; d.y += d.vy; }
          if (d.x < 0 || d.x > w) d.vx *= -1;
          if (d.y < 0 || d.y > h) d.vy *= -1;
        }
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const a = dots[i], b = dots[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < 110) {
              ctx.strokeStyle = `rgba(167,139,250,${(1 - dist / 110) * 0.25})`;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          ctx.fillStyle = "rgba(124,243,255,.55)";
          ctx.beginPath(); ctx.arc(dots[i].x, dots[i].y, 1.4, 0, Math.PI * 2); ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    }
    frame();
  })();

  /* ---------- Join form (static: no backend yet) ---------- */
  $("#joinForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#email").value.trim();
    try { const list = JSON.parse(localStorage.getItem("alfred-waitlist") || "[]"); list.push(email); localStorage.setItem("alfred-waitlist", JSON.stringify(list)); } catch (_) {}
    e.target.hidden = true;
    $("#joinDone").hidden = false;
  });
})();

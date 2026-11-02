# ALFRED website: design review and redesign (2026-10-25)

## Why the previous React version looked cheap

1. **No identity.** Everything was grey on near-black with no brand color, no imagery and a generic logo. It read like a docs template, not a product launch.
2. **One layout, repeated eight times.** Every section was eyebrow, small headline, grey paragraph, then a grid of bordered text boxes. Nothing changed rhythm, so 8,700px of page felt like one long table.
3. **Type too small for a hero product.** Body copy at 14px, card titles at 16 to 18px and section titles at 44px. Premium sites use very large display type with tight spacing, then generous small text.
4. **The hero had no visual hook.** A headline and two buttons over a flat black background. The product demo underneath was small, grey and easy to miss.
5. **The grey half of each headline read as "disabled",** not as contrast. It dimmed ALFRED's own claims.
6. **Explaining instead of showing.** Ten capabilities, six safety rules and five steps were all paragraphs in boxes. Nothing demonstrated the product.
7. **Flat.** No light, depth, layering or shadow, and the only motion was a fade-up.
8. **The comparison was a checkbox table** with no story about why ALFRED wins.

## What changed

- **Brand system:** one accent (electric blue `#6e8bff`), a new logo (core ring with the A-chevron), deeper black canvas, film grain, cards with a light catch on the top edge and deep shadows. Gradients are used only as light sources (glows), never on text or buttons.
- **Display type:** headlines now 64 to 148px with tight tracking. The dim half is reserved for the "others" side ("Other AIs talk."), and ALFRED's claim is always bright.
- **Hero:** a signature animated "core" (watch-bezel ticks, device orbit, travelling light arc, gate ring, lit centre) rises behind the product shot, follows the cursor slightly, and the product window tilts back and settles flat as you scroll.
- **Manifesto:** words light up one by one as you scroll.
- **How it works:** a pinned scroll story. The scene stays put while five steps play out on a live diagram: request from phone, planning, the tier 2 gate asking you, the Files agent acting and verifying, and the audit log filling in.
- **Agents:** an interactive orbit of the ten agents around the orchestrator, with a light pulse to the selected one and its tiers on the right.
- **Capabilities:** a bento grid where each card shows the idea (device constellation, live voice waveform, UI tree with the Send button found, event timeline, memory chips, a task surviving a reboot, a verify check).
- **Trust:** three large tier cards, restyled autonomy dial and tamper-evident audit chain, and a numbered safety grid.
- **Compare:** a "Built to talk" vs "Built to do" split, then the table with ALFRED's column lit.
- **Roadmap:** a timeline with Phase 0 lit. **Join:** giant closing line over the core. **Footer:** proper columns and a large ALFRED wordmark.
- **Nav:** floating glass pill.

No new dependencies. Same stack (Vite, React, Tailwind 4, Motion, Geist). Build passes, no console errors, no horizontal scroll at 1440px or 390px.

## Still open

- The email form has no backend; it only saves to the visitor's browser.
- Re-check the comparison claims about Grok, Meta Muse, OpenClaw and Perplexity Computer before publishing.

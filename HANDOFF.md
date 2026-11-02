# ALFRED website: handoff (2026-10-25)

Context for the "Alfred's advertisement website" thread. This work was done in a different chat by mistake.

## What changed

The old site (plain `index.html` + `styles.css` + `main.js`) was rebuilt as React, because it looked vibe-coded and used gradients everywhere.

- **Stack:** Vite 8, React 19, TypeScript, Tailwind CSS 4, Motion (animations), Geist + Geist Mono fonts.
- **Old files:** kept in `_old/`, not deleted. Delete when no longer needed.
- **Run:** `npm run dev` → http://localhost:5173. Build: `npm run build`.

## Design rules now in place (updated 2026-10-25, see DESIGN-REVIEW.md)

- One brand accent (`#6e8bff`), near-black canvas (`#050506`), white text, grey secondary text, hairline borders.
- Gradients only as light sources (glows behind the core and key visuals), never on text or buttons.
- Color still carries meaning in the product UI: green = done, amber = needs approval, light blue = tier 1.
- Headlines: dim part for "others" or the setup, bright part for ALFRED's claim.

## Layout (src/)

- `data.ts`: all copy and data (scenarios, agents, capabilities, tiers, comparison, roadmap).
- `components/ui.tsx`: Logo, Reveal (fade-up), SectionHead, Section, TierBadge, ButtonLink.
- `components/ProductWindow.tsx`: the hero product shot, a live task demo (typing, planning, tier gate, phone approval, audit log) cycling through 3 scenarios.
- `components/Core.tsx`: the animated core visual used in the hero and the closing section.
- `sections/`: Nav, Hero, HowItWorks (Manifesto, Agents orbit), Story (pinned 5-step scroll story), Capabilities (visual bento), Trust (tiers, autonomy dial, tamper-evident audit chain, safety grid), Rest (Compare, Roadmap, Join, Footer).

## Checked

- Desktop (1440px) and mobile (375px): no horizontal overflow, demo, dial and audit chain all work, no console errors, build passes.

## Open items

- The original request said "remove this and these gradients". The gradients are gone, but "this" referred to a screenshot that wasn't visible, so it's unknown whether a specific element still needs removing.
- The email form has no backend; it only saves to the visitor's localStorage.
- The comparison table makes claims about Grok, Meta Muse, OpenClaw and Perplexity Computer. Worth re-checking before publishing.

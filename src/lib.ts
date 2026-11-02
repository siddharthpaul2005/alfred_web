/** Short display hash for the demos. Not cryptographic. */
export function hash(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519) ^ (h2 >>> 13);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Page-wide heartbeat: anything ALFRED "does" on the page fires a pulse the core reacts to. */
export type PulseKind = "act" | "ask" | "done";
export const pulse = (kind: PulseKind = "act") => window.dispatchEvent(new CustomEvent<PulseKind>("alfred:pulse", { detail: kind }));
export function onPulse(fn: (kind: PulseKind) => void) {
  const h = (e: Event) => fn((e as CustomEvent<PulseKind>).detail);
  window.addEventListener("alfred:pulse", h);
  return () => window.removeEventListener("alfred:pulse", h);
}

/** A request the visitor typed or said in the Ask bar. */
export type AskEvent = { text: string; needsYes: boolean; device: string };
export const announceAsk = (detail: AskEvent) => window.dispatchEvent(new CustomEvent<AskEvent>("alfred:ask", { detail }));
export function onAsk(fn: (e: AskEvent) => void) {
  const h = (e: Event) => fn((e as CustomEvent<AskEvent>).detail);
  window.addEventListener("alfred:ask", h);
  return () => window.removeEventListener("alfred:ask", h);
}

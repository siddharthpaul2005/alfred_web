/** ALFRED's speaking voice, using the browser's built-in speech. */

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

// Pick the most natural-sounding English voice the browser offers, favouring a British one.
export function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const prefer = [/Google UK English Male/i, /Ryan.*Natural/i, /Thomas.*Natural/i, /Natural.*en-GB/i, /Daniel/i, /George/i, /Guy.*Natural/i, /Natural/i];
  for (const re of prefer) {
    const v = voices.find((x) => re.test(x.name) && x.lang.startsWith("en"));
    if (v) return v;
  }
  return voices.find((v) => v.lang === "en-GB") ?? voices.find((v) => v.lang.startsWith("en"));
}

/** Say `text` out loud. `onWord` fires on every spoken word, handy for driving visuals. */
export function speak(text: string, h: { onStart?: () => void; onWord?: (charIndex: number, charLength: number) => void; onEnd?: () => void } = {}) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-GB";
  u.rate = 1;
  u.pitch = 0.95;
  u.onstart = () => h.onStart?.();
  u.onboundary = (e) => h.onWord?.(e.charIndex, e.charLength || 1);
  u.onend = u.onerror = () => h.onEnd?.();
  synth.speak(u);
}

export const stopSpeaking = () => canSpeak() && window.speechSynthesis.cancel();

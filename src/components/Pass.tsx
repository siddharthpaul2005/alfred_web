import type { Pass } from "../waitlist";

/** A little face in the pass's own colour. Every signup gets one; nobody's name is shown. */
export function PassFace({ hue, size = 40, className = "" }: { hue: number; size?: number; className?: string }) {
  const mood = hue % 3; // small variety: smile, grin, or a happy "w" mouth
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={`hsl(${hue} 85% 72%)`} />
      <circle cx="13" cy="25" r="3.2" fill={`hsl(${hue} 90% 62%)`} opacity="0.7" />
      <circle cx="27" cy="25" r="3.2" fill={`hsl(${hue} 90% 62%)`} opacity="0.7" />
      <circle cx="14.5" cy="18" r="2.2" fill="#141311" />
      <circle cx="25.5" cy="18" r="2.2" fill="#141311" />
      <circle cx="15.2" cy="17.3" r="0.7" fill="#fff" />
      <circle cx="26.2" cy="17.3" r="0.7" fill="#fff" />
      {mood === 0 && <path d="M16 24q4 4 8 0" stroke="#141311" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
      {mood === 1 && <path d="M15.5 23.5h9q-1 5-4.5 5t-4.5-5z" fill="#141311" />}
      {mood === 2 && <path d="M15.5 24q2.25 3 4.5 0q2.25 3 4.5 0" stroke="#141311" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

/** The thank-you pass someone gets after joining. */
export function PassCard({ pass, again = false }: { pass: Pass; again?: boolean }) {
  const no = String(pass.number).padStart(3, "0");
  return (
    <div
      className="relative mx-auto w-full max-w-[380px] overflow-hidden lg:mx-0 rounded-[24px] p-6 text-left text-[#141311] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]"
      style={{ background: `linear-gradient(135deg, hsl(${pass.hue} 90% 88%), hsl(${(pass.hue + 50) % 360} 85% 82%))` }}
    >
      {/* ticket notches */}
      <span className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-canvas" />
      <span className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-canvas" />
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium opacity-70">ALFRED early access</p>
        <p className="font-mono text-[13px] opacity-70">#{no}</p>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <PassFace hue={pass.hue} size={64} className="shrink-0 drop-shadow-sm" />
        <div>
          <p className="display text-[34px] leading-none">{pass.nickname}</p>
          <p className="mt-1.5 text-[14px] opacity-75">{again ? "You're already on the list. Here's your pass again." : "Thank you for joining. This pass is yours."}</p>
        </div>
      </div>
      <div className="mt-6 border-t border-dashed border-[#141311]/25 pt-4 text-[13px] opacity-75">
        You'll appear on the wall as <b>{pass.nickname}</b>. Your name and email stay private.
      </div>
    </div>
  );
}

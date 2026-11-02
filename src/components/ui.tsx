import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { tierName, type Tier } from "../data";

/** The ALFRED mark: a core ring with the A-chevron inside. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14.25" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M8.5 22.5 16 8l7.5 14.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="18.6" r="2.1" className="fill-accent" />
    </svg>
  );
}

/** Fades content up once as it scrolls into view. */
export function Reveal({ children, delay = 0, className = "", y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return (
    <p className={`text-[14px] font-medium tracking-[-0.005em] text-accent-soft ${center ? "text-center" : ""}`}>
      {children}
    </p>
  );
}

/** Section heading. `dim` is the part said about others (or the setup), `title` is ALFRED's claim. */
export function SectionHead({
  eyebrow,
  title,
  dim,
  body,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  dim?: ReactNode;
  body?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={center ? "mx-auto max-w-4xl text-center" : "max-w-4xl"}>
      <Eyebrow center={center}>{eyebrow}</Eyebrow>
      <h2 className="display mt-4 text-[44px] text-balance sm:text-[60px] lg:text-[76px]">
        {dim && <span className="text-fg-3">{dim} </span>}
        <em className="italic">{title}</em>
      </h2>
      {body && (
        <p className={`mt-5 max-w-2xl text-[16px] leading-relaxed text-fg-2 text-pretty sm:text-[18px] ${center ? "mx-auto" : ""}`}>{body}</p>
      )}
    </Reveal>
  );
}

export function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative flex min-h-svh snap-start flex-col justify-center py-[clamp(3rem,8svh,5rem)] ${className}`}>
      <div className="container-page w-full">{children}</div>
    </section>
  );
}

const tierDot: Record<Tier, string> = { 0: "bg-fg-2", 1: "bg-t1", 2: "bg-wait" };

export function TierBadge({ tier, label = true }: { tier: Tier; label?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-canvas/60 px-2 py-0.5 font-mono text-[11px] text-fg-2">
      <span className={`size-1.5 rounded-full ${tierDot[tier]}`} />
      T{tier}
      {label && <span className="hidden text-fg-3 sm:inline">{tierName[tier]}</span>}
    </span>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const base = "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium transition-all duration-300";
  const styles =
    variant === "primary"
      ? "bg-fg text-canvas hover:bg-accent"
      : "border border-line-strong bg-fg/[0.02] text-fg backdrop-blur hover:bg-fg/[0.06]";
  return (
    <a href={href} className={`${base} ${styles}`}>
      {children}
      <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
    </a>
  );
}

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { SurfaceLogo, surfaceColor } from "../components/SurfaceLogo";
import { surfaces, type Scenario } from "../data";
import { plan } from "../planner";
import { announceAsk } from "../lib";
import { TaskLauncher } from "../components/TaskLauncher";
import { ProductWindow } from "../components/ProductWindow";
import { LiveFeed } from "../components/LiveFeed";
import { ButtonLink } from "../components/ui";

const ease = [0.16, 1, 0.3, 1] as const;

// What ALFRED does, retyped every few seconds in the headline.
const VERBS = ["does", "replies", "books it", "pays it", "files it", "fixes it", "remembers", "shows up"];

/** Types a verb, holds it, erases it and moves to the next one. Static "does" for reduced motion. */
function TypedVerb() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [n, setN] = useState(VERBS[0].length);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const word = VERBS[i];
    let t: number;
    if (!erasing && n === word.length) t = window.setTimeout(() => setErasing(true), 3200); // hold
    else if (erasing && n === 0) {
      t = window.setTimeout(() => {
        setErasing(false);
        setI((i + 1) % VERBS.length);
      }, 250);
    } else t = window.setTimeout(() => setN(n + (erasing ? -1 : 1)), erasing ? 45 : 95);
    return () => clearTimeout(t);
  }, [i, n, erasing, reduce]);

  return (
    <span className="whitespace-nowrap">
      <em className="italic">{VERBS[i].slice(0, n)}</em>
      <span aria-hidden="true" className="ml-[0.03em] inline-block h-[0.7em] w-[0.03em] translate-y-[0.04em] animate-pulse rounded-full bg-accent/80 align-baseline" />
      <span className="text-accent">.</span>
      <span className="sr-only">ALFRED does.</span>
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const [custom, setCustom] = useState<Scenario | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 60, damping: 20 });
  const py = useSpring(my, { stiffness: 60, damping: 20 });

  const onMove = (e: PointerEvent) => {
    if (reduce) return;
    mx.set((e.clientX / window.innerWidth - 0.5) * 30);
    my.set((e.clientY / window.innerHeight - 0.5) * 20);
  };

  // The product shot starts tilted back and settles flat as it scrolls in.
  const shot = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: shot, offset: ["start end", "start 0.35"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [28, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.88, 1]);
  const shotOpacity = useTransform(scrollYProgress, [0, 0.6], [0.3, 1]);

  // The light drifts up and fades as you leave the hero.
  const { scrollY } = useScroll();
  const glowY = useTransform(scrollY, [0, 900], [0, -160]);
  const glowOpacity = useTransform(scrollY, [0, 900], [1, 0.2]);

  return (
    <section id="top" onPointerMove={onMove} className="relative isolate overflow-hidden">
      <motion.div style={{ x: px, y: glowY, opacity: glowOpacity }} className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[115svh]" aria-hidden="true">
        <motion.div style={{ y: py }} className="absolute inset-0">
          <div className="aurora aurora-1" />
          <div className="aurora aurora-2" />
          <div className="aurora aurora-3" />
        </motion.div>
      </motion.div>
      {/* darken behind the type so it always reads */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 hidden h-svh sm:block">
        <LiveFeed />
      </div>

      <div className="container-page">
        <div className="flex min-h-svh snap-start flex-col justify-center pb-10 pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="display text-[60px] sm:text-[min(11vw,15svh)]">
            <motion.span
              className="block text-fg-3"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, ease, delay: 0.1 }}
            >
              Other AIs talk.
            </motion.span>
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, ease, delay: 0.3 }}
            >
              ALFRED <TypedVerb />
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.55 }}
            className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-fg-2 text-pretty sm:text-[19px]"
          >
            One brain, many hands. ALFRED lives on every device you own and does real work in your real apps. It acts on its own when an action can be undone, and asks you first when it can't.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.7 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <ButtonLink href="#join">Get early access</ButtonLink>
            <ButtonLink href="#product" variant="secondary">See it work</ButtonLink>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.9 }}
          className="mt-12 sm:mt-14"
        >
          <TaskLauncher
            onTask={(t) => {
              const sc = plan(t);
              setCustom(sc);
              announceAsk({ text: t, needsYes: sc.steps.some((s) => s.tier === 2), device: "Your PC" });
            }}
          />
        </motion.div>
        </div>
      </div>

      <div className="dark mx-2 rounded-[28px] bg-canvas sm:mx-4 sm:rounded-[40px]">
        <div className="container-page flex min-h-svh snap-start flex-col justify-center gap-14 py-20">
        <div className="text-center">
          <p className="text-[14px] font-medium text-accent-soft">Watch it work</p>
          <h2 className="display mt-3 text-[40px] sm:text-[56px]">One request, <em className="italic">start to finish.</em></h2>
        </div>
        <div ref={shot} className="[perspective:1600px]">
          <motion.div id="product" style={{ rotateX, scale, opacity: shotOpacity, transformOrigin: "50% 0%" }} className="relative scroll-mt-28">
            <div className="glow-accent absolute inset-x-[15%] -top-10 h-40 opacity-50" />
            <ProductWindow custom={custom} onCustomDone={() => setCustom(null)} />
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="text-[14px] text-fg-3">One ALFRED, wherever you are</p>
          <ul className="flex max-w-5xl flex-wrap justify-center gap-x-10 gap-y-4">
            {surfaces.map((s) => (
              <li key={s} className="flex items-center gap-2.5 text-[17px] font-medium tracking-[-0.01em] text-fg-2 transition-colors hover:text-fg">
                <span style={{ color: surfaceColor[s] }} className="shrink-0"><SurfaceLogo name={s} className="size-[22px]" /></span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </section>
  );
}

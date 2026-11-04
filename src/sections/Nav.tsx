import { useEffect, useState } from "react";
import { nav } from "../data";
import { Logo } from "../components/ui";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Step out of the way while someone is in the waitlist form.
  const [away, setAway] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const join = document.getElementById("join");
    if (!join) return;
    const io = new IntersectionObserver(([e]) => setAway(e.isIntersecting), { threshold: 0.35 });
    io.observe(join);
    return () => io.disconnect();
  }, []);

  const solid = scrolled || open;
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-all duration-500 sm:px-4 ${away && !open ? "pointer-events-none -translate-y-[120%] opacity-0" : ""}`}
    >
      <div
        className={`mx-auto max-w-[1180px] rounded-[22px] border transition-all duration-500 ${
          solid ? "border-line bg-canvas/80 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.25)] backdrop-blur-xl" : "border-transparent"
        }`}
      >
        <div className="flex h-14 items-center gap-8 pl-5 pr-2">
          <a href="#top" className="flex items-center gap-2.5 text-fg" aria-label="ALFRED home">
            <Logo className="size-6" />
            <span className="text-[15px] font-semibold tracking-[0.08em]">ALFRED</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-3.5 py-1.5 text-[14px] text-fg-2 transition-colors hover:bg-fg/[0.05] hover:text-fg">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <a href="#join" className="hidden h-10 items-center rounded-full bg-fg px-5 text-[14px] font-medium text-canvas transition-colors hover:bg-accent sm:inline-flex">
              Get early access
            </a>
            <button
              className="grid size-10 place-items-center rounded-full text-fg-2 hover:text-fg md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                {open ? <path d="m5 5 10 10M15 5 5 15" /> : <path d="M3 7h14M3 13h14" />}
              </svg>
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col px-5 pb-4 md:hidden">
            {[...nav, { href: "#join", label: "Get early access" }].map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-t border-line py-3.5 text-[16px] text-fg-2">
                {n.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

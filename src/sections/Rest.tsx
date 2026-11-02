import { useState, type FormEvent } from "react";
import { compareCols, compareRows, nav, versus, type Mark } from "../data";
import { Core } from "../components/Core";
import { Logo, Reveal, Section, SectionHead } from "../components/ui";

function MarkIcon({ m, strong = false }: { m: Mark; strong?: boolean }) {
  if (m === "y")
    return (
      <span className={`mx-auto grid size-6 place-items-center rounded-full ${strong ? "bg-accent text-canvas" : "bg-fg/[0.06] text-fg"}`}>
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-label="Core to the product">
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      </span>
    );
  if (m === "u") return <span className="mx-auto block text-center font-mono text-[12px] text-fg-4" aria-label="Not publicly stated">?</span>;
  if (m === "p") return <span className="mx-auto block size-2.5 rounded-full border-[1.5px] border-fg-2" aria-label="Partly" />;
  return <span className="mx-auto block h-px w-3 bg-fg-4" aria-label="Not its focus" />;
}

const talk = ["Run on a computer in someone else's data center", "Sign into your accounts from their servers", "Keep your memory and history on their side", "Logs you have to take on trust", "Need the internet for everything"];
const doIt = ["Runs on your own PC, laptop and phone", "Passwords stay in your OS vault, never in a prompt", "Memory stays on your machine", "Every step in a log you can verify yourself", "Simple commands work offline"];

export function Compare() {
  return (
    <>
    <Section id="compare">
      <SectionHead
        eyebrow="Compare"
        dim="Their agents rent a computer in the cloud."
        title="ALFRED lives on yours."
        body="Grok Bot and Meta's Muse are impressive agents. They work from their companies' clouds. ALFRED does the same kind of work on the devices you already own, with brakes you can see and a record you can check."
      />

      <Reveal className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-line p-8 sm:p-10">
          <p className="text-[13px] font-medium text-fg-3">Cloud agents</p>
          <ul className="mt-8 space-y-4">
            {talk.map((t) => (
              <li key={t} className="flex items-center gap-3 text-[16px] text-fg-3">
                <span className="h-px w-4 bg-fg-4" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="card relative overflow-hidden rounded-[28px] border-accent/30 p-8 sm:p-10">
          <div className="glow-accent absolute -right-20 -top-20 size-72 opacity-30" />
          <p className="relative text-[13px] font-medium text-accent-soft">ALFRED</p>
          <ul className="relative mt-8 space-y-4">
            {doIt.map((t) => (
              <li key={t} className="flex items-center gap-3 text-[16px] text-fg">
                <span className="shrink-0 [&>*]:mx-0"><MarkIcon m="y" strong /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
    <Section>
      <Reveal>
        <div className="card overflow-x-auto rounded-[28px]">
          <table className="w-full min-w-[780px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                <th className="w-[34%] px-8 py-5" />
                {compareCols.map((c, i) => (
                  <th
                    key={c}
                    scope="col"
                    className={`relative px-3 py-5 text-center text-[14px] font-medium ${i === 0 ? "bg-accent/[0.07] text-fg" : "text-fg-3"}`}
                  >
                    {i === 0 && <span className="absolute inset-x-0 top-0 h-px bg-accent" />}
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((r) => (
                <tr key={r.label} className="border-line transition-colors not-last:border-b hover:bg-fg/[0.015]">
                  <th scope="row" className="px-8 py-2.5 text-left text-[15px] font-normal text-fg-2">{r.label}</th>
                  {r.marks.map((m, i) => (
                    <td key={i} className={`px-3 py-2.5 ${i === 0 ? "bg-accent/[0.07]" : ""}`}>
                      <MarkIcon m={m} strong={i === 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-fg-3 [&_*]:mx-0">
          <span className="flex items-center gap-2"><MarkIcon m="y" /> Core to the product</span>
          <span className="flex items-center gap-2"><MarkIcon m="p" /> Partly</span>
          <span className="flex items-center gap-2"><MarkIcon m="n" /> Not its focus</span>
          <span className="flex items-center gap-2"><MarkIcon m="u" /> Not publicly stated</span>
        </div>
      </Reveal>

      <Reveal className="mt-8 grid gap-4 md:grid-cols-3">
        {versus.map((v) => (
          <div key={v.title} className="rounded-[22px] border border-line p-6">
            <h4 className="text-[17px] font-medium tracking-[-0.02em]">{v.title}</h4>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-fg-2">{v.body}</p>
          </div>
        ))}
      </Reveal>
      <p className="mt-6 text-[12px] text-fg-3">Grok Bot details from x.ai/bot as of October 25, 2026. These products change quickly; check before you rely on this table.</p>
    </Section>
    </>
  );
}

export function Join() {
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // No backend yet: keep the address in this browser only.
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    try {
      const list = JSON.parse(localStorage.getItem("alfred-waitlist") ?? "[]");
      localStorage.setItem("alfred-waitlist", JSON.stringify([...list, email]));
    } catch {
      /* storage unavailable */
    }
    setDone(true);
  };

  return (
    <section id="join" className="relative isolate flex min-h-svh snap-start flex-col justify-center overflow-hidden py-20">
      <div className="absolute left-1/2 top-1/2 -z-10 w-[900px] -translate-x-1/2 -translate-y-1/2 sm:w-[1100px]">
        <Core className="w-full opacity-70" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_45%_45%_at_50%_50%,rgb(5_5_6/0.8),transparent)]" />
      <Reveal className="container-page text-center">
        <h2 className="display text-[46px] text-balance sm:text-[72px] lg:text-[88px]">
          <span className="block text-fg-4">Stop chatting with AI.</span>
          Put it to work<span className="text-accent">.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[17px] text-fg-2 sm:text-[19px]">Be one of the first to run ALFRED on your own devices.</p>
        {done ? (
          <p className="mt-12 font-mono text-[15px] text-ok">You're on the list. ALFRED will be in touch.</p>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-10 flex max-w-lg flex-col gap-2 rounded-[22px] border border-line-strong bg-canvas/70 p-2 backdrop-blur-xl sm:flex-row sm:rounded-full">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 min-w-0 flex-1 bg-transparent px-5 text-[16px] text-fg placeholder:text-fg-3 focus:outline-none"
            />
            <button type="submit" className="h-12 rounded-full bg-fg px-6 text-[15px] font-medium text-canvas shadow-[0_8px_40px_-10px_var(--color-accent)] transition-shadow hover:shadow-[0_10px_60px_-6px_var(--color-accent)]">
              Request access
            </button>
          </form>
        )}
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="size-7 text-fg" />
            <span className="text-[16px] font-semibold tracking-[0.08em]">ALFRED</span>
          </div>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-fg-2">One brain, many hands. Built local-first, with you in control.</p>
        </div>
        <div>
          <p className="text-[13px] font-medium text-fg-3">Product</p>
          <ul className="mt-4 space-y-2.5 text-[15px] text-fg-2">
            {nav.map((n) => (
              <li key={n.href}><a href={n.href} className="transition-colors hover:text-fg">{n.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-medium text-fg-3">Company</p>
          <ul className="mt-4 space-y-2.5 text-[15px] text-fg-2">
            <li><a href="#join" className="transition-colors hover:text-fg">Early access</a></li>
          </ul>
        </div>
      </div>
      <div className="container-page flex items-center justify-between border-t border-line py-6 text-[13px] text-fg-3">
        <span>© 2026 ALFRED</span>
        <span className="font-mono">Made for people who'd rather be doing something else.</span>
      </div>
      <p aria-hidden="true" className="display pointer-events-none -mb-[0.2em] select-none text-center text-[27vw] leading-none text-fg/[0.035]">
        ALFRED
      </p>
    </footer>
  );
}

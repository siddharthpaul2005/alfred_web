import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { PassCard, PassFace } from "../components/Pass";
import { joinWaitlist, loadWall, waitlistLive, type Pass } from "../waitlist";
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

const devices = ["Windows PC", "Laptop", "Android phone", "All of them"];

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

/** Waitlist: the form, the thank-you pass, and a public wall of anonymous passes. */
export function Join() {
  const [mine, setMine] = useState<{ pass: Pass; again?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wall, setWall] = useState<{ count: number; passes: Pass[] }>({ count: 0, passes: [] });

  useEffect(() => {
    const load = () => loadWall().then(setWall).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    setError("");
    try {
      const res = await joinWaitlist({ name: get("name"), email: get("email"), device: get("device"), firstTask: get("firstTask"), website: get("website") });
      setMine(res);
      loadWall().then(setWall).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "h-12 w-full min-w-0 rounded-2xl border border-line-strong bg-surface px-4 text-[15px] font-normal text-fg placeholder:text-fg-3 transition-colors focus:border-accent-soft focus:outline-none";
  const [device, setDevice] = useState("");

  return (
    <section id="join" className="relative isolate flex min-h-svh snap-start flex-col justify-center overflow-hidden py-20">
      <div className="absolute left-1/2 top-1/2 -z-10 w-[900px] -translate-x-1/2 -translate-y-1/2 sm:w-[1100px]">
        <Core className="w-full opacity-30" />
      </div>
      <div className="container-page grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <Reveal>
          <p className="text-[14px] font-medium text-accent-soft">Early access</p>
          <h2 className="display mt-3 text-[44px] text-balance sm:text-[64px] lg:text-[76px]">
            <span className="text-fg-3">Stop chatting with AI. </span>
            <em className="italic">Put it to work.</em>
          </h2>
          <p className="mt-5 max-w-lg text-[17px] text-fg-2">Join the waitlist to be one of the first to run ALFRED on your own devices. Everyone who joins gets a pass.</p>

          {mine ? (
            <motion.div initial={{ opacity: 0, y: 20, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 140, damping: 14 }} className="mt-10 lg:mx-0">
              <PassCard pass={mine.pass} again={mine.again} />
            </motion.div>
          ) : (
            <form onSubmit={submit} className="relative mt-10 grid w-full max-w-lg gap-3 sm:grid-cols-2">
              <label className="sr-only" htmlFor="wl-name">Your name</label>
              <input id="wl-name" name="name" required autoComplete="name" placeholder="Your name" className={field} />
              <label className="sr-only" htmlFor="wl-email">Email</label>
              <input id="wl-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={field} />
              <label className="sr-only" htmlFor="wl-device">Where you'd use ALFRED</label>
              <div className="relative sm:col-span-2">
                <select
                  id="wl-device"
                  name="device"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className={`${field} appearance-none pr-11 ${device ? "" : "text-fg-3"}`}
                >
                  <option value="" disabled>Where would you use ALFRED?</option>
                  {devices.map((d) => <option key={d} className="text-fg">{d}</option>)}
                </select>
                <svg viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-fg-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </div>
              <label className="sr-only" htmlFor="wl-task">First thing you'd hand ALFRED (optional)</label>
              <input id="wl-task" name="firstTask" placeholder="First thing you'd hand ALFRED (optional)" className={`${field} sm:col-span-2`} />
              {/* honeypot: hidden from people, bots fill it in */}
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              <button type="submit" disabled={busy} className="mt-1 h-12 rounded-2xl bg-fg px-6 text-[15px] font-medium text-canvas transition-colors hover:bg-accent-soft disabled:opacity-60 sm:col-span-2">
                {busy ? "Joining…" : "Join the waitlist"}
              </button>
              {error && <p className="text-[14px] text-bad sm:col-span-2">{error}</p>}
              <p className="text-[13px] leading-relaxed text-fg-3 sm:col-span-2">Only the ALFRED team sees your name and email. The wall shows your pass, never you.</p>
            </form>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-[28px] border border-line bg-surface/70 p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[15px] font-medium">Who's waiting</p>
              <p className="text-[13px] text-fg-3">{wall.count} {wall.count === 1 ? "pass" : "passes"} so far{waitlistLive ? "" : " · preview"}</p>
            </div>
            {wall.passes.length === 0 ? (
              <p className="mt-10 pb-6 text-center text-[15px] text-fg-3">No one yet. Be pass #001.</p>
            ) : (
              <>
                <ul className="mt-6 flex flex-wrap gap-2.5">
                  <AnimatePresence initial={false}>
                    {wall.passes.slice(0, 40).map((p) => (
                      <motion.li
                        key={p.number}
                        layout
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`rounded-full ${mine?.pass.number === p.number ? "ring-2 ring-accent-soft ring-offset-2 ring-offset-surface" : ""}`}
                        title={`#${p.number} ${p.nickname}`}
                      >
                        <PassFace hue={p.hue} size={40} className="transition-transform hover:-translate-y-1 hover:rotate-6" />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                  {wall.passes.slice(0, 4).map((p) => (
                    <li key={p.number} className="flex items-center gap-3 text-[14px]">
                      <PassFace hue={p.hue} size={24} />
                      <span className="text-fg">{p.nickname}</span>
                      <span className="font-mono text-[12px] text-fg-3">#{String(p.number).padStart(3, "0")}</span>
                      <span className="ml-auto text-[13px] text-fg-3">{ago(p.joined)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Reveal>
      </div>
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

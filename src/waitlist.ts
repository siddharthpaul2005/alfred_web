/**
 * Talks to the waitlist backend (a Google Apps Script web app, see waitlist/apps-script.gs).
 * The site only ever receives anonymous passes back: never names or emails.
 *
 * Without VITE_WAITLIST_URL set, it runs in preview mode: signups stay in this browser
 * so the page still works while you're designing it.
 */

export type Pass = { number: number; nickname: string; hue: number; joined: string };
export type Signup = { name: string; email: string; device: string; firstTask: string; website?: string };

// Tolerate a pasted value with quotes or without https://
const RAW = ((import.meta.env.VITE_WAITLIST_URL as string | undefined) ?? "").trim().replace(/^["']|["']$/g, "");
const URL = RAW ? (/^https?:\/\//.test(RAW) ? RAW : `https://${RAW}`) : undefined;

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.warn("[waitlist] expected JSON from", URL, "got:", res.status, text.slice(0, 200));
    throw new Error("The waitlist is unreachable right now. Please try again in a minute.");
  }
}
export const waitlistLive = Boolean(URL);

const LOCAL_KEY = "alfred-waitlist-preview";
const ADJ = ["Curious", "Sleepy", "Brave", "Cosmic", "Gentle", "Swift", "Cheeky", "Lucky", "Quiet", "Sunny", "Bold", "Witty"];
const ANI = ["Otter", "Fox", "Panda", "Koala", "Owl", "Penguin", "Lynx", "Quokka", "Hedgehog", "Axolotl", "Capybara", "Narwhal"];
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function readLocal(): Pass[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export async function joinWaitlist(s: Signup): Promise<{ pass: Pass; again?: boolean }> {
  if (!URL) {
    const list = readLocal();
    const pass: Pass = { number: list.length + 1, nickname: `${pick(ADJ)} ${pick(ANI)}`, hue: Math.floor(Math.random() * 360), joined: new Date().toISOString() };
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify([...list, pass]));
    } catch {
      /* storage unavailable */
    }
    return { pass };
  }
  // text/plain keeps this a "simple" request, so Apps Script doesn't need CORS preflight.
  const res = await fetch(URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(s) });
  const data = await readJson(res);
  if (!data.ok || !data.pass) throw new Error(data.error ?? "Could not join the waitlist. Please try again.");
  return { pass: data.pass, again: data.again };
}

export async function loadWall(): Promise<{ count: number; passes: Pass[] }> {
  if (!URL) {
    const passes = readLocal().reverse();
    return { count: passes.length, passes };
  }
  const data = await readJson(await fetch(URL));
  return { count: data.count ?? 0, passes: data.passes ?? [] };
}

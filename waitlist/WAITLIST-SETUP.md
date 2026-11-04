# Make the waitlist live (about 5 minutes, free)

The waitlist uses a Google Sheet as its backend. Each signup is saved to the sheet and
emailed to you. The website only gets back anonymous passes (a number, a nickname like
"Cosmic Otter" and a colour), so names and emails are never shown publicly.

Until you finish these steps, the form runs in **preview mode**: signups stay in your own
browser and the wall says "preview".

## 1. Create the sheet and paste the script

1. Go to https://sheets.new and name the sheet `ALFRED waitlist`.
2. Open **Extensions → Apps Script**.
3. Delete everything in `Code.gs`, then paste in the whole of `waitlist/apps-script.gs`.
4. Check `OWNER_EMAIL` at the top. Signups are emailed there.
5. Click **Save**.

## 2. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy**. Google asks you to authorise it. Choose your account, then
   **Advanced → Go to ALFRED waitlist (unsafe) → Allow**. It says "unsafe" only because
   it's your own unpublished script. It needs the Sheets permission to save signups and
   the Gmail permission to email you.
5. Copy the **Web app URL**. It ends in `/exec`.

## 3. Connect the website

1. In the site folder, copy `.env.example` to a new file named `.env`.
2. Paste the URL after `VITE_WAITLIST_URL=`.
3. Restart `npm run dev`.

The wall now says "N passes so far" without "preview". Sign up once yourself to check
the email arrives.

## When you host the site

Add the same `VITE_WAITLIST_URL` value as an environment variable on your host (for
example in Vercel or Netlify project settings), then redeploy.

## Good to know

- **Changing the script:** after you edit it, use **Deploy → Manage deployments → Edit →
  Version: New version**. This keeps the same URL.
- **Duplicates:** the same email signing up twice gets their original pass back, and
  you only get one email.
- **Spam:** a hidden field catches simple bots.
- **Limits:** a free Gmail account can send about 100 emails a day from Apps Script.
  That's plenty for a waitlist.
- **Seeing everyone:** the sheet has every signup's full details, and only you can open it.

---

## Turning on ALFRED's chat (Groq)

The floating ALFRED on the home page answers through Groq. The Groq key must never be in the
website code (anyone can read that), so it only lives on servers:

**While developing (`npm run dev`)**
`GROQ_API_KEY=...` is in your `.env`. The dev server answers `/api/alfred` itself.
Restart `npm run dev` after changing `.env`.

**On the live site (Vercel)**
`api/alfred.ts` is a Vercel serverless function at the same `/api/alfred` address.
1. Vercel > your project > Settings > Environment Variables. Add:
   - `GROQ_API_KEY` = your Groq key (Production, Preview and Development)
   - `VITE_WAITLIST_URL` = your Apps Script URL. Your `.env` is not uploaded to Vercel,
     so without this the live waitlist stays in "preview" mode and you get no emails.
   - Optional: `GROQ_MODEL` to use a different model (default `llama-3.3-70b-versatile`).
2. Deployments > the latest one > ... > Redeploy. Environment variables only apply to new deployments.
3. Check: open `https://<your-site>/api/alfred` in a browser. It should say `"ok": true`.

If Groq can't be reached, ALFRED falls back to a few built-in replies, and the chat header
says "Offline replies". The browser console (F12) shows the reason on a line starting with `[ALFRED chat]`.

(`apps-script.gs` also contains a chat route. You don't need it on Vercel; it's only there as a
fallback if you ever host the site somewhere without serverless functions.)

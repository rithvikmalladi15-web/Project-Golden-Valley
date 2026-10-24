# Golden Valley

Free rides to the fields, heat-safety and irrigation tools, equipment fixes and job training for California's Central Valley farm communities. Built for Sierra Hacks 2026.

The whole site is one file, `index.html`. No build step, no dependencies, no API key needed.

## What it does

| Section | What you can do |
|---|---|
| **Rides** | Pick a route, book or cancel a free seat on early and return runs, watch a shuttle demo. Bookings are saved on the device. |
| **Heat safety** | Set the temperature and humidity (or load current Fresno weather) to see what California outdoor heat rules require. Copy a message for your crew and tick a pre-shift checklist. |
| **Irrigation** | Choose crop, acres, system and ET to estimate gallons per day and acre-feet per week. |
| **Equipment fixes** | Search an error code or a symptom like "low pressure" for repair steps. |
| **Academy** | Three quiz modules. You must get every question right to pass. Progress is saved. |
| **Dash** | A chat helper. Try "it's 98 degrees" or "40 acres of almonds" and it fills in the tools for you. |
| **Extras** | Light and dark mode, five languages, a guided tour, keyboard support. |

## Deploy to Vercel (about 2 minutes)

**Option A: GitHub (recommended)**
1. Create a new GitHub repo and upload `index.html` and `README.md` to the root.
2. On Vercel, click **Add New > Project** and import the repo.
3. Leave every setting at its default. Framework preset: **Other**. Build command and output directory: empty.
4. Click **Deploy**. Your site is live at `your-project.vercel.app`.

**Option B: CLI (no GitHub needed)**
```bash
npm i -g vercel
cd your-folder
vercel --prod
```

Every later push to the repo redeploys automatically.

## Dash and the AI backend (optional)

Dash works with no setup. It uses a built-in helper that understands heat, water, equipment, rides and training questions.

To make Dash answer open-ended questions with AI, add one more file. Your Groq key stays on the server and is never in the page.

1. Create `api/dash.js` in the repo (a folder named `api` at the root):

```js
const SYSTEM = `You are Dash Rivera, a friendly field advisor for farmworkers and growers in California's Central Valley.
Talk like a warm, practical person: short sentences, plain words, no markdown, 1 to 4 sentences unless asked for more.
Cover heat safety (Cal/OSHA: shade and cool water above 80F, high-heat steps at 95F, agriculture 10-minute cool-down at least every 2 hours),
irrigation, equipment troubleshooting, shuttle rides (Fresno to Mendota, Firebaugh, Madera, Visalia) and job training.
Never give medical diagnoses; for heat stroke symptoms tell them to call 911. If someone sincerely asks, say you are an AI assistant.
Reply in the language the person writes in. If unsure, say so and suggest a technician or official source.`;

const MODELS = ["qwen/qwen3-32b", "llama-3.1-8b-instant"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "Not configured" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const msgs = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-10)
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 600) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return res.status(400).json({ error: "Bad request" });

  for (const model of MODELS) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.GROQ_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ model, temperature: 0.6, max_tokens: 400, messages: [{ role: "system", content: SYSTEM }, ...msgs] }),
      });
      const d = await r.json();
      const text = d?.choices?.[0]?.message?.content;
      if (text) return res.status(200).json({ reply: text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() });
    } catch (e) { /* try next model */ }
  }
  res.status(502).json({ error: "Upstream error" });
}
```

2. In Vercel: **Project > Settings > Environment Variables**, add `GROQ_API_KEY` with your key, for Production, Preview and Development.
3. Redeploy. `index.html` already calls `/api/dash`. If that route is missing or fails, Dash quietly falls back to the built-in helper.

Never paste your key into `index.html` or commit it to GitHub.

## Test checklist before you present

- Rides: change the route, book a seat, cancel it, reload and confirm the booking stayed.
- Heat: slide the temperature to 79, 85 and 97 and confirm three different results. Tick the checklist and tap **Copy message for my crew**.
- Irrigation: change each input and confirm the gallons update.
- Equipment: search `E-402`, `low pressure`, `GPS`.
- Academy: fail a quiz, then pass one, and confirm the progress bar moves.
- Dash: ask "it's 98 degrees" and "40 acres of almonds".
- Switch language and theme, then test on a phone.

## Things to confirm and cite

- **Heat rules:** the thresholds (80°F shade and water, 95°F high-heat steps, 10-minute cool-down in agriculture) follow California's outdoor heat standard as I understand it. Check the current text at [dir.ca.gov/dosh](https://www.dir.ca.gov/dosh/) and cite it on your project page.
- **Irrigation:** gallons = acres × ET × crop coefficient ÷ system efficiency × 27,154 gallons per acre-inch. Coefficients are typical mid-season values. Use local ET from [CIMIS](https://cimis.water.ca.gov/) for real decisions.
- **Rides:** routes, times and seat counts are demo data, not a live schedule.
- **Translations:** Spanish and Chinese cover the main headings. Hmong and Punjabi cover only the nav, headline and main button. Have native speakers review all four.
- **Weather:** the "current Fresno weather" button uses the free Open-Meteo service.

## Limits

This is a hackathon prototype. It gives general guidance only and does not replace official rules, medical advice or a qualified technician.

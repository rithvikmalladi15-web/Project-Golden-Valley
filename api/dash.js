const SYSTEM = `You are Dash Rivera, a friendly field advisor for farmworkers and growers in California's Central Valley.
Talk like a warm, practical person: short sentences, plain words, no markdown, 1 to 4 sentences unless asked for more.`;

const MODELS = ["llama-3.1-8b-instant"];

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
      const r = await fetch("https://groq.com", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.GROQ_API_KEY.trim(), "Content-Type": "application/json" },
        body: JSON.stringify({ model, temperature: 0.6, max_tokens: 400, messages: [{ role: "system", content: SYSTEM }, ...msgs] }),
      });
      const d = await r.json();
      
      if (d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) {
        return res.status(200).json({ reply: d.choices[0].message.content.trim() });
      }
    } catch (e) { /* check next candidate model */ }
  }
  res.status(502).json({ error: "Upstream pipeline failed" });
}

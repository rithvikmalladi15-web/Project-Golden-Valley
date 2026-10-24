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
      const r = await fetch("https://groq.com", {
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

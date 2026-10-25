const SYSTEM = `You are Dash Rivera, a friendly field advisor for farmworkers and growers in California's Central Valley.
Talk like a warm, practical person: short sentences, plain words, no markdown, 1 to 4 sentences unless asked for more.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY variable is missing in Vercel." });
  
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const msgs = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-10)
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
    
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return res.status(400).json({ error: "Bad request" });

  try {
    const formattedContents = msgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // ==========================================
    // EXPLICIT INSTRUCTION: USE GEMINI 3.5 FLASH
    // ==========================================
    const url = "https://googleapis.com";

    const r = await fetch(`${url}?key=${process.env.GEMINI_API_KEY.trim()}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 400
        }
      }),
    });
    
    const d = await r.json();
    
    const candidate = d?.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const text = part?.text;
    
    if (text) {
      return res.status(200).json({ reply: text.trim() });
    }
  } catch (e) { /* catch logic */ }

  res.status(502).json({ error: "Upstream connection error encountered using Gemini 3.5 Flash." });
}

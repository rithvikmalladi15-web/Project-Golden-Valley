export default async function handler(req, res) {
  if (req.method === "GET" && !req.query.query) {
    return res.status(200).json({ status: "healthy", message: "API is ready" });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const query = body.query || req.query.query || "";

  if (!query) {
    return res.status(200).json({ reply: "" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "Not configured" });
  }

  const SYSTEM = `You are an expert lookup assistant for California's Central Valley farm communities. 
  Answer the user's localized query accurately using clear, direct language. 
  Focus on heat rules, health resources, rural bus guidelines, or equipment details.
  Keep it to 2-3 sentences. Do not use markdown.`;

  try {
    const r = await fetch("https://groq.com", {
      method: "POST",
      headers: { 
        "Authorization": "Bearer " + process.env.GROQ_API_KEY, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        model: "llama-3.1-8b-instant", 
        temperature: 0.3, 
        max_tokens: 300, 
        messages: [
          { role: "system", content: SYSTEM }, 
          { role: "user", content: query }
        ] 
      }),
    });
    
    const d = await r.json();
    const text = d?.choices?.[0]?.message?.content || "No results found.";
    
    return res.status(200).json({ reply: text.trim() });
  } catch (e) {
    return res.status(502).json({ error: "Upstream API error" });
  }
}

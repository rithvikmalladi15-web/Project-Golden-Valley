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

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ reply: "Gemini Key is missing in Vercel settings." });
  }

  const SYSTEM = `You are an expert lookup assistant for California's Central Valley farm communities. 
  Answer the user's localized query accurately using clear, direct language. 
  Focus on heat rules, health resources, rural bus guidelines, or equipment details.
  Keep it to 2-3 sentences. Do not use markdown.`;

  try {
    const url = "https://googleapis.com";
    
    const r = await fetch(`${url}?key=${process.env.GEMINI_API_KEY.trim()}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        contents: [
          { role: "user", parts: [{ text: SYSTEM + "\n\nUser Question: " + query }] }
        ],
        generationConfig: {
          temperature: 0.3, 
          maxOutputTokens: 300
        }
      }),
    });
    
    const d = await r.json();
    
    // Explicit array bracket index matching
    if (d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts && d.candidates[0].content.parts[0]) {
      const text = d.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: text.trim() });
    }
    
    return res.status(200).json({ reply: "No valid responses returned from Gemini array." });
  } catch (e) {
    return res.status(502).json({ reply: "Server error caught during Gemini query fetch." });
  }
}

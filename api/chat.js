// api/chat.js
// Vercel serverless function — proxies chat requests to Google Gemini.
// Requires env var GEMINI_API_KEY set in Vercel project settings.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing GEMINI_API_KEY" });
  }

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Convert our simple {role: 'user'|'assistant', text}[] history into
    // Gemini's contents format.
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    }));

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const message = data?.error?.message || "Gemini API request failed";
      return res.status(geminiRes.status).json({ error: message });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat api error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

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

    // gemini-2.0-flash was shut down by Google on June 1, 2026 — every
    // request to it now 404s. gemini-2.5-flash is the current equivalent.
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Abort if Gemini hangs instead of leaving the client waiting forever.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let geminiRes;
    try {
      geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            // 2.5 models think by default; an unbounded thinking budget is
            // what causes slow and occasionally empty responses. Cap it.
            thinkingConfig: { thinkingBudget: 512 }
          }
        }),
        signal: controller.signal
      });
    } catch (err) {
      if (err.name === "AbortError") {
        return res.status(504).json({ error: "Gemini request timed out. Please try again." });
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const message = data?.error?.message || "Gemini API request failed";
      return res.status(geminiRes.status).json({ error: message });
    }

    const finishReason = data?.candidates?.[0]?.finishReason;
    const answerParts = (data?.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought);
    const reply = answerParts.map((p) => p.text || "").join("");

    if (!reply) {
      const message =
        finishReason === "MAX_TOKENS"
          ? "Gemini ran out of output budget before answering."
          : "Sorry, I couldn't generate a response.";
      return res.status(200).json({ reply: message });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat api error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

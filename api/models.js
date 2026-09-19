// api/models.js
// Vercel serverless function — asks Groq which models are currently live
// (GET https://api.groq.com/openai/v1/models) and returns only the ones that
// make sense in a chat dropdown. The frontend uses this to keep the model
// list fresh, so a Groq deprecation never leaves the app with dead options.

// IDs Groq has shut down for free/developer tiers — never offer these even if
// the API still lists them (enterprise contracts keep them alive longer).
const DEPRECATED = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "qwen/qwen3-32b",
  "moonshotai/kimi-k2-instruct-0905",
  "moonshotai/kimi-k2-instruct"
]);

// Not chat models (speech, TTS, safety classifiers) or enterprise-only.
const NOT_FOR_CHAT = /whisper|orpheus|tts|guard|safeguard|embed|minimax/i;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server missing GROQ_API_KEY" });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    });
    if (!groqRes.ok) {
      return res.status(groqRes.status).json({ error: "Groq models request failed" });
    }
    const data = await groqRes.json();
    const models = (data?.data || [])
      .filter((m) => m && m.id && m.active !== false)
      .filter((m) => !DEPRECATED.has(m.id) && !NOT_FOR_CHAT.test(m.id))
      .map((m) => ({
        id: m.id,
        owned_by: m.owned_by || "",
        context_window: m.context_window || null
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    // Models change rarely — let Vercel's edge cache it for an hour.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({ models });
  } catch (err) {
    console.error("models api error:", err);
    return res.status(502).json({ error: "Could not reach Groq API" });
  } finally {
    clearTimeout(timeoutId);
  }
}

// api/chat.js
// Vercel serverless function — proxies chat requests to Groq (OpenAI-compatible
// chat completions API). Requires env var GROQ_API_KEY set in Vercel project
// settings. The key never reaches the browser — only this server-side
// function talks to Groq.

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// Only these Groq models currently accept image inputs. If a caller asks
// for image content on a non-vision model we strip the image rather than
// letting the whole request fail.
const VISION_MODELS = new Set([
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct"
]);

function toGroqMessages(messages, model) {
  const allowImages = VISION_MODELS.has(model);
  return messages.map((m) => {
    const role = m.role === "assistant" ? "assistant" : "user";

    // Already-OpenAI-shaped content (array of parts) — pass through,
    // optionally stripping image parts for non-vision models.
    if (Array.isArray(m.content)) {
      const content = allowImages ? m.content : m.content.filter((p) => p.type !== "image_url");
      return { role, content };
    }

    // Our app's simpler {role, text, attachment} shape.
    if (m.attachment && m.attachment.mime && m.attachment.mime.startsWith("image/") && allowImages) {
      const content = [];
      if (m.text) content.push({ type: "text", text: m.text });
      content.push({ type: "image_url", image_url: { url: m.attachment.dataUrl } });
      return { role, content };
    }

    return { role, content: m.text ?? m.content ?? "" };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing GROQ_API_KEY" });
  }

  let payload;
  try {
    const { messages, model, maxTokens, stream } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const chosenModel = model || DEFAULT_MODEL;

    payload = {
      model: chosenModel,
      messages: toGroqMessages(messages, chosenModel),
      temperature: 0.7,
      max_tokens: Math.min(Math.max(Number(maxTokens) || 2048, 1), 8192),
      stream: !!stream
    };
  } catch (err) {
    console.error("chat api payload error:", err);
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Abort if Groq hangs instead of leaving the client waiting forever.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  let groqRes;
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Groq request timed out. Please try again." });
    }
    console.error("chat api network error:", err);
    return res.status(502).json({ error: "Could not reach Groq API" });
  }

  if (!groqRes.ok) {
    clearTimeout(timeoutId);
    const data = await groqRes.json().catch(() => null);
    const message = data?.error?.message || "Groq API request failed";
    return res.status(groqRes.status).json({ error: message });
  }

  // Streaming: pipe Groq's server-sent-events straight through to the client.
  if (payload.stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
      const reader = groqRes.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      console.error("chat api stream error:", err);
    } finally {
      clearTimeout(timeoutId);
      res.end();
    }
    return;
  }

  // Non-streaming fallback.
  clearTimeout(timeoutId);
  try {
    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    if (!reply) {
      const finishReason = data?.choices?.[0]?.finish_reason;
      const message =
        finishReason === "length"
          ? "Groq ran out of output budget before answering."
          : "Sorry, I couldn't generate a response.";
      return res.status(200).json({ reply: message });
    }
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat api error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

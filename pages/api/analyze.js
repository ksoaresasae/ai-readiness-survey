export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { summary } = req.body;
  if (!summary) return res.status(400).json({ error: "No summary provided" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: `You are an organizational development analyst. You receive AI readiness survey responses and produce a concise, honest, non-judgmental summary for the respondent. Format your response as:

**Your AI Readiness Snapshot**

[2-3 sentences synthesizing overall picture across familiarity, confidence, and sentiment]

**Strengths to build on:**
- [bullet]
- [bullet]

**Areas where growth is most likely:**
- [bullet]
- [bullet]

**One suggested first step:**
[Single concrete, low-pressure action]

Be warm but honest. Do not flatter or minimize gaps. Avoid corporate jargon. Keep total length under 250 words. Do not mention specific question IDs.`,
        messages: [{ role: "user", content: summary }],
      }),
    });

    const data = await response.json();
    const analysis = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
    return res.status(200).json({ analysis });
  } catch (e) {
    console.error("Anthropic API error:", e);
    return res.status(500).json({ error: "Analysis failed" });
  }
}

/*
  POST /api/brief — generate a call-preparation brief for a client.

  Path 1 (AI): if ANTHROPIC_API_KEY is set, call the Anthropic Messages API
  server-side and return an LLM-written brief. The key is read from the server
  environment only and never reaches the client bundle.

  Path 2 (rule-based fallback): if no key is configured OR the API call fails,
  fall back to the deterministic generateBrief(). The response always tells the
  client which path produced the brief via `source`.

  Security: the payload is validated against the expected synthetic-client shape
  before anything is sent to the model, and only the brief's own fields are
  forwarded (pickBriefFields) — extraneous keys are dropped.
*/

import Anthropic from "@anthropic-ai/sdk";
import { generateBrief, validateBriefPayload, pickBriefFields } from "@/lib/brief";

// Route handlers are not cached for POST; this is request-time only.
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a preparation assistant for a financial advisor about to call a client.
Write a concise call-prep brief of 3 to 5 sentences in a calm, professional advisor-prep tone.

Strict rules:
- Use ONLY the structured fields provided in the user message (risk numbers, last activity, open tasks, life events, goal, probability of success). Do not invent names, numbers, dates, holdings, or events that are not present.
- Do NOT give financial advice or recommendations to the client; this is internal prep for the advisor, framing what to be aware of and what to follow up on.
- Refer to the client by their preferred name. Keep it factual and grounded in the data.
- Output only the brief text — no preamble, no headings, no bullet points.`;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { valid, errors } = validateBriefPayload(body);
  if (!valid) {
    return Response.json({ error: "invalid client payload", details: errors }, { status: 400 });
  }

  // Only the brief's own (synthetic) fields are forwarded to the model.
  const client = pickBriefFields(body as Record<string, unknown>);

  // No key configured → deterministic fallback, no external call.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ brief: generateBrief(client), source: "rule-based" });
  }

  try {
    const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from the server env
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Structured client data (synthetic):\n\n${JSON.stringify(client, null, 2)}\n\nWrite the call-prep brief.`,
        },
      ],
    });

    const brief = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Defensive: if the model returned no text (e.g. refusal), fall back.
    if (!brief) {
      return Response.json({ brief: generateBrief(client), source: "rule-based" });
    }
    return Response.json({ brief, source: "ai" });
  } catch (err) {
    // Any API failure → deterministic fallback so the UI always has a brief.
    console.error("Brief API call failed; using rule-based fallback:", err);
    return Response.json({ brief: generateBrief(client), source: "rule-based" });
  }
}

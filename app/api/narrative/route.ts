import { buildPrompt, validateRequest } from "@/lib/narrative";
import { rateLimitOk, type RateEntry } from "@/lib/ratelimit";

// Public, unauthenticated, paid endpoint — three server-side guards:
// 1. strict schema validation (only pseudonymized findings pass, R8/R12/R21)
// 2. per-IP rate limit (in-memory, best-effort — see lib/ratelimit.ts; cost is
//    ultimately bounded by the provider spend cap + max_tokens)
// 3. provider chain: Claude Haiku primary → DeepSeek fallback (R22 — see
//    README for the verified retention terms of each provider)

const RATE_LIMIT_PER_MINUTE = 10;
const RATE_WINDOW_MS = 60_000;
// Module-level so it persists across requests on a warm Fluid Compute instance.
const hits = new Map<string, RateEntry>();

async function callAnthropic(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("no anthropic key");
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`anthropic ${resp.status}`);
  const data = (await resp.json()) as { content: { type: string; text?: string }[] };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("anthropic empty");
  return text;
}

async function callDeepSeek(prompt: string): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("no deepseek key");
  const resp = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`deepseek ${resp.status}`);
  const data = (await resp.json()) as { choices: { message: { content: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("deepseek empty");
  return text;
}

export async function POST(request: Request) {
  // Vercel overwrites these headers with the real client IP; on any other
  // host the leftmost x-forwarded-for entry is client-supplied — re-verify
  // before moving platforms.
  const ip = (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    "unknown"
  )
    .split(",")[0]
    .trim();
  if (!rateLimitOk(hits, ip, Date.now(), RATE_LIMIT_PER_MINUTE, RATE_WINDOW_MS)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const req = validateRequest(body);
  if (!req) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const prompt = buildPrompt(req);
  try {
    const narrative = await callAnthropic(prompt).catch(() => callDeepSeek(prompt));
    return Response.json({ narrative });
  } catch {
    return Response.json({ error: "generation_failed" }, { status: 502 });
  }
}

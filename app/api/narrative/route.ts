import { buildPrompt, validateRequest } from "@/lib/narrative";

// Public, unauthenticated, paid endpoint — three server-side guards:
// 1. strict schema validation (only pseudonymized findings pass, R8/R12/R21)
// 2. per-IP rate limit via Upstash REST (fail CLOSED on limiter errors)
// 3. provider chain: Claude Haiku primary → DeepSeek fallback (R22 — see
//    README for the verified retention terms of each provider)

const RATE_LIMIT_PER_MINUTE = 10;

async function rateLimitOk(ip: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // Unconfigured: allow in local dev only. In production a missing/typo'd
    // env var must NOT silently ship an unlimited paid endpoint — fail closed.
    if (process.env.NODE_ENV === "production") {
      console.error("[narrative] Upstash not configured in production — failing closed");
      return false;
    }
    console.warn("[narrative] Upstash not configured — rate limiting disabled (dev only)");
    return true;
  }
  try {
    // ponytail: fixed 60s window via INCR+EXPIRE — no client library needed.
    const key = `drdrill:rl:${ip}`;
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, "60", "NX"],
      ]),
    });
    if (!resp.ok) return false; // fail closed
    const data = (await resp.json()) as { result: number }[];
    return data[0].result <= RATE_LIMIT_PER_MINUTE;
  } catch {
    return false; // fail closed
  }
}

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
  if (!(await rateLimitOk(ip))) {
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

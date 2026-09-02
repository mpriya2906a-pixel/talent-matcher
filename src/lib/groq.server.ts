const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Exposed as a constant so the model choice is easy to tune / justify. */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

export class GroqError extends Error {}

/**
 * Calls Groq's chat completions API in strict-JSON mode and parses the result.
 * Throws GroqError when the request fails or the payload is not valid JSON,
 * so callers can fall back to a "needs manual review" state.
 */
export async function groqJson<T>(opts: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new GroqError("GROQ_API_KEY is not configured");

  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: opts.temperature ?? 0.1,
        max_tokens: opts.maxTokens ?? 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
    });
  } catch (error) {
    console.error("[groq] network failure", error);
    throw new GroqError("Could not reach the AI service");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[groq] http error", response.status, detail.slice(0, 500));
    if (response.status === 429) throw new GroqError("AI service rate limit reached");
    throw new GroqError("AI service returned an error");
  }

  const payload = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }> }
    | null;
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new GroqError("AI service returned an empty response");

  try {
    return JSON.parse(content) as T;
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1)) as T;
      } catch {
        /* ignore */
      }
    }
    console.error("[groq] unparseable JSON", content.slice(0, 500));
    throw new GroqError("AI response could not be parsed");
  }
}

export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 60);
}

export function toNumberOrNull(value: unknown): number | null {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

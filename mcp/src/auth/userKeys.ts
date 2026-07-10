import { getEnv } from "../env.js";

const env = getEnv();

interface ValidateResponse {
  userId: string;
}

const cache = new Map<string, { userId: string | null; exp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Resolves a per-user MCP API key to its owner via the backend index.
// Returns the userId, or null when the key is unknown/invalid. Results are
// cached briefly to avoid a backend round-trip on every request.
export async function resolveUserKey(apiKey: string): Promise<string | null> {
  const cached = cache.get(apiKey);
  if (cached && cached.exp > Date.now()) {
    return cached.userId;
  }

  try {
    let base = env.BACKEND_URL;
    while (base.endsWith("/")) base = base.slice(0, -1);
    const res = await fetch(`${base}/api/mcp/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    if (!res.ok) {
      cache.set(apiKey, { userId: null, exp: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const data = (await res.json()) as ValidateResponse;
    const userId = data.userId ?? null;
    cache.set(apiKey, { userId, exp: Date.now() + CACHE_TTL_MS });
    return userId;
  } catch {
    return null;
  }
}

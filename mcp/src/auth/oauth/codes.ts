import crypto from "node:crypto";
import { getEnv } from "../../env.js";
import type { McpRole } from "../issuer.js";

// In-memory authorization-code store for the OAuth 2.0 authorization-code + PKCE
// flow. Codes are single-use and short-lived (~60s); consumed by the token
// endpoint in Phase3.
export interface AuthCodeRecord {
  code: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  userId: string;
  role: McpRole;
  expiresAt: number;
}

const CODE_TTL_MS = 60_000;

const store = new Map<string, AuthCodeRecord>();

// Periodically evict expired codes.
setInterval(() => {
  const now = Date.now();
  for (const [code, rec] of store) {
    if (now > rec.expiresAt) store.delete(code);
  }
}, 30_000);

export function generateAuthCode(args: {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  userId: string;
  role: McpRole;
}): string {
  const code = `mcp_code_${crypto.randomBytes(16).toString("hex")}`;
  const record: AuthCodeRecord = {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
    ...args,
  };
  store.set(code, record);
  return code;
}

// Returns the record and deletes it (single-use). Returns null if missing,
// already consumed, or expired.
export function consumeAuthCode(code: string): AuthCodeRecord | null {
  const rec = store.get(code);
  if (!rec) return null;
  store.delete(code);
  if (Date.now() > rec.expiresAt) return null;
  return rec;
}

export interface OAuthClientRecord {
  client_id: string;
  redirect_uris: string[];
  scope: string;
  client_name: string | null;
}

// Fetch a registered OAuth client from the backend via the unauthenticated
// GET /api/mcp/oauth/client route. Returns null if not found or on error.
export async function getClient(
  clientId: string,
): Promise<OAuthClientRecord | null> {
  try {
    let base = getEnv().BACKEND_URL;
    while (base.endsWith("/")) base = base.slice(0, -1);
    const res = await fetch(
      `${base}/api/mcp/oauth/client?client_id=${encodeURIComponent(clientId)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as OAuthClientRecord;
  } catch {
    return null;
  }
}

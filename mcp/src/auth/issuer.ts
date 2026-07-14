import crypto from "node:crypto";
import { getEnv } from "../env.js";

const env = getEnv();

export const MCP_ISSUER = "dolce-atelier-mcp";
export const MCP_AUDIENCE = "dolce-atelier-mcp";

export type McpRole = "admin" | "superadmin" | "user";

export interface McpTokenClaims {
  sub: string;
  role: McpRole;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Default lifetime of refresh tokens (30 days). Overridable per-call.
export const MCP_REFRESH_TTL_SECONDS = 30 * 24 * 3600;

// Resolve the effective MCP role from a Clerk user's public metadata.
// Only `admin` / `superadmin` are privileged; anything else (including a
// missing/empty role or a Clerk error) maps to the default `"user"`.
export function resolveClerkRole(user: {
  publicMetadata?: { role?: string } | null;
}): McpRole {
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  if (role === "admin" || role === "superadmin") return role;
  return "user";
}

export interface McpRefreshClaims {
  clientId: string;
  sub: string;
  role: McpRole;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  purpose: "refresh";
}

function b64url(input: Buffer | string): string {
  let s = Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_");
  while (s.endsWith("=")) s = s.slice(0, -1);
  return s;
}

function fromB64url(input: string): Buffer {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(padded, "base64");
}

const SECRET = env.MCP_JWT_SECRET;

export function signMcpToken(opts: {
  userId: string;
  role: McpRole;
  ttlSeconds?: number;
}): string {
  const ttl = opts.ttlSeconds ?? env.MCP_TOKEN_TTL;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload: McpTokenClaims = {
    sub: opts.userId,
    role: opts.role,
    iat: now,
    exp: now + ttl,
    iss: MCP_ISSUER,
    aud: MCP_AUDIENCE,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(payload),
  )}`;
  const sig = crypto.createHmac("sha256", SECRET).update(signingInput).digest();
  return `${signingInput}.${b64url(sig)}`;
}

export function signMcpRefreshToken(opts: {
  clientId: string;
  userId: string;
  role: McpRole;
  ttlSeconds?: number;
}): string {
  const ttl = opts.ttlSeconds ?? MCP_REFRESH_TTL_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload: McpRefreshClaims = {
    clientId: opts.clientId,
    sub: opts.userId,
    role: opts.role,
    iat: now,
    exp: now + ttl,
    iss: MCP_ISSUER,
    aud: MCP_AUDIENCE,
    purpose: "refresh",
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(payload),
  )}`;
  const sig = crypto.createHmac("sha256", SECRET).update(signingInput).digest();
  return `${signingInput}.${b64url(sig)}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function verifyMcpToken(token: string): McpTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  let expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${h}.${p}`)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_");
  while (expected.endsWith("=")) expected = expected.slice(0, -1);
  if (!timingSafeEqual(s, expected)) return null;

  let payload: McpTokenClaims;
  try {
    payload = JSON.parse(fromB64url(p).toString("utf8")) as McpTokenClaims;
  } catch {
    return null;
  }

  if (payload.iss !== MCP_ISSUER || payload.aud !== MCP_AUDIENCE) return null;
  if (typeof payload.exp !== "number") return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;
  if (!payload.sub) return null;

  return payload;
}

export function verifyMcpRefreshToken(token: string): McpRefreshClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  let expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${h}.${p}`)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_");
  while (expected.endsWith("=")) expected = expected.slice(0, -1);
  if (!timingSafeEqual(s, expected)) return null;

  let payload: McpRefreshClaims;
  try {
    payload = JSON.parse(fromB64url(p).toString("utf8")) as McpRefreshClaims;
  } catch {
    return null;
  }

  if (payload.iss !== MCP_ISSUER || payload.aud !== MCP_AUDIENCE) return null;
  if (payload.purpose !== "refresh") return null;
  if (typeof payload.exp !== "number") return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;
  if (!payload.sub || !payload.clientId) return null;

  return payload;
}

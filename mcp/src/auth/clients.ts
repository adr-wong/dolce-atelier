import crypto from "node:crypto";
import type { McpRole } from "./issuer.js";

export interface Client {
  client_id: string;
  client_secret: string;
  userId: string;
  role: McpRole;
}

// Seed machine clients from the MCP_CLIENTS env var (JSON array).
// These represent non-human agents using the OAuth client_credentials grant.
// Read directly from process.env so it works regardless of when getEnv() is
// first called (the env module caches its parsed result).
const seeded: Client[] = (() => {
  const raw = process.env.MCP_CLIENTS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Client[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c) => c.client_id && c.client_secret && c.userId);
  } catch {
    return [];
  }
})();

const registry = new Map<string, Client>(seeded.map((c) => [c.client_id, c]));

export function authenticateClient(
  clientId: string,
  clientSecret: string,
): Client | null {
  const client = registry.get(clientId);
  if (!client) return null;
  const a = Buffer.from(client.client_secret);
  const b = Buffer.from(clientSecret);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return client;
}

// Register an in-memory client (lost on restart). Useful for programmatic
// provisioning; for persistence, back this with the DB / Clerk metadata.
export function registerClient(userId: string, role: McpRole = "user"): Client {
  const client: Client = {
    client_id: `mcp_${crypto.randomBytes(12).toString("hex")}`,
    client_secret: crypto.randomBytes(32).toString("hex"),
    userId,
    role,
  };
  registry.set(client.client_id, client);
  return client;
}

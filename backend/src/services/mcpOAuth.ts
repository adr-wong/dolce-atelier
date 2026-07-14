import { mongoose } from "../lib/db";

export interface McpOAuthClient {
  client_id: string;
  redirect_uris: string[];
  scope: string;
  client_name: string | null;
  createdAt: string;
}

function clientCollection() {
  return mongoose.connection.collection<McpOAuthClient>("mcpOAuthClients");
}

let indexReady = false;
async function ensureIndex() {
  if (indexReady) return;
  await clientCollection().createIndex(
    { client_id: 1 },
    { unique: true, name: "mcpOAuthClientId" },
  );
  indexReady = true;
}

// Upsert an OAuth client (public, PKCE) keyed by client_id.
export async function upsertOAuthClient(
  client: McpOAuthClient,
): Promise<McpOAuthClient> {
  await ensureIndex();
  const now = new Date().toISOString();
  const existing = await clientCollection().findOne({ client_id: client.client_id });
  const record: McpOAuthClient = {
    client_id: client.client_id,
    redirect_uris: client.redirect_uris,
    scope: client.scope,
    client_name: client.client_name ?? null,
    createdAt: existing?.createdAt ?? now,
  };
  await clientCollection().updateOne(
    { client_id: client.client_id },
    { $set: record },
    { upsert: true },
  );
  return record;
}

export async function findOAuthClient(
  clientId: string,
): Promise<McpOAuthClient | null> {
  return clientCollection().findOne({ client_id: clientId });
}

// Lookup a stored OAuth client by client_id (used by the MCP authorization
// endpoint during the authorization-code + PKCE flow). Returns null if absent.
export async function getOAuthClient(
  clientId: string,
): Promise<McpOAuthClient | null> {
  return findOAuthClient(clientId);
}

export interface McpOAuthRefresh {
  token: string;
  clientId: string;
  userId: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

let refreshIndexReady = false;
async function ensureRefreshIndex() {
  if (refreshIndexReady) return;
  await mongoose.connection
    .collection<McpOAuthRefresh>("mcpOAuthRefresh")
    .createIndex({ token: 1 }, { unique: true, name: "mcpOAuthRefreshToken" });
  refreshIndexReady = true;
}

// Upsert a refresh token record keyed by the token itself (unique index).
export async function createOAuthRefresh(rec: {
  token: string;
  clientId: string;
  userId: string;
  role: string;
  expiresAt: string;
}): Promise<McpOAuthRefresh> {
  await ensureRefreshIndex();
  const now = new Date().toISOString();
  const record: McpOAuthRefresh = {
    token: rec.token,
    clientId: rec.clientId,
    userId: rec.userId,
    role: rec.role,
    expiresAt: rec.expiresAt,
    createdAt: now,
  };
  await mongoose.connection
    .collection<McpOAuthRefresh>("mcpOAuthRefresh")
    .updateOne({ token: rec.token }, { $set: record }, { upsert: true });
  return record;
}

// Look up a stored refresh token (used to detect revocation on refresh).
// Returns null when the token is unknown (e.g. already revoked/rotated).
export async function getOAuthRefresh(
  token: string,
): Promise<McpOAuthRefresh | null> {
  return mongoose.connection
    .collection<McpOAuthRefresh>("mcpOAuthRefresh")
    .findOne({ token });
}

// Remove a refresh token (e.g. on rotation of a refreshed token).
export async function revokeOAuthRefresh(token: string): Promise<void> {
  await mongoose.connection
    .collection<McpOAuthRefresh>("mcpOAuthRefresh")
    .deleteOne({ token });
}

import crypto from "node:crypto";
import { mongoose } from "../lib/db";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export interface SessionRecord {
  id: string;
  label: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  last4: string;
}

interface StoredSession {
  id: string;
  tokenHash: string;
  userId: string;
  label: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  last4: string;
}

function sessionCollection() {
  return mongoose.connection.collection<StoredSession>("mcpSessions");
}

function hashToken(t: string): string {
  return crypto.createHash("sha256").update(t).digest("hex");
}

export async function createUserMcpSession(
  userId: string,
  label?: string,
): Promise<{ token: string; record: SessionRecord }> {
  const token = `mcp_sess_${crypto.randomBytes(24).toString("hex")}`;
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const last4 = token.slice(-4);

  const doc: StoredSession = {
    id,
    tokenHash: hashToken(token),
    userId,
    label: label ?? "default",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revoked: false,
    last4,
  };

  await sessionCollection().insertOne(doc);

  return {
    token,
    record: {
      id,
      label: label ?? "default",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revoked: false,
      last4: token.slice(-4),
    },
  };
}

export async function listUserMcpSessions(
  userId: string,
): Promise<SessionRecord[]> {
  const docs = await sessionCollection()
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map(({ id, label, createdAt, expiresAt, revoked, last4 }) => ({
    id,
    label,
    createdAt,
    expiresAt,
    revoked,
    last4,
  }));
}

export async function revokeUserMcpSession(
  userId: string,
  id: string,
): Promise<boolean> {
  const res = await sessionCollection().updateOne(
    { id, userId },
    { $set: { revoked: true } },
  );
  return res.matchedCount > 0;
}

export async function findUserIdBySession(
  token: string,
): Promise<string | null> {
  const doc = await sessionCollection().findOne({
    tokenHash: hashToken(token),
    revoked: false,
  });
  if (!doc) return null;
  if (new Date(doc.expiresAt) < new Date()) return null;
  return doc.userId;
}

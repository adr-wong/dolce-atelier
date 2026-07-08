import crypto from "node:crypto";
import { clerkClient } from "../lib/clerk";
import { mongoose } from "../lib/db";

export interface McpKeyRecord {
  id: string;
  label: string;
  createdAt: string;
  last4: string;
}

interface StoredKey {
  id: string;
  key: string;
  label: string;
  createdAt: string;
}

function keyIndex() {
  return mongoose.connection.collection("mcpKeyIndex");
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function getUserMcpKeys(userId: string): Promise<McpKeyRecord[]> {
  const user = await clerkClient.users.getUser(userId);
  const keys =
    (user.privateMetadata as { mcpKeys?: StoredKey[] }).mcpKeys ?? [];
  return keys.map(({ id, label, createdAt, key }) => ({
    id,
    label,
    createdAt,
    last4: key.slice(-4),
  }));
}

export async function createUserMcpKey(
  userId: string,
  label: string,
): Promise<StoredKey> {
  const key = `mcp_${crypto.randomBytes(24).toString("hex")}`;
  const record: StoredKey = {
    id: crypto.randomUUID(),
    key,
    label: label || "default",
    createdAt: new Date().toISOString(),
  };

  const user = await clerkClient.users.getUser(userId);
  const existing =
    (user.privateMetadata as { mcpKeys?: StoredKey[] }).mcpKeys ?? [];

  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: { mcpKeys: [...existing, record] },
  });

  await keyIndex().insertOne({
    keyHash: hashKey(key),
    userId,
    createdAt: record.createdAt,
  });

  return record;
}

export async function deleteUserMcpKey(
  userId: string,
  keyId: string,
): Promise<boolean> {
  const user = await clerkClient.users.getUser(userId);
  const existing =
    (user.privateMetadata as { mcpKeys?: StoredKey[] }).mcpKeys ?? [];
  const target = existing.find((k) => k.id === keyId);
  if (!target) return false;

  const next = existing.filter((k) => k.id !== keyId);
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: { mcpKeys: next },
  });

  await keyIndex().deleteOne({ keyHash: hashKey(target.key) });
  return true;
}

export async function findUserIdByKey(apiKey: string): Promise<string | null> {
  const doc = await keyIndex().findOne({ keyHash: hashKey(apiKey) });
  return (doc?.userId as string) ?? null;
}

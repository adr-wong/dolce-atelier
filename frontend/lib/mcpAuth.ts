// Self-service MCP auth helpers for the frontend.
// Keeps the token-exchange logic pure and unit-testable (no React/Clerk deps).

export interface McpTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface McpSession {
  id: string;
  label: string;
  createdAt: string;
  expiresAt: string;
  last4: string;
  revoked: boolean;
}

export interface McpSessionCreateResponse {
  id: string;
  token: string;
  label: string;
  createdAt: string;
  expiresAt: string;
  last4: string;
}

export interface OpencodeSnippetInput {
  mcpUrl: string;
  apiKey: string;
  jwt: string;
}

export async function exchangeMcpToken(
  clerkToken: string,
  mcpUrl: string,
): Promise<McpTokenResponse> {
  let base = mcpUrl;
  while (base.endsWith("/")) base = base.slice(0, -1);
  const res = await fetch(`${base}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "clerk_exchange",
      clerk_token: clerkToken,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || !data.access_token) {
    const message =
      (data.error_description as string) ||
      (data.error as string) ||
      `Error ${res.status} al obtener el token MCP`;
    throw new Error(message);
  }

  return {
    access_token: data.access_token as string,
    token_type: (data.token_type as string) ?? "Bearer",
    expires_in: (data.expires_in as number) ?? 3600,
  };
}

export async function createMcpSession(
  clerkToken: string,
  mcpUrl: string,
  label?: string,
): Promise<McpSessionCreateResponse> {
  let base = mcpUrl;
  while (base.endsWith("/")) base = base.slice(0, -1);
  const res = await fetch(`${base}/api/mcp/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clerkToken}`,
    },
    body: JSON.stringify({ label }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || !data.token) {
    const message =
      (data.error_description as string) ||
      (data.error as string) ||
      `Error ${res.status} al crear la sesión MCP`;
    throw new Error(message);
  }

  return {
    id: data.id as string,
    token: data.token as string,
    label: (data.label as string) ?? "",
    createdAt: data.createdAt as string,
    expiresAt: data.expiresAt as string,
    last4: (data.last4 as string) ?? "",
  };
}

export async function listMcpSessions(
  clerkToken: string,
  mcpUrl: string,
): Promise<McpSession[]> {
  let base = mcpUrl;
  while (base.endsWith("/")) base = base.slice(0, -1);
  const res = await fetch(`${base}/api/mcp/sessions`, {
    method: "GET",
    headers: { Authorization: `Bearer ${clerkToken}` },
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      (data.error_description as string) ||
      (data.error as string) ||
      `Error ${res.status} al listar las sesiones MCP`;
    throw new Error(message);
  }

  return (data.sessions as McpSession[]) ?? [];
}

export async function revokeMcpSession(
  clerkToken: string,
  mcpUrl: string,
  id: string,
): Promise<void> {
  let base = mcpUrl;
  while (base.endsWith("/")) base = base.slice(0, -1);
  const res = await fetch(`${base}/api/mcp/sessions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${clerkToken}` },
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const message =
      (data.error_description as string) ||
      (data.error as string) ||
      `Error ${res.status} al revocar la sesión MCP`;
    throw new Error(message);
  }
}

export function buildOpencodeSnippet({
  mcpUrl,
  apiKey,
  jwt,
}: OpencodeSnippetInput): string {
  let base = mcpUrl;
  while (base.endsWith("/")) base = base.slice(0, -1);
  return JSON.stringify(
    {
      mcp: {
        "dolce-atelier": {
          type: "remote",
          url: `${base}/mcp`,
          headers: {
            "X-API-Key": apiKey,
            Authorization: `Bearer ${jwt}`,
          },
        },
      },
    },
    null,
    2,
  );
}

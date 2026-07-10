// Self-service MCP auth helpers for the frontend.
// Keeps the token-exchange logic pure and unit-testable (no React/Clerk deps).

export interface McpTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
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

import {
  verifyToken as clerkVerifyToken,
  createClerkClient,
} from "@clerk/backend";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { getEnv } from "../env.js";
import { type McpRole, verifyMcpToken } from "./issuer.js";

// ---------------------------------------------------------------------------
// Config (validated at startup via src/env.ts)
// ---------------------------------------------------------------------------
const env = getEnv();
const API_KEY = env.MCP_API_KEY;
const CLERK_SECRET_KEY = env.CLERK_SECRET_KEY;
const BACKEND_URL = env.BACKEND_URL;

const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AuthenticatedUser {
  userId: string;
  role: "admin" | "superadmin" | "user";
  token?: string;
}

// Type guard: extract AuthenticatedUser from MCP's opaque AuthInfo
export function asAuthenticatedUser(
  authInfo: AuthInfo | undefined,
): AuthenticatedUser {
  const user = authInfo as unknown as AuthenticatedUser | undefined;
  if (!user?.userId) {
    throw Object.assign(new Error("Authentication required"), {
      statusCode: 401,
    });
  }
  return user;
}

// ---------------------------------------------------------------------------
// API Key validation (required for ALL requests)
// ---------------------------------------------------------------------------
export function validateApiKey(apiKey: string | null): boolean {
  if (!API_KEY) {
    // No API key configured — allow all (dev mode)
    return true;
  }
  return apiKey === API_KEY;
}

// ---------------------------------------------------------------------------
// Clerk JWT verification (OPTIONAL — public tools don't need it)
// ---------------------------------------------------------------------------
export async function verifyClerkJwt(
  authHeader: string | null,
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const session = await clerkVerifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
    });
    return session.sub;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Full authenticate: API key required, JWT optional
// ---------------------------------------------------------------------------
export async function authenticate(
  headers: Headers,
): Promise<{ authInfo: AuthInfo } | { error: Response }> {
  // 1. Validate API key (MANDATORY)
  const apiKey = headers.get("X-API-Key");
  if (!validateApiKey(apiKey)) {
    return {
      error: new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  // 2. Resolve identity from a Bearer token (MCP-issued JWT preferred, Clerk fallback)
  const authHeader = headers.get("Authorization");
  let userId: string | null = null;
  let role: AuthenticatedUser["role"] = "user";
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice(7);

    // 2a. MCP-issued agent token (HS256, signed by MCP_JWT_SECRET)
    const claims = verifyMcpToken(raw);
    if (claims) {
      userId = claims.sub;
      role = claims.role;
      token = raw; // backend also trusts MCP-issued JWTs
    } else {
      // 2b. Clerk session JWT (fallback — keeps existing behaviour)
      const clerkId = await verifyClerkJwt(authHeader);
      if (clerkId) {
        userId = clerkId;
        token = raw;
        if (clerkClient) {
          try {
            const user = await clerkClient.users.getUser(userId);
            const metadata = user.publicMetadata as { role?: string };
            if (metadata.role === "admin" || metadata.role === "superadmin") {
              role = metadata.role as McpRole;
            }
          } catch {
            // Default to "user"
          }
        }
      }
    }
  }

  return {
    authInfo: {
      // Store custom fields alongside AuthInfo
      ...(userId ? { userId, role, token } : {}),
    } as unknown as AuthInfo,
  };
}

// ---------------------------------------------------------------------------
// requireRole helper — call at the start of admin tools
// ---------------------------------------------------------------------------
export function requireRole(
  authInfo: AuthInfo | undefined,
  allowedRoles: AuthenticatedUser["role"][],
): AuthenticatedUser {
  const user = asAuthenticatedUser(authInfo);

  if (!allowedRoles.includes(user.role ?? "user")) {
    throw Object.assign(
      new Error(`Forbidden: requires one of [${allowedRoles.join(", ")}]`),
      { statusCode: 403 },
    );
  }

  return user;
}

// ---------------------------------------------------------------------------
// requireAuth — ensure user is authenticated (for user-scoped tools)
// ---------------------------------------------------------------------------
export function requireAuth(authInfo: AuthInfo | undefined): AuthenticatedUser {
  return asAuthenticatedUser(authInfo);
}

// ---------------------------------------------------------------------------
// Backend HTTP helper
// ---------------------------------------------------------------------------
export async function callBackend<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
  } = {},
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = `${BACKEND_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout ?? 10000,
  );

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") ?? "";
    let data: T;
    if (contentType.includes("application/json")) {
      data = (await res.json()) as T;
    } else {
      const text = await res.text();
      data = {
        error: `Non-JSON response (${res.status}): ${text.slice(0, 200)}`,
      } as T;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        status: 504,
        data: { error: "Backend timeout" } as T,
      };
    }
    return { ok: false, status: 502, data: { error: String(err) } as T };
  } finally {
    clearTimeout(timeout);
  }
}

export { BACKEND_URL };

import {
  verifyToken as clerkVerifyToken,
  createClerkClient,
} from "@clerk/backend";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { getEnv } from "../env.js";
import { resolveClerkRole, verifyMcpToken } from "./issuer.js";
import { resolveSessionToken } from "./userKeys.js";

// ---------------------------------------------------------------------------
// Config (validated at startup via src/env.ts)
// ---------------------------------------------------------------------------
const env = getEnv();
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
// Full authenticate: a valid Bearer token is required. Resolves identity from
// the MCP-issued JWT (preferred), the backend opaque session token, or a Clerk
// session JWT fallback. On no/invalid token, returns 401 with a WWW-Authenticate
// header so RFC-compliant clients trigger the OAuth flow.
// ---------------------------------------------------------------------------
export async function authenticate(
  headers: Headers,
): Promise<{ authInfo: AuthInfo } | { error: Response }> {
  const { userId, role, token } = await resolveIdentity(
    headers.get("Authorization"),
  );

  if (!userId) {
    const resourceMetadata = `${getEnv().MCP_PUBLIC_URL}/.well-known/oauth-protected-resource`;
    return {
      error: new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata}"`,
        },
      }),
    };
  }

  return {
    authInfo: {
      // Store custom fields alongside AuthInfo
      ...(userId ? { userId, role, token } : {}),
    } as unknown as AuthInfo,
  };
}

async function resolveIdentity(authHeader: string | null): Promise<{
  userId: string | null;
  role: AuthenticatedUser["role"];
  token?: string;
}> {
  const identity: {
    userId: string | null;
    role: AuthenticatedUser["role"];
    token?: string;
  } = { userId: null, role: "user" };

  if (!authHeader?.startsWith("Bearer ")) {
    return identity;
  }

  const raw = authHeader.slice(7);

  // 2a. MCP-issued agent token (HS256, signed by MCP_JWT_SECRET)
  const claims = verifyMcpToken(raw);
  if (claims) {
    identity.userId = claims.sub;
    identity.role = claims.role;
    identity.token = raw; // backend also trusts MCP-issued JWTs
    return identity;
  }

  // 2c. Backend-issued opaque session token (enables immediate revocation)
  const sessionUserId = await resolveSessionToken(raw);
  if (sessionUserId) {
    identity.userId = sessionUserId;
    identity.token = raw;
    if (clerkClient) {
      try {
        const user = await clerkClient.users.getUser(sessionUserId);
        identity.role = resolveClerkRole(user);
      } catch {
        // Default to "user"
      }
    }
    return identity;
  }

  // 2b. Clerk session JWT (fallback — keeps existing behaviour)
  const clerkId = await verifyClerkJwt(authHeader);
  if (!clerkId) {
    return identity;
  }

  identity.userId = clerkId;
  identity.token = raw;
  if (clerkClient) {
    try {
      const user = await clerkClient.users.getUser(clerkId);
      identity.role = resolveClerkRole(user);
    } catch {
      // Default to "user"
    }
  }

  return identity;
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

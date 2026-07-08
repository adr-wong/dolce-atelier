# Dolce Atelier — MCP Server

Model Context Protocol server for Dolce Atelier bakery ecommerce platform.
Provides AI agents with structured access to the Dolce Atelier backend.

## Quick Start

```bash
cd mcp
cp .env.example .env   # fill in CLERK_SECRET_KEY
bun install
bun run src/index.ts   # → http://localhost:3002
```

## Auth Model

Every MCP request requires:

1. **`X-API-Key` header** — server-level API key (configured via `MCP_API_KEY` env var). Omit env var for dev mode (allows all).
2. **`Authorization: Bearer <token>`** — one of:
   - **MCP-issued agent token** (preferred). Minted by this server's OAuth token endpoint (see below). Signed with `MCP_JWT_SECRET` (HS256). The backend also trusts these tokens, so agents can order cakes end-to-end.
   - **Clerk session JWT** (fallback). Verified server-side via `@clerk/backend verifyToken()`.
3. **Role check** — Admin tools call `requireRole(userId, ["admin", "superadmin"])`. For MCP tokens the role comes from the token claims; for Clerk tokens it is read from `publicMetadata.role`.

**Error responses:**
- Missing/bad API key → `401 {"error": "Invalid API key"}`
- Missing/bad token → `401` (public tools still work without a token)
- User hitting admin tool → `403 {"error": "Forbidden: requires one of [admin, superadmin]"}`

## Getting an Agent Token (OAuth 2.0 Client Credentials)

The MCP server mints short-lived JWTs at `POST /token` so any agent (opencode, etc.)
can authenticate without a browser session.

### Option A — Machine agent (client_credentials)
Seed a client in `MCP_CLIENTS` (JSON array) and exchange it for a token:

```bash
curl -X POST https://<mcp-host>/token \
  -H 'Content-Type: application/json' \
  -d '{"grant_type":"client_credentials","client_id":"mcp_demo","client_secret":"<secret>"}'
# → { "access_token": "eyJ...", "token_type": "Bearer", "expires_in": 3600 }
```

### Option B — Human-in-the-loop (reuse Clerk)
A logged-in user exchanges a Clerk session token for an agent token:

```bash
curl -X POST https://<mcp-host>/token \
  -H 'Content-Type: application/json' \
  -d '{"grant_type":"clerk_exchange","clerk_token":"<clerk-session-jwt>"}'
```

### User-friendly UI
Open `GET /token` in a browser for a form that issues a token and shows a ready-to-paste
`opencode.json` snippet.

### Using the token with opencode
```json
{
  "mcp": {
    "dolce-atelier": {
      "type": "remote",
      "url": "https://<mcp-host>/mcp",
      "headers": {
        "X-API-Key": "YOUR_MCP_API_KEY",
        "Authorization": "Bearer {env:MCP_ACCESS_TOKEN}"
      }
    }
  }
}
```
Put the token in `MCP_ACCESS_TOKEN` (regenerate when it expires — `MCP_TOKEN_TTL`, default 3600s).

> **Deployment note:** `MCP_JWT_SECRET` must be set to the **same value** on both the MCP
> server and the backend so the backend accepts the tokens the MCP mints.

## Tools

### Read-only (Stage 2)
| Tool | Description | Auth |
|------|-------------|------|
| `ping` | Health check → `"pong"` | No |
| `search_cakes` | Search catalog with filters, sort, pagination | No* |
| `get_cake_detail` | Get single cake by ID | No* |
| `get_cart` | Get current user's cart (userId from JWT) | JWT |

\* Public tools — only require API key, not JWT

### Write — User-scoped (Stage 3)
| Tool | Description | Auth |
|------|-------------|------|
| `add_to_cart` | Add item to cart | JWT |
| `create_order` | Create order (idempotent via `Idempotency-Key`) | JWT |
| `list_orders` | List current user's orders | JWT |
| `get_order` | Get order by ID (ownership enforced) | JWT |
| `submit_recipe` | Submit custom recipe request | JWT |
| `list_my_recipes` | List current user's recipes | JWT |
| `accept_quote` | Accept quoted recipe → Stripe checkout URL | JWT |

### Admin (Stage 4)
| Tool | Description | Auth |
|------|-------------|------|
| `admin_dashboard_stats` | Dashboard stats | Admin |
| `admin_list_cakes` | List all cakes | Admin |
| `admin_create_cake` | Create cake | Admin |
| `admin_update_cake` | Update cake | Admin |
| `admin_delete_cake` | Delete cake | Admin |
| `admin_list_orders` | List all orders | Admin |
| `admin_update_order_status` | Update order status | Admin |
| `admin_list_recipes` | List all recipes | Admin |
| `admin_quote_recipe` | Quote/update recipe | Admin |
| `admin_upload_image` | Upload image to Cloudinary | Admin |

## Architecture

```
mcp/
├── src/
│   ├── index.ts          # HTTP server + /token OAuth endpoint + token UI + rate limiter
│   ├── auth/
│   │   ├── index.ts      # API key, MCP/Clerk JWT, requireRole, backend calls
│   │   ├── issuer.ts     # HS256 sign/verify of MCP-issued agent tokens
│   │   └── clients.ts    # OAuth client_credentials registry (seeded via MCP_CLIENTS)
│   └── tools/
│       ├── cakes.ts       # search_cakes, get_cake_detail
│       ├── cart.ts        # get_cart, add_to_cart (in-memory)
│       ├── orders.ts      # create_order, list_orders, get_order
│       ├── recipes.ts     # submit_recipe, list_my_recipes, accept_quote
│       └── admin.ts       # All admin tools
├── .env.example
├── railway.json
└── package.json
```

## Railway Deploy

3rd service in the Dolce Atelier Railway project.
Root directory: `mcp/`

- Builder: NIXPACKS (auto-detects Bun)
- Start: `bun run src/index.ts`
- Health: `GET /health`
- Port: `3002` (or `PORT` env var)

## Rate Limiting

In-memory token bucket: 60 req/min per API key.

## Structured Logging

Every request logs JSON to stdout:
```json
{"ts":"2026-07-04T21:00:00.000Z","level":"info","msg":"request","method":"POST","userId":"user_xxx","role":"user"}
```

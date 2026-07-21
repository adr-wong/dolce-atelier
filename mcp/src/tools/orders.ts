import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callBackend, requireAuth } from "../auth/index.js";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
export const CreateOrderInput = z.object({
  email: z.string().email("Valid email required"),
  items: z
    .array(
      z.object({
        pastelId: z.string(),
        cantidad: z.number().int().positive(),
      }),
    )
    .min(1, "At least one item required"),
  metodoEntrega: z.enum(["DOMICILIO", "TIENDA"]),
  direccionEnvio: z
    .string()
    .optional()
    .describe("Required if metodoEntrega is DOMICILIO"),
  telefono: z.string().optional(),
  idempotencyKey: z.string().describe("Unique key to prevent duplicate orders"),
});

export const GetOrderInput = z.object({
  id: z.string().describe("Order ID"),
});

export const PagarPedidoInput = z.object({
  pedidoId: z.string().describe("Order ID to pay"),
  email: z.string().email().optional().describe("Optional email override"),
  idempotencyKey: z.string().optional().describe("Optional idempotency key"),
});

// ---------------------------------------------------------------------------
// In-memory idempotency store (mirrors backend pattern)
// ---------------------------------------------------------------------------
const idempotencyStore = new Map<
  string,
  { response: unknown; createdAt: number }
>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of idempotencyStore) {
    if (now - v.createdAt > 86_400_000) idempotencyStore.delete(k);
  }
}, 300_000);

// ---------------------------------------------------------------------------
// Register order tools
// ---------------------------------------------------------------------------
export function registerOrderTools(server: McpServer) {
  // --- create_order ---
  server.registerTool(
    "create_order",
    {
      description: "Create a new pending order. Does NOT create Stripe session. Use pagar_pedido to get payment link.",
      inputSchema: CreateOrderInput,
    },
    async (args, extra) => {
      const auth = requireAuth(extra.authInfo);

      const cached = idempotencyStore.get(args.idempotencyKey);
      if (cached) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { idempotent: true, order: cached.response },
                null,
                2,
              ),
            },
          ],
        };
      }

      const result = await callBackend<unknown>("/api/pedidos", {
        method: "POST",
        body: {
          email: args.email,
          items: args.items,
          metodoEntrega: args.metodoEntrega,
          direccionEnvio: args.direccionEnvio,
          telefono: args.telefono,
        },
        headers: {
          Authorization: `Bearer ${auth.token ?? ""}`,
          "Idempotency-Key": args.idempotencyKey,
        },
      });

      if (!result.ok) {
        const err = result.data as { error?: string };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Failed to create order (${result.status}): ${err.error || "Unknown"}`,
            },
          ],
        };
      }

      idempotencyStore.set(args.idempotencyKey, {
        response: result.data,
        createdAt: Date.now(),
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result.data, null, 2) },
        ],
      };
    },
  );

  // --- pagar_pedido ---
  server.registerTool(
    "pagar_pedido",
    {
      description: "Create Stripe checkout session for a pending order. Returns checkout URL.",
      inputSchema: PagarPedidoInput,
    },
    async (args, extra) => {
      const auth = requireAuth(extra.authInfo);

      const body = args.email ? { email: args.email } : {};

      const headers: Record<string, string> = {
        Authorization: `Bearer ${auth.token ?? ""}`,
      };
      if (args.idempotencyKey) {
        headers["Idempotency-Key"] = args.idempotencyKey;
      }

      const result = await callBackend<unknown>(
        `/api/pedidos/${encodeURIComponent(args.pedidoId)}/pagar`,
        { method: "POST", body, headers }
      );

      if (!result.ok) {
        const err = result.data as { error?: string };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Failed to create payment session (${result.status}): ${err.error || "Unknown"}`,
            },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result.data, null, 2) },
        ],
      };
    },
  );

  // --- list_orders ---
  server.registerTool(
    "list_orders",
    {
      description:
        "List orders for the current user (or all if admin). Auth required.",
      inputSchema: z.object({
        estado: z.string().optional().describe("Filter by status"),
      }),
    },
    async (args, extra) => {
      const auth = requireAuth(extra.authInfo);

      const params = new URLSearchParams();
      if (args.estado) params.set("estado", args.estado);

      const result = await callBackend<unknown>(
        `/api/pedidos${params.toString() ? `?${params}` : ""}`,
        { headers: { Authorization: `Bearer ${auth.token ?? ""}` } },
      );

      if (!result.ok) {
        const err = result.data as { error?: string };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Backend error (${result.status}): ${err.error || "Unknown"}`,
            },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result.data, null, 2) },
        ],
      };
    },
  );

  // --- get_order ---
  server.registerTool(
    "get_order",
    {
      description:
        "Get a specific order by ID. Auth required — ownership enforced server-side.",
      inputSchema: GetOrderInput,
    },
    async (args, extra) => {
      const auth = requireAuth(extra.authInfo);

      const result = await callBackend<unknown>(
        `/api/pedidos/${encodeURIComponent(args.id)}`,
        { headers: { Authorization: `Bearer ${auth.token ?? ""}` } },
      );

      if (!result.ok) {
        const err = result.data as { error?: string };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Backend error (${result.status}): ${err.error || "Not found"}`,
            },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result.data, null, 2) },
        ],
      };
    },
  );
}

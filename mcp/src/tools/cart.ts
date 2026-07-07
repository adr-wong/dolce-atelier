import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { requireAuth } from "../auth/index.js";

// ---------------------------------------------------------------------------
// In-memory cart store (keyed by userId)
// ---------------------------------------------------------------------------
interface CartItem {
  pastelId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  imagen: string;
}

const cartStore = new Map<string, CartItem[]>();

function getCart(userId: string): CartItem[] {
  if (!cartStore.has(userId)) {
    cartStore.set(userId, []);
  }
  return cartStore.get(userId) ?? [];
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
export const AddToCartInput = z.object({
  pastelId: z.string().describe("Cake ID to add to cart"),
  cantidad: z.number().int().positive().describe("Quantity (min 1)").default(1),
  nombre: z.string().describe("Cake name"),
  precio: z.number().positive().describe("Cake unit price"),
  imagen: z.string().describe("Cake image URL"),
});

// ---------------------------------------------------------------------------
// Register cart tools
// ---------------------------------------------------------------------------
export function registerCartTools(server: McpServer) {
  // --- get_cart ---
  server.registerTool(
    "get_cart",
    {
      description:
        "Get the current user's shopping cart. Auth required — uses JWT userId, never client-supplied.",
      inputSchema: z.object({}),
    },
    async (_args, extra) => {
      const user = requireAuth(extra.authInfo);
      const items = getCart(user.userId);
      const total = items.reduce(
        (sum, item) => sum + item.precio * item.cantidad,
        0,
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                items,
                itemCount: items.length,
                total,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // --- add_to_cart ---
  server.registerTool(
    "add_to_cart",
    {
      description: "Add a cake to the current user's cart. Auth required.",
      inputSchema: AddToCartInput,
    },
    async (args, extra) => {
      const user = requireAuth(extra.authInfo);
      const cart = getCart(user.userId);
      const existing = cart.find((item) => item.pastelId === args.pastelId);

      if (existing) {
        existing.cantidad += args.cantidad;
      } else {
        cart.push({
          pastelId: args.pastelId,
          nombre: args.nombre,
          cantidad: args.cantidad,
          precio: args.precio,
          imagen: args.imagen,
        });
      }

      const total = cart.reduce(
        (sum, item) => sum + item.precio * item.cantidad,
        0,
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                added: { pastelId: args.pastelId, cantidad: args.cantidad },
                cart: { items: cart, itemCount: cart.length, total },
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  type AuthenticatedUser,
  BACKEND_URL,
  callBackend,
  requireRole,
} from "../auth/index.js";
import { validateImageUrl } from "../ssrf.js";

// ---------------------------------------------------------------------------
// Helper: make an admin-authenticated backend call
// ---------------------------------------------------------------------------
async function adminCall<T = unknown>(
  path: string,
  auth: AuthenticatedUser,
  options: { method?: string; body?: unknown } = {},
) {
  return callBackend<T>(path, {
    ...options,
    headers: { Authorization: `Bearer ${auth.token ?? ""}` },
  });
}

// ---------------------------------------------------------------------------
// Register admin tools
// ---------------------------------------------------------------------------
export function registerAdminTools(server: McpServer) {
  // --- dashboard_stats ---
  server.registerTool(
    "admin_dashboard_stats",
    {
      description:
        "[ADMIN] Get dashboard statistics (orders today, pending recipes, products, monthly revenue).",
      inputSchema: z.object({}),
    },
    async (_args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const result = await adminCall<unknown>("/api/admin/stats", user);

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_list_cakes ---
  server.registerTool(
    "admin_list_cakes",
    {
      description:
        "[ADMIN] List all cakes with pagination and optional search.",
      inputSchema: z.object({
        search: z.string().optional(),
        page: z.number().optional(),
      }),
    },
    async (args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const params = new URLSearchParams();
      if (args.search) params.set("search", args.search);
      if (args.page) params.set("page", String(args.page));

      const result = await adminCall<unknown>(
        `/api/admin/pasteles${params.toString() ? `?${params}` : ""}`,
        user,
      );

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_create_cake ---
  server.registerTool(
    "admin_create_cake",
    {
      description: "[ADMIN] Create a new cake.",
      inputSchema: z.object({
        nombre: z.string().min(1),
        descripcion: z.string().optional(),
        precio: z.number().positive(),
        imagen: z.string().url().optional(),
        categoria: z.string().optional(),
      }),
    },
    async (args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const result = await adminCall<unknown>("/api/admin/pasteles", user, {
        method: "POST",
        body: args,
      });

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_update_cake ---
  server.registerTool(
    "admin_update_cake",
    {
      description: "[ADMIN] Update an existing cake.",
      inputSchema: z.object({
        id: z.string(),
        nombre: z.string().optional(),
        descripcion: z.string().optional(),
        precio: z.number().positive().optional(),
        imagen: z.string().url().optional(),
        categoria: z.string().optional(),
      }),
    },
    async (args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const { id, ...body } = args;
      const result = await adminCall<unknown>(
        `/api/admin/pasteles/${encodeURIComponent(id)}`,
        user,
        { method: "PUT", body },
      );

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_delete_cake ---
  server.registerTool(
    "admin_delete_cake",
    {
      description: "[ADMIN] Delete a cake.",
      inputSchema: z.object({ id: z.string() }),
    },
    async (args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const result = await adminCall<unknown>(
        `/api/admin/pasteles/${encodeURIComponent(args.id)}`,
        user,
        { method: "DELETE" },
      );

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_list_orders ---
  server.registerTool(
    "admin_list_orders",
    {
      description: "[ADMIN] List all orders with optional status/date filter.",
      inputSchema: z.object({
        status: z.string().optional(),
        date: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    },
    async (args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const params = new URLSearchParams();
      if (args.status) params.set("status", args.status);
      if (args.date) params.set("date", args.date);
      if (args.page) params.set("page", args.page);
      if (args.limit) params.set("limit", args.limit);

      const result = await adminCall<unknown>(
        `/api/admin/pedidos${params.toString() ? `?${params}` : ""}`,
        user,
      );

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_update_order_status ---
  server.registerTool(
    "admin_update_order_status",
    {
      description: "[ADMIN] Update an order's status.",
      inputSchema: z.object({
        id: z.string(),
        status: z.enum([
          "PENDIENTE",
          "PAGADO",
          "PREPARANDO",
          "LISTO",
          "EN_CAMINO",
          "ENTREGADO",
          "CANCELADO",
        ]),
      }),
    },
    async (args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const result = await adminCall<unknown>(
        `/api/admin/pedidos/${encodeURIComponent(args.id)}/status`,
        user,
        { method: "PUT", body: { status: args.status } },
      );

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_list_recipes ---
  server.registerTool(
    "admin_list_recipes",
    {
      description: "[ADMIN] List all recipe requests.",
      inputSchema: z.object({}),
    },
    async (_args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const result = await adminCall<unknown>("/api/admin/recetas", user);

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_quote_recipe ---
  server.registerTool(
    "admin_quote_recipe",
    {
      description:
        "[ADMIN] Update a recipe's status and/or set its quotation price.",
      inputSchema: z.object({
        id: z.string(),
        estado: z
          .enum(["PENDIENTE", "REVISANDO", "COTIZADA", "ACEPTADA", "RECHAZADA"])
          .optional(),
        cotizacion: z.number().positive().optional(),
      }),
    },
    async (args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);
      const { id, ...body } = args;
      const result = await adminCall<unknown>(
        `/api/admin/recetas/${encodeURIComponent(id)}`,
        user,
        { method: "PUT", body },
      );

      if (!result.ok) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Backend error (${result.status})` },
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

  // --- admin_upload_image ---
  server.registerTool(
    "admin_upload_image",
    {
      description:
        "[ADMIN] Upload an image (Cloudinary). Note: requires file upload, limited via MCP.",
      inputSchema: z.object({
        imageUrl: z
          .string()
          .url()
          .describe("Public URL of image to re-upload to Cloudinary"),
      }),
    },
    async (args, extra) => {
      const user = requireRole(extra.authInfo, ["admin", "superadmin"]);

      // Validate image URL (SSRF protection)
      const urlCheck = await validateImageUrl(args.imageUrl);
      if (!urlCheck.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Image URL rejected: ${urlCheck.error}`,
            },
          ],
        };
      }

      // Fetch the image from the provided URL
      try {
        const imageResp = await fetch(args.imageUrl);
        if (!imageResp.ok) {
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: `Failed to fetch image: ${imageResp.status}`,
              },
            ],
          };
        }

        const blob = await imageResp.blob();
        const formData = new FormData();
        formData.append("file", blob, "upload.jpg");

        const resp = await fetch(`${BACKEND_URL}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token ?? ""}`,
          },
          body: formData,
        });

        const data = await resp.json();
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Upload failed: ${String(err)}` },
          ],
        };
      }
    },
  );
}

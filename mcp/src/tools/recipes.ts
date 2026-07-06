import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callBackend, requireAuth } from "../auth/index.js";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
export const SubmitRecipeInput = z.object({
  nota: z.string().min(1).max(2000).describe("Recipe description / notes"),
  personas: z.number().int().positive().describe("Number of servings"),
  archivoUrl: z
    .string()
    .url()
    .optional()
    .describe("Optional reference image URL"),
});

export const AcceptQuoteInput = z.object({
  recetaId: z.string().describe("Recipe ID with a pending quote"),
  email: z
    .string()
    .email()
    .optional()
    .describe("Customer email for Stripe session"),
});

// ---------------------------------------------------------------------------
// Register recipe tools
// ---------------------------------------------------------------------------
export function registerRecipeTools(server: McpServer) {
  // --- submit_recipe ---
  server.registerTool(
    "submit_recipe",
    {
      description: "Submit a custom recipe request. Auth required.",
      inputSchema: SubmitRecipeInput,
    },
    async (args, extra) => {
      const auth = requireAuth(extra.authInfo);

      const result = await callBackend<unknown>("/api/recetas", {
        method: "POST",
        body: {
          nota: args.nota,
          personas: args.personas,
          archivoUrl: args.archivoUrl,
        },
        headers: { Authorization: `Bearer ${auth.token ?? ""}` },
      });

      if (!result.ok) {
        const err = result.data as { error?: string };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Failed to submit recipe (${result.status}): ${err.error || "Unknown"}`,
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

  // --- list_my_recipes ---
  server.registerTool(
    "list_my_recipes",
    {
      description:
        "List the current user's custom recipe requests. Auth required.",
      inputSchema: z.object({
        estado: z
          .string()
          .optional()
          .describe(
            "Filter by status (PENDIENTE, REVISANDO, COTIZADA, ACEPTADA, RECHAZADA)",
          ),
      }),
    },
    async (args, extra) => {
      const auth = requireAuth(extra.authInfo);

      const params = new URLSearchParams();
      if (args.estado) params.set("estado", args.estado);

      const result = await callBackend<unknown>(
        `/api/recetas${params.toString() ? `?${params}` : ""}`,
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

  // --- accept_quote ---
  server.registerTool(
    "accept_quote",
    {
      description:
        "Accept a quoted recipe price and get a Stripe checkout URL. Auth required — ownership enforced.",
      inputSchema: AcceptQuoteInput,
    },
    async (args, extra) => {
      const auth = requireAuth(extra.authInfo);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${auth.token ?? ""}`,
      };
      if (args.email) {
        headers["x-user-email"] = args.email;
      }

      const result = await callBackend<unknown>(
        `/api/recetas/${encodeURIComponent(args.recetaId)}/aceptar-pagar`,
        {
          method: "POST",
          headers,
        },
      );

      if (!result.ok) {
        const err = result.data as { error?: string };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Failed to accept quote (${result.status}): ${err.error || "Unknown"}`,
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

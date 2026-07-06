import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callBackend } from "../auth/index.js";

// ---------------------------------------------------------------------------
// Zod schemas (input validation)
// ---------------------------------------------------------------------------
export const SearchCakesInput = z.object({
  q: z.string().optional().describe("Search by name or description"),
  categoria: z
    .string()
    .optional()
    .describe("Filter by category (chocolate, vainilla, frutas)"),
  precioMin: z.number().optional().describe("Minimum price filter"),
  precioMax: z.number().optional().describe("Maximum price filter"),
  ordenarPor: z
    .enum(["precio", "nombre", "createdAt"])
    .optional()
    .describe("Sort field"),
  orden: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
  page: z.number().optional().describe("Page number (default: 1)"),
  limit: z.number().optional().describe("Results per page (default: 12)"),
});

export const GetCakeDetailInput = z.object({
  id: z.string().describe("Cake ID"),
});

// ---------------------------------------------------------------------------
// Tool response types
// ---------------------------------------------------------------------------
interface CakeResult {
  _id: string;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: string;
  disponible: boolean;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResult {
  pasteles: CakeResult[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Register tools on McpServer
// ---------------------------------------------------------------------------
export function registerCakeTools(server: McpServer) {
  // --- search_cakes ---
  server.registerTool(
    "search_cakes",
    {
      description:
        "Search and list cakes from the Dolce Atelier catalog. Supports filters, sorting, and pagination.",
      inputSchema: SearchCakesInput,
    },
    async (args) => {
      // Build query string from args
      const params = new URLSearchParams();
      if (args.q) params.set("q", args.q);
      if (args.categoria) params.set("categoria", args.categoria);
      if (args.precioMin !== undefined)
        params.set("precioMin", String(args.precioMin));
      if (args.precioMax !== undefined)
        params.set("precioMax", String(args.precioMax));
      if (args.ordenarPor) params.set("ordenarPor", args.ordenarPor);
      if (args.orden) params.set("orden", args.orden);
      if (args.page) params.set("page", String(args.page));
      if (args.limit) params.set("limit", String(args.limit));

      const qs = params.toString();
      const result = await callBackend<PaginatedResult | { error: string }>(
        `/api/pasteles${qs ? `?${qs}` : ""}`,
      );

      if (!result.ok) {
        const errData = result.data as { error?: string };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Backend error (${result.status}): ${errData.error || "Unknown"}`,
            },
          ],
        };
      }

      const data = result.data as PaginatedResult;
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                total: data.total,
                page: data.page,
                totalPages: data.totalPages,
                cakes: data.pasteles.map((c) => ({
                  id: c._id,
                  name: c.nombre,
                  price: c.precio,
                  category: c.categoria,
                  available: c.disponible,
                  description: c.descripcion,
                  image: c.imagen,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // --- get_cake_detail ---
  server.registerTool(
    "get_cake_detail",
    {
      description: "Get detailed information about a specific cake by its ID.",
      inputSchema: GetCakeDetailInput,
    },
    async (args) => {
      const result = await callBackend<CakeResult | { error: string }>(
        `/api/pasteles/${encodeURIComponent(args.id)}`,
      );

      if (!result.ok) {
        const errData = result.data as { error?: string };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Backend error (${result.status}): ${errData.error || "Not found"}`,
            },
          ],
        };
      }

      const cake = result.data as CakeResult;
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                id: cake._id,
                name: cake.nombre,
                price: cake.precio,
                category: cake.categoria,
                available: cake.disponible,
                description: cake.descripcion || "",
                image: cake.imagen,
                createdAt: cake.createdAt,
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

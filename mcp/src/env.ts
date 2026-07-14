import { z } from "zod";

const envSchema = z.object({
  BACKEND_URL: z.string().url("BACKEND_URL must be a valid URL"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  PORT: z.coerce.number().default(3002),
  // Secret used to sign/verify the MCP-issued agent access tokens (HS256).
  MCP_JWT_SECRET: z
    .string()
    .min(1, "MCP_JWT_SECRET is required for agent tokens"),
  // Lifetime of issued agent tokens, in seconds.
  MCP_TOKEN_TTL: z.coerce.number().default(3600),
  // The MCP server's own public base URL (used to build OAuth metadata URLs).
  MCP_PUBLIC_URL: z.string().url("MCP_PUBLIC_URL must be a valid URL"),
  // Frontend base URL (consent page; used in a later phase).
  FRONTEND_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      console.error(`[FATAL] Invalid environment:\n${issues}`);
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}

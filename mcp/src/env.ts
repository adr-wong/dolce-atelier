import { z } from "zod";

const envSchema = z.object({
  BACKEND_URL: z.string().url("BACKEND_URL must be a valid URL"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  PORT: z.coerce.number().default(3002),
  MCP_API_KEY: z.string().optional(),
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

// Dev helper: starts Stripe CLI listener with API key from .env
import { spawn } from "bun";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");

// Parse .env
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  env[key] = value;
}

const apiKey = env.STRIPE_SECRET_KEY;
if (!apiKey) {
  console.error("[stripe-dev] STRIPE_SECRET_KEY not found in .env");
  process.exit(1);
}

const stripePath = "C:/Users/Ivan/bin/stripe";

console.log("[stripe-dev] Starting Stripe CLI listener...");

const proc = spawn({
  cmd: [stripePath, "listen", "--forward-to", "localhost:3001/api/webhook/stripe", "--skip-verify", "--api-key", apiKey],
  stdout: "inherit",
  stderr: "inherit",
});

await proc.exited;

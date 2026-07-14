interface McpServerConfig {
  type: "remote";
  url: string;
  oauth: Record<string, unknown>;
}

interface OpencodeConfig {
  $schema: string;
  mcp?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

const CONFIG_PATH = "/home/awong/Programas/DS9/semestral/opencode.json";
const SCHEMA_URL = "https://opencode.ai/config.json";
const DEFAULT_BASE_URL = "https://hospitable-healing-production.up.railway.app";

function printHelp(): void {
  console.log(`setup.ts - Configura el servidor MCP de Dolce Atelier en opencode.json

Uso:
  bun run scripts/setup.ts [opciones]

Opciones:
  --url <url>        URL base del servidor MCP (sin /mcp). Por defecto se usa
                      MCP_URL, luego https://hospitable-healing-production.up.railway.app.
  --api-key <key>    (obsoleto) ignorado, se usa OAuth en su lugar.
  --token <token>   (obsoleto) ignorado, se usa OAuth en su lugar.
  -h, --help         Muestra esta ayuda.

Variables de entorno equivalentes:
  MCP_URL (MCP_API_KEY y MCP_ACCESS_TOKEN ya no se usan; el cliente negocia
  el token vía OAuth 2.0 / PKCE).

Si un valor falta y se ejecuta de forma interactiva, se solicitará con un prompt.
`);
}

function parseArgs(argv: string[]): {
  url?: string;
  apiKey?: string;
  token?: string;
  help: boolean;
} {
  const out: { url?: string; apiKey?: string; token?: string; help: boolean } = {
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--url") {
      out.url = argv[++i];
    } else if (arg === "--api-key") {
      out.apiKey = argv[++i];
    } else if (arg === "--token") {
      out.token = argv[++i];
    }
  }
  return out;
}

function resolveBaseUrl(argUrl?: string): string {
  const base = argUrl ?? process.env.MCP_URL;
  if (base) return base;
  return DEFAULT_BASE_URL;
}

async function ask(promptText: string, envValue?: string): Promise<string> {
  if (envValue !== undefined && envValue !== "") return envValue;
  if (typeof prompt === "function") {
    const answer = prompt(promptText);
    return answer ?? "";
  }
  return envValue ?? "";
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const base = resolveBaseUrl(args.url);
  // Las banderas --api-key/--token y MCP_API_KEY/MCP_ACCESS_TOKEN son obsoletas:
  // el cliente obtiene el token mediante el flujo OAuth 2.0 / PKCE del servidor.
  await ask("(ignorado) X-API-Key del servidor MCP: ", args.apiKey ?? process.env.MCP_API_KEY);
  await ask("(ignorado) Token de sesión del frontend: ", args.token ?? process.env.MCP_ACCESS_TOKEN);

  const mcpUrl = base.replace(/\/+$/, "") + "/mcp";

  let config: OpencodeConfig;
  const file = Bun.file(CONFIG_PATH);
  if (await file.exists()) {
    config = (await file.json()) as OpencodeConfig;
  } else {
    config = { $schema: SCHEMA_URL };
  }

  config.mcp = config.mcp ?? {};
  config.mcp["dolce-atelier"] = {
    type: "remote",
    url: mcpUrl,
    oauth: {},
  };

  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");

  console.log(`Configurado MCP en ${mcpUrl}`);
  console.log(
    "Listo. Recarga opencode y usa la herramienta list_tools para ver las herramientas disponibles.",
  );
}

await main();

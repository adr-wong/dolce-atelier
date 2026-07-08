// Structured JSON logger shared across the MCP server modules.

export function log(
  level: "info" | "warn" | "error",
  msg: string,
  extra?: Record<string, unknown>,
) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...extra,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.log(line);
}

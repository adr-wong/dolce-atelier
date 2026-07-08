"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { exchangeMcpToken, buildOpencodeSnippet } from "@/lib/mcpAuth";
import styles from "./mcp.module.css";

const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || "http://localhost:3002";
const MCP_API_KEY = process.env.NEXT_PUBLIC_MCP_API_KEY || "";

export default function McpAccesoPage() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [copied, setCopied] = useState<"token" | "config" | null>(null);

  async function generarToken() {
    setLoading(true);
    setError(null);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("No se pudo obtener tu sesión");
      const res = await exchangeMcpToken(clerkToken, MCP_URL);
      setJwt(res.access_token);
      setExpiresIn(res.expires_in);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el token");
      setJwt(null);
    } finally {
      setLoading(false);
    }
  }

  function snippet(): string {
    return buildOpencodeSnippet({
      mcpUrl: MCP_URL,
      apiKey: MCP_API_KEY || "TU_MCP_API_KEY",
      jwt: jwt || "TU_JWT",
    });
  }

  async function copiar(texto: string, tipo: "token" | "config") {
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(tipo);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  if (!isSignedIn) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>Acceso al MCP</h1>
        <p className={styles.hint}>Inicia sesión para generar tu token de acceso.</p>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Acceso al MCP de Dolce Atelier</h1>
      <p className={styles.hint}>
        Genera un <strong>token personal</strong> (JWT) vinculado a tu cuenta
        ({user?.primaryEmailAddress?.emailAddress || user?.id}). Úsalo junto con
        la API key del servidor para conectar un agente (opencode, etc.) al MCP.
      </p>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>1. Tu token de acceso (JWT)</h2>
        <button
          className={styles.button}
          onClick={generarToken}
          disabled={loading}
        >
          {loading ? "Generando…" : "Generar mi token"}
        </button>

        {error && <p className={styles.error}>{error}</p>}

        {jwt && (
          <>
            <div className={styles.tokenRow}>
              <code className={styles.token}>{jwt}</code>
              <button
                className={styles.copyBtn}
                onClick={() => copiar(jwt, "token")}
              >
                {copied === "token" ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            {expiresIn !== null && (
              <p className={styles.meta}>
                Válido por {Math.round(expiresIn / 60)} min. Regénálo cuando
                expire.
              </p>
            )}
          </>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>2. Configuración para tu agente</h2>
        <p className={styles.hint}>
          Pega esto en tu <code>opencode.json</code>. La API key es la del
          servidor (compartida) y el token es el tuyo, personal.
        </p>
        <pre className={styles.snippet}>{snippet()}</pre>
        <button
          className={styles.copyBtn}
          onClick={() => copiar(snippet(), "config")}
        >
          {copied === "config" ? "¡Copiado!" : "Copiar config"}
        </button>
        {!MCP_API_KEY && (
          <p className={styles.warn}>
            Define <code>NEXT_PUBLIC_MCP_API_KEY</code> para precargar la API key
            del servidor en la configuración.
          </p>
        )}
      </section>
    </main>
  );
}

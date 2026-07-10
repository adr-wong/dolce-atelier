"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  exchangeMcpToken,
  buildOpencodeSnippet,
  createMcpSession,
  listMcpSessions,
  revokeMcpSession,
  type McpSession,
} from "@/lib/mcpAuth";
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

  const [sessions, setSessions] = useState<McpSession[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionExpires, setSessionExpires] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  async function cargarSesiones() {
    setSessionError(null);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("No se pudo obtener tu sesión");
      setSessions(await listMcpSessions(clerkToken, MCP_URL));
    } catch (err) {
      setSessionError(
        err instanceof Error ? err.message : "Error al listar las sesiones",
      );
    }
  }

  async function crearSesion() {
    setSessionLoading(true);
    setSessionError(null);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("No se pudo obtener tu sesión");
      const res = await createMcpSession(clerkToken, MCP_URL, "opencode");
      setSessionToken(res.token);
      setSessionExpires(res.expiresAt);
      await cargarSesiones();
    } catch (err) {
      setSessionError(
        err instanceof Error ? err.message : "Error al crear el token de sesión",
      );
    } finally {
      setSessionLoading(false);
    }
  }

  async function revocarSesion(id: string) {
    setSessionError(null);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("No se pudo obtener tu sesión");
      await revokeMcpSession(clerkToken, MCP_URL, id);
      await cargarSesiones();
    } catch (err) {
      setSessionError(
        err instanceof Error ? err.message : "Error al revocar la sesión",
      );
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      cargarSesiones();
    }
  }, [isSignedIn]);

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

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          3. Tokens de sesión (8 h, revocables)
        </h2>
        <p className={styles.hint}>
          Crea un token de sesión revocable (válido 8 h) para conectar tu agente.
          Se muestra una sola vez; guárdalo. Puedes revocar los activos en
          cualquier momento.
        </p>
        <button
          className={styles.button}
          onClick={crearSesion}
          disabled={sessionLoading}
        >
          {sessionLoading ? "Creando…" : "Crear token de sesión"}
        </button>

        {sessionError && <p className={styles.error}>{sessionError}</p>}

        {sessionToken && (
          <>
            <div className={styles.tokenRow}>
              <code className={styles.token}>{sessionToken}</code>
              <button
                className={styles.copyBtn}
                onClick={() => copiar(sessionToken, "token")}
              >
                {copied === "token" ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            {sessionExpires && (
              <p className={styles.meta}>
                Expira el {new Date(sessionExpires).toLocaleString()}. Úsalo
                solo una vez.
              </p>
            )}
            <pre className={styles.snippet}>
              {buildOpencodeSnippet({
                mcpUrl: MCP_URL,
                apiKey: MCP_API_KEY || "TU_MCP_API_KEY",
                jwt: sessionToken || "TU_SESSION_TOKEN",
              })}
            </pre>
            <p className={styles.hint}>
              Configuración para tu <code>opencode.json</code>: el Bearer es
              este token de sesión y <code>X-API-Key</code> es la key del
              servidor.
            </p>
          </>
        )}

        {sessions.length > 0 && (
          <div>
            <h3 className={styles.cardTitle}>Sesiones activas</h3>
            {sessions.map((s) => (
              <div key={s.id} className={styles.tokenRow}>
                <code className={styles.token}>
                  {s.label || "sin etiqueta"} · ···{s.last4}
                  {s.revoked
                    ? " · revocado"
                    : ` · expira ${new Date(s.expiresAt).toLocaleString()}`}
                </code>
                {!s.revoked && (
                  <button
                    className={styles.copyBtn}
                    onClick={() => revocarSesion(s.id)}
                  >
                    Revocar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

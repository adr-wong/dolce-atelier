"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const MCP_BASE = (
  process.env.NEXT_PUBLIC_MCP_URL ||
  "https://hospitable-healing-production.up.railway.app"
).replace(/\/$/, "");

function ConsentInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();

  const client_id = params.get("client_id") || "";
  const redirect_uri = params.get("redirect_uri") || "";
  const state = params.get("state") || "";
  const scope = params.get("scope") || "";
  const code_challenge = params.get("code_challenge") || "";
  const code_challenge_method = params.get("code_challenge_method") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goSignIn() {
    const returnTo = `/mcp-authorize?${new URLSearchParams({
      client_id,
      redirect_uri,
      state,
      scope,
      code_challenge,
      code_challenge_method,
    }).toString()}`;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
  }

  async function permitir() {
    setLoading(true);
    setError(null);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("No se pudo obtener tu sesión");

      const res = await fetch(`${MCP_BASE}/authorize/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_token: clerkToken,
          client_id,
          redirect_uri,
          state,
          scope,
          code_challenge,
          code_challenge_method,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!res.ok || !data.code) {
        const message =
          (data.error_description as string) ||
          (data.error as string) ||
          "Error al autorizar la aplicación";
        throw new Error(message);
      }

      const finalRedirect = `${data.redirect_uri}?code=${encodeURIComponent(
        data.code as string,
      )}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
      window.location.href = finalRedirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  function cancelar() {
    const finalRedirect = `${redirect_uri}?error=access_denied${
      state ? `&state=${encodeURIComponent(state)}` : ""
    }`;
    window.location.href = finalRedirect;
  }

  if (!isSignedIn) {
    return (
      <main style={wrap}>
        <h1 style={title}>Autorizar acceso</h1>
        <p style={hint}>
          Debes iniciar sesión en Dolce Atelier para autorizar esta aplicación.
        </p>
        <button style={button} onClick={goSignIn}>
          Iniciar sesión
        </button>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <h1 style={title}>Autorizar acceso</h1>
      <div style={card}>
        <p style={body}>
          La aplicación <strong>{client_id || "tu agente"}</strong> quiere
          acceder a tu cuenta de Dolce Atelier.
        </p>
        {scope ? (
          <p style={hint}>
            <strong>Alcance (scope):</strong> {scope}
          </p>
        ) : null}
        <p style={hint}>
          Al permitir, la aplicación podrá actuar en tu nombre mediante el
          protocolo OAuth 2.0 (PKCE).
        </p>

        {error ? <p style={err}>{error}</p> : null}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button style={button} onClick={permitir} disabled={loading}>
            {loading ? "Procesando…" : "Permitir"}
          </button>
          <button
            style={{ ...button, background: "#6b7280" }}
            onClick={cancelar}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </main>
  );
}

const wrap: React.CSSProperties = {
  maxWidth: 640,
  margin: "2rem auto",
  padding: "0 1rem",
  fontFamily: "system-ui, sans-serif",
};
const title: React.CSSProperties = { fontSize: "1.5rem" };
const card: React.CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: 12,
  padding: "1.25rem",
  background: "#fff",
};
const hint: React.CSSProperties = { color: "#6b7280", fontSize: "0.9rem" };
const body: React.CSSProperties = { fontSize: "1rem", lineHeight: 1.5 };
const err: React.CSSProperties = { color: "#dc2626", marginTop: "0.5rem" };
const button: React.CSSProperties = {
  padding: "0.6rem 1.2rem",
  border: 0,
  borderRadius: 8,
  background: "#c2410c",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.95rem",
};

export default function McpAuthorizePage() {
  return (
    <Suspense fallback={<main style={wrap}>Cargando…</main>}>
      <ConsentInner />
    </Suspense>
  );
}

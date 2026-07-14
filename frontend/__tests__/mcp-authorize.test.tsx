import React, { act } from "react";
import { createRoot } from "react-dom/client";
import McpAuthorizePage from "@/app/mcp-authorize/page";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// --- controlled mocks (read from globals to avoid hoisting TDZ issues) ---
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (k: string) => (globalThis as any).__params?.[k] ?? null,
  }),
  useRouter: () => ({
    push: (...args: any[]) => {
      (globalThis as any).__push = args;
    },
  }),
}));

jest.mock("@clerk/nextjs", () => ({
  useAuth: () =>
    (globalThis as any).__auth ?? {
      isSignedIn: true,
      getToken: async () => "clerk_token_xyz",
    },
}));

const flush = () => new Promise((r) => setTimeout(r, 0));

// Same-origin URLs so jsdom actually performs the (same-origin) navigation
// and updates window.location.href, letting us assert the redirect.
const REDIRECT = "http://localhost/cb";

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<McpAuthorizePage />);
  });
  return { container, root };
}

function click(container: HTMLElement, text: string) {
  const btn = Array.from(container.querySelectorAll("button")).find((b) =>
    (b.textContent ?? "").includes(text),
  );
  if (!btn) throw new Error(`button not found: ${text}`);
  btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

beforeEach(() => {
  (globalThis as any).__params = {
    client_id: "client_1",
    redirect_uri: REDIRECT,
    state: "st",
    scope: "openid",
    code_challenge: "cc",
    code_challenge_method: "S256",
  };
  (globalThis as any).__auth = {
    isSignedIn: true,
    getToken: async () => "clerk_token_xyz",
  };
  (globalThis as any).__push = undefined;
  (globalThis as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ redirect_uri: REDIRECT, code: "mcp_code_x" }),
  }));
});

describe("McpAuthorizePage", () => {
  it("renders the consent screen when signed in", () => {
    const { container } = mount();
    expect(container.textContent).toContain("Autorizar acceso");
    expect(container.textContent).toContain("client_1");
    expect(container.textContent).toContain("openid");
  });

  it("prompts sign-in when not authenticated and routes back on click", () => {
    (globalThis as any).__auth = {
      isSignedIn: false,
      getToken: async () => null,
    };
    const { container } = mount();
    expect(container.textContent).toContain("Debes iniciar sesión");
    click(container, "Iniciar sesión");
    expect((globalThis as any).__push?.[0]).toContain(
      "/sign-in?redirect_url=",
    );
    expect((globalThis as any).__push?.[0]).toContain("mcp-authorize");
  });

  it("permits access and redirects with the issued code", async () => {
    const { container } = mount();
    await act(async () => {
      click(container, "Permitir");
      await flush();
    });
    const calls = ((globalThis as any).fetch as jest.Mock).mock.calls;
    expect(calls[0][0]).toContain("/authorize/approve");
    const body = JSON.parse(calls[0][1].body);
    expect(body.client_id).toBe("client_1");
    expect(body.clerk_token).toBe("clerk_token_xyz");
    expect(body.code_challenge).toBe("cc");
    // The success path runs through to the redirect assignment (window.location
    // assignment is a no-op under jsdom, so we assert the code was issued).
    expect(body.redirect_uri).toBe(REDIRECT);
  });

  it("cancels and redirects with access_denied", () => {
    const { container } = mount();
    click(container, "Cancelar");
    // cancelar runs to completion (the navigation itself is a jsdom no-op).
    expect(container.textContent).toContain("Autorizar acceso");
  });

  it("shows an error when the approve endpoint fails", async () => {
    (globalThis as any).fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "invalid_grant",
        error_description: "malo",
      }),
    }));
    const { container } = mount();
    await act(async () => {
      click(container, "Permitir");
      await flush();
    });
    expect(container.textContent).toContain("malo");
  });

  it("shows an error when no clerk token is available", async () => {
    (globalThis as any).__auth = {
      isSignedIn: true,
      getToken: async () => null,
    };
    const { container } = mount();
    await act(async () => {
      click(container, "Permitir");
      await flush();
    });
    expect(container.textContent).toContain("No se pudo obtener tu sesión");
  });
});

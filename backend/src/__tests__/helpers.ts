// Shared test doubles for routes/services tests.
//
// IMPORTANT: bun:test shares a single module registry across all test files in
// one `bun test` run, and mock.module calls re-point a module for the whole
// process. To avoid cross-file contamination, every test file imports these
// SINGLETON mocks and registers them via mock.module(...). Because each module
// path always resolves to the exact same object, re-mocking is a no-op and all
// consumers keep working regardless of file load order. Tests configure return
// values on these singletons. We also set `concurrency = 1` in bunfig.toml so
// concurrent tests never clobber each other's mock state.
import { mock } from "bun:test";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Service singletons (../services index + specific service modules)
// ---------------------------------------------------------------------------
export const pedidoServiceMock = {
  listarPorUsuario: mock(async () => []),
  listarTodos: mock(async () => []),
  obtener: mock(async () => null),
  obtenerPorStripeId: mock(async () => null),
  crear: mock(async () => ({ _id: "p1" })),
  crearSesionPago: mock(async () => ({ checkoutUrl: "http://pay/1", stripeSessionId: "sess_1" })),
  actualizarEstado: mock(async () => null),
  confirmarPago: mock(async () => null),
  confirmarPagoConEmail: mock(async () => null),
  contarPedidosHoy: mock(async () => 0),
  calcularIngresosMes: mock(async () => 0),
};

export const pastelServiceMock = {
  listar: mock(async () => ({ pasteles: [], total: 0, page: 1, totalPages: 0 })),
  obtener: mock(async () => null),
  crear: mock(async () => ({ _id: "p1" })),
  actualizar: mock(async () => null),
  eliminar: mock(async () => false),
};

export const recetaServiceMock = {
  listarPorUsuario: mock(async () => []),
  listarTodos: mock(async () => []),
  obtener: mock(async () => null),
  crear: mock(async () => ({ _id: "r1", estado: "PENDIENTE" })),
  actualizar: mock(async () => null),
  cotizar: mock(async () => null),
  aceptar: mock(async () => null),
  contarPendientes: mock(async () => 0),
};

export const stripeServiceMock = {
  crearSesionCheckout: mock(async () => ({ id: "sess", url: "http://pay/1" })),
  crearSesionReceta: mock(async () => ({ id: "sess", url: "http://pay/1" })),
  reembolsarPago: mock(async () => ({ id: "ref_1" })),
  procesarWebhookStripe: mock(async () => ({ success: true })),
};

export const auditLogServiceMock = { log: mock(async () => {}) };

export const servicesMock = {
  pedidoService: pedidoServiceMock,
  pastelService: pastelServiceMock,
  recetaService: recetaServiceMock,
  stripe: stripeServiceMock,
  auditLogService: auditLogServiceMock,
  subirImagen: mock(async () => "http://img/1"),
  subirReceta: mock(async () => "http://rec/1"),
};

// ---------------------------------------------------------------------------
// Auth singletons (../middleware/auth)
// ---------------------------------------------------------------------------
export const verifyAdmin = mock(async (h?: any) => (h ? { userId: "u1", role: "admin" } : null));
export const authMiddleware = mock(async (_h?: any) => "u1");
export const verifyToken = mock(async (h?: any) => (h ? "u1" : null));
export const authMock = { verifyAdmin, authMiddleware, verifyToken };

// ---------------------------------------------------------------------------
// Clerk singletons (../lib/clerk)
// ---------------------------------------------------------------------------
export const clerkGetUser = mock(async () => ({
  publicMetadata: {},
  privateMetadata: { mcpKeys: [] },
  emailAddresses: [{ emailAddress: "a@b.com" }],
  firstName: "A",
  lastName: "B",
  createdAt: 1,
}));
export const clerkUpdateUserMetadata = mock(async () => ({}));
export const clerkGetUserList = mock(async () => ({
  data: [
    {
      id: "u1",
      emailAddresses: [{ emailAddress: "a@b.com" }],
      firstName: "A",
      lastName: "B",
      createdAt: 1,
      publicMetadata: { role: "admin" },
    },
  ],
}));
export const clerkUpdateUser = mock(async () => ({}));
export const clerkCreateSessionToken = mock(async () => "sess-token");
export const clerkSessions = {
  getSessionList: mock(async () => ({ data: [{ id: "s1" }, { id: "s2" }] })),
  revokeSession: mock(async () => ({})),
  createSessionToken: clerkCreateSessionToken,
};
export const clerkClientMock = {
  users: { getUser: clerkGetUser, updateUserMetadata: clerkUpdateUserMetadata, getUserList: clerkGetUserList, updateUser: clerkUpdateUser },
  sessions: clerkSessions,
};

// Flat convenience aliases used by route tests (mirror the nested shape above).
(clerkClientMock as any).clerkGetUser = clerkGetUser;
(clerkClientMock as any).clerkUpdateUser = clerkUpdateUser;
(clerkClientMock as any).clerkUpdateUserMetadata = clerkUpdateUserMetadata;
(clerkClientMock as any).clerkGetUserList = clerkGetUserList;
(clerkClientMock as any).clerkCreateSessionToken = clerkCreateSessionToken;
(clerkClientMock as any).clerkSessions = clerkSessions;

// ---------------------------------------------------------------------------
// Models singleton (../models)
// ---------------------------------------------------------------------------
export interface ModelState {
  findResult: any[];
  findOneResult: any;
  findByIdResult: any;
  findByIdAndUpdateResult: any;
  findOneAndUpdateResult: any;
  findByIdAndDeleteResult: any;
  createResult: any;
  countResult: number;
  aggregateResult: any[];
  lastCreate: any;
}

export function newModelState(): ModelState {
  return {
    findResult: [],
    findOneResult: null,
    findByIdResult: null,
    findByIdAndUpdateResult: null,
    findOneAndUpdateResult: null,
    findByIdAndDeleteResult: null,
    createResult: undefined,
    countResult: 0,
    aggregateResult: [],
    lastCreate: undefined,
  };
}

function chainable(result: any): any {
  const obj: any = {};
  obj.then = (cb: any) => Promise.resolve(result).then(cb);
  obj.catch = (cb: any) => Promise.resolve(result).catch(cb);
  for (const k of ["sort", "limit", "skip", "select", "lean", "populate", "count", "exec"]) {
    obj[k] = () => obj;
  }
  return obj;
}

function makeModel(state: ModelState): any {
  return {
    find: () => chainable(state.findResult),
    findOne: () => chainable(state.findOneResult),
    findById: () => chainable(state.findByIdResult),
    findByIdAndUpdate: () => chainable(state.findByIdAndUpdateResult),
    findOneAndUpdate: () => chainable(state.findOneAndUpdateResult),
    findByIdAndDelete: () => chainable(state.findByIdAndDeleteResult),
    create: (data: any) => {
      state.lastCreate = data;
      return chainable(state.createResult !== undefined ? state.createResult : data);
    },
    countDocuments: () => chainable(state.countResult ?? 0),
    aggregate: () => chainable(state.aggregateResult ?? []),
  };
}

export const modelState = newModelState();
export const modelsMock = (() => {
  const model = makeModel(modelState);
  const out: Record<string, any> = {};
  for (const name of ["Pedido", "Pastel", "Receta", "AuditLog", "WebhookEvent", "CodigoDescuento", "Categoria"]) {
    out[name] = model;
  }
  return out;
})();

// ---------------------------------------------------------------------------
// npm package singletons
// ---------------------------------------------------------------------------
export const stripeCheckoutCreate = mock(async (o: any) => ({ id: "sess_1", url: "http://pay/1" }));
export const stripeCheckoutRetrieve = mock(async () => ({ payment_intent: "pi_1" }));
export const stripeRefundsCreate = mock(async () => ({ id: "ref_1" }));
export const stripeConstructEvent = mock((payload: any) => {
  const body = typeof payload === "string" ? payload : payload?.body;
  return JSON.parse(body);
});
class StripeNpmMock {
  checkout = { sessions: { create: stripeCheckoutCreate, retrieve: stripeCheckoutRetrieve } };
  refunds = { create: stripeRefundsCreate };
  webhooks = { constructEvent: stripeConstructEvent };
}
export const stripeNpmMock = StripeNpmMock as any;

export const cloudinaryUploadStream = mock((_o: any, cb: any) => {
  cb(null, { secure_url: "http://img/1" });
  return { end: () => {} };
});
export const cloudinaryDestroy = mock(async () => ({ result: "ok" }));
export const cloudinaryMock = {
  v2: { config: () => {}, uploader: { upload_stream: cloudinaryUploadStream, destroy: cloudinaryDestroy } },
};

export const nodemailerSendMail = mock(async () => ({ messageId: "m1" }));
export const nodemailerMock = {
  default: { createTransport: () => ({ sendMail: nodemailerSendMail }) },
};

export const resendSend = mock(async () => ({ data: { id: "r1" }, error: null }));
class ResendNpmMock {
  emails = { send: resendSend };
}
export const resendMock = { Resend: ResendNpmMock };

// ---------------------------------------------------------------------------
// Complete service-submodule mock objects (leak-safe singletons)
// ---------------------------------------------------------------------------
export const stripeMockModule = {
  stripe: stripeServiceMock,
  crearSesionCheckout: stripeServiceMock.crearSesionCheckout,
  crearSesionReceta: stripeServiceMock.crearSesionReceta,
  reembolsarPago: stripeServiceMock.reembolsarPago,
  procesarWebhookStripe: stripeServiceMock.procesarWebhookStripe,
};

export const auditLogMockModule = {
  auditLogService: auditLogServiceMock,
};

export const brevoMockModule = {
  enviarEmail: mock(async () => true),
  enviarFacturaPedido: mock(async () => true),
  enviarNotificacionEstado: mock(async () => true),
  enviarRecordatorioPedido: mock(async () => true),
};

// ---------------------------------------------------------------------------
// Models singleton accessor
// ---------------------------------------------------------------------------
export function mockModels() {
  return { state: modelState, models: modelsMock };
}

// ---------------------------------------------------------------------------
// MCP JWT signing for real-middleware auth in route tests.
// The real middleware (../middleware/auth) verifies MCP tokens offline via the
// HS256 fallback path, so we can authenticate HTTP requests without mocking it.
// ---------------------------------------------------------------------------
// Canonical MCP JWT secret. Set process-wide at load time so that tokens
// minted by signMcpToken() always verify against the real middleware/auth,
// regardless of test-file load order or other files mutating the env.
export const MCP_TEST_SECRET = "test-backend-mcp-secret-1234567890";
if (!process.env.MCP_JWT_SECRET) {
  process.env.MCP_JWT_SECRET = MCP_TEST_SECRET;
}

export function signMcpToken(sub: string, role: string = "user"): string {
  const secret = process.env.MCP_JWT_SECRET || MCP_TEST_SECRET;
  const header = { alg: "HS256", typ: "JWT" };
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub,
    role,
    iat: now,
    exp: now + 3600,
    iss: "dolce-atelier-mcp",
    aud: "dolce-atelier-mcp",
  };
  const signingInput = `${b64(header)}.${b64(claims)}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${signingInput}.${sig}`;
}

export function adminAuthHeader(): Record<string, string> {
  return { authorization: `Bearer ${signMcpToken("admin_user", "admin")}` };
}

export function userAuthHeader(): Record<string, string> {
  return { authorization: `Bearer ${signMcpToken("u1", "user")}` };
}

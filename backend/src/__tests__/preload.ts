import { mock } from "bun:test";
import { stripeNpmMock } from "./helpers";

// Register npm-package mocks GLOBALLY and EARLY (via bunfig `[test] preload`)
// so they apply regardless of test-file load order. Several route tests import
// modules that construct real npm clients at module-eval time — e.g.
// `services/stripe.ts` runs `new Stripe(process.env.STRIPE_SECRET_KEY!)` at the
// top level. In CI there is no `.env`, so the real constructor throws and
// poisons the shared bun module registry for every later test (the 500s and
// missing tests seen remotely). Mocking these here first prevents that.

// `stripe` npm package: used by services/stripe.ts at module load.
mock.module("stripe", () => ({ default: stripeNpmMock }));

// `whatsapp-web.js` launches a real headless browser via puppeteer. Stub it so
// no test accidentally triggers a real client (which would hang or flip
// `isReady`), and so `services/whatsapp.ts` never touches the real package.
class ClientStub {
  on(): void {}
  initialize(): void {}
}
class LocalAuthStub {
  constructor(_opts?: any) {}
}
mock.module("whatsapp-web.js", () => ({
  Client: ClientStub,
  LocalAuth: LocalAuthStub,
  default: ClientStub,
}));

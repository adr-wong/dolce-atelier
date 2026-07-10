import { describe, it, expect, mock } from "bun:test";
import { mockModels } from "./helpers";

const { models } = mockModels();
const log = mock(async () => {});
mock.module("../models", () => models);
mock.module("../services/auditLog", () => ({ auditLogService: { log } }));

const { auditLogService } = await import("../services/auditLog");

describe("AuditLogService", () => {
  it("log writes without throwing", async () => {
    await expect(auditLogService.log({ action: "X", resource: "/x", method: "GET" })).resolves.toBeUndefined();
  });

  it("log accepts full metadata", async () => {
    await auditLogService.log({
      userId: "u1",
      action: "Y",
      resource: "/y",
      method: "POST",
      ip: "1.2.3.4",
      statusCode: 200,
      metadata: { a: 1 },
    });
    expect(log).toHaveBeenCalledTimes(2);
  });
});

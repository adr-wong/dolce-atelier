import { describe, expect, it, mock } from "bun:test";
import { log } from "../logger.js";

describe("log", () => {
  it("does not throw for info/warn/error levels", () => {
    expect(() => log("info", "hello")).not.toThrow();
    expect(() => log("warn", "careful")).not.toThrow();
    expect(() => log("error", "boom")).not.toThrow();
    expect(() => log("info", "with extra", { userId: "u1" })).not.toThrow();
  });

  it("routes error level to console.error", () => {
    const spy = mock(() => {});
    const original = console.error;
    // @ts-expect-error override for test
    console.error = spy;
    try {
      log("error", "oops", { code: 42 });
    } finally {
      console.error = original;
    }
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('"level":"error"');
    expect(output).toContain("oops");
    expect(output).toContain('"code":42');
  });

  it("routes non-error levels to console.log", () => {
    const spy = mock(() => {});
    const original = console.log;
    // @ts-expect-error override for test
    console.log = spy;
    try {
      log("info", "hi");
    } finally {
      console.log = original;
    }
    expect(spy).toHaveBeenCalledTimes(1);
    expect((spy.mock.calls[0][0] as string)).toContain('"level":"info"');
  });
});

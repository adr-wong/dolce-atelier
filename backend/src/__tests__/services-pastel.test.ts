import { describe, it, expect, mock } from "bun:test";
import { mockModels } from "./helpers";

const { state, models } = mockModels();
mock.module("../models", () => models);

const { pastelService } = await import("../services/pastel");

describe("PastelService", () => {
  it("listar defaults page/limit", async () => {
    state.findResult = [{ _id: "p1" }, { _id: "p2" }];
    state.countResult = 2;
    const r = await pastelService.listar({});
    expect(r.pasteles).toHaveLength(2);
    expect(r.page).toBe(1);
    expect(r.totalPages).toBe(1);
  });

  it("listar filters by categoria", async () => {
    state.findResult = [];
    state.countResult = 0;
    await pastelService.listar({ categoria: "chocolate" });
    expect(state.findResult).toEqual([]);
  });

  it("listar searches by q (regex)", async () => {
    state.findResult = [{ _id: "p1" }];
    state.countResult = 1;
    const r = await pastelService.listar({ q: "torta" });
    expect(r.pasteles).toHaveLength(1);
  });

  it("listar applies price range", async () => {
    state.findResult = [];
    state.countResult = 0;
    await pastelService.listar({ precioMin: 10, precioMax: 50 });
    expect(state.findResult).toEqual([]);
  });

  it("listar by page/limit", async () => {
    state.findResult = [];
    state.countResult = 30;
    const r = await pastelService.listar({ page: 3, limit: 10 });
    expect(r.page).toBe(3);
    expect(r.totalPages).toBe(3);
  });

  it("obtener by id", async () => {
    state.findByIdResult = { _id: "p1" };
    expect((await pastelService.obtener("p1"))?._id).toBe("p1");
  });

  it("crear validates and creates", async () => {
    state.createResult = { _id: "p1", nombre: "T" };
    const r = await pastelService.crear({ nombre: "T", precio: 10, categoria: "c", imagen: "http://x.com/i.png" });
    expect(r._id).toBe("p1");
  });

  it("crear throws on invalid data", async () => {
    await expect(pastelService.crear({ nombre: "", precio: -1 } as any)).rejects.toBeDefined();
  });

  it("actualizar validates and updates", async () => {
    state.findByIdAndUpdateResult = { _id: "p1", nombre: "T2" };
    const r = await pastelService.actualizar("p1", { nombre: "T2", precio: 20 });
    expect(r?.nombre).toBe("T2");
  });

  it("eliminar returns true when found", async () => {
    state.findByIdAndDeleteResult = { _id: "p1" };
    expect(await pastelService.eliminar("p1")).toBe(true);
  });

  it("eliminar returns false when missing", async () => {
    state.findByIdAndDeleteResult = null;
    expect(await pastelService.eliminar("p1")).toBe(false);
  });
});

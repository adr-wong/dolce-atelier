import { describe, it, expect, mock } from "bun:test";
import { mockModels } from "./helpers";

const { state, models } = mockModels();
mock.module("../models", () => models);

const { recetaService } = await import("../services/receta");

describe("RecetaService", () => {
  it("listarPorUsuario", async () => {
    state.findResult = [{ _id: "r1" }];
    const r = await recetaService.listarPorUsuario("u1");
    expect(r).toHaveLength(1);
  });

  it("listarTodos with estado", async () => {
    state.findResult = [{ _id: "r1" }, { _id: "r2" }];
    const r = await recetaService.listarTodos("PENDIENTE");
    expect(r).toHaveLength(2);
  });

  it("listarTodos without estado", async () => {
    state.findResult = [];
    const r = await recetaService.listarTodos();
    expect(r).toEqual([]);
  });

  it("obtener", async () => {
    state.findByIdResult = { _id: "r1" };
    expect((await recetaService.obtener("r1"))?._id).toBe("r1");
  });

  it("crear sets PENDIENTE", async () => {
    state.createResult = { _id: "r1", estado: "PENDIENTE" };
    const r = await recetaService.crear("u1", { nota: "x", personas: 2 });
    expect(r.estado).toBe("PENDIENTE");
  });

  it("actualizar validates", async () => {
    state.findByIdAndUpdateResult = { _id: "r1", estado: "COTIZADA" };
    const r = await recetaService.actualizar("r1", { estado: "COTIZADA", cotizacion: 10 });
    expect(r?.estado).toBe("COTIZADA");
  });

  it("cotizar sets COTIZADA", async () => {
    state.findByIdAndUpdateResult = { _id: "r1", estado: "COTIZADA" };
    const r = await recetaService.cotizar("r1", 50);
    expect(r?.estado).toBe("COTIZADA");
  });

  it("aceptar sets ACEPTADA", async () => {
    state.findByIdAndUpdateResult = { _id: "r1", estado: "ACEPTADA" };
    const r = await recetaService.aceptar("r1");
    expect(r?.estado).toBe("ACEPTADA");
  });

  it("contarPendientes", async () => {
    state.countResult = 4;
    expect(await recetaService.contarPendientes()).toBe(4);
  });
});

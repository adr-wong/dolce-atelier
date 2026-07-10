import { describe, it, expect, mock } from "bun:test";

const upload_stream = mock((_opts: any, cb: any) => {
  cb(null, { secure_url: "http://img/1" });
  return { end: () => {} };
});
const destroy = mock(async () => ({ result: "ok" }));

mock.module("cloudinary", () => ({
  v2: {
    config: () => {},
    uploader: { upload_stream, destroy },
  },
}));

const { subirImagen, subirReceta, eliminarImagen, extraerPublicId } =
  await import("../services/cloudinary");

describe("cloudinary service", () => {
  it("subirImagen uploads and returns url", async () => {
    const url = await subirImagen(Buffer.from([1, 2, 3]), "dolce-atelier/catalogo");
    expect(url).toBe("http://img/1");
    expect(upload_stream).toHaveBeenCalled();
  });

  it("subirReceta uploads raw and returns url", async () => {
    const url = await subirReceta(Buffer.from([9, 9]), "receta-1");
    expect(url).toBe("http://img/1");
  });

  it("eliminarImagen returns true on ok", async () => {
    expect(await eliminarImagen("public_id")).toBe(true);
  });

  it("eliminarImagen returns false otherwise", async () => {
    destroy.mockResolvedValueOnce({ result: "not found" });
    expect(await eliminarImagen("public_id")).toBe(false);
  });

  it("extraerPublicId extracts id", () => {
    expect(extraerPublicId("https://res.cloudinary.com/x/image/upload/v123/folder/abc.jpg")).toBe("folder/abc");
  });

  it("extraerPublicId returns null on no match", () => {
    expect(extraerPublicId("https://example.com/x.png")).toBeNull();
  });
});

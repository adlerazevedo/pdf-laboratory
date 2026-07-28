import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { applyEditorObjects } from "./editorExport";
import { nextObjectId, type EditorObject } from "./editorTypes";
import { OperationCancelledError, createCancelToken } from "./types";

// PNG sintético mínimo (1x1, vermelho) — nunca dados reais de usuário.
const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function tinyPngBytes(): Uint8Array {
  const binary = atob(TINY_PNG_B64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function makeSyntheticPdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`pagina sintetica ${i + 1}`, { x: 20, y: 350, size: 12, font });
  }
  return doc.save();
}

function baseObj(over: Partial<EditorObject>): EditorObject {
  return {
    id: nextObjectId(),
    pageIndex: 0,
    x: 10,
    y: 10,
    width: 50,
    height: 20,
    rotationDeg: 0,
    opacity: 1,
    zIndex: 1,
    ...over,
  } as EditorObject;
}

describe("applyEditorObjects", () => {
  it("preserva a contagem de paginas e produz um PDF valido (%PDF)", async () => {
    const bytes = await makeSyntheticPdf(3);
    const out = await applyEditorObjects(bytes, { objects: [] });
    const header = new TextDecoder().decode(out.slice(0, 5));
    expect(header).toBe("%PDF-");
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(3);
  });

  it("objeto de texto adiciona uma fonte aos recursos da pagina", async () => {
    const bytes = await makeSyntheticPdf(1);
    const objects: EditorObject[] = [
      baseObj({ kind: "text", text: "OBJETO NOVO", fontSize: 18, color: "#000000", font: "Helvetica", align: "left" } as EditorObject),
    ];
    const out = await applyEditorObjects(bytes, { objects });
    const result = await PDFDocument.load(out);
    const page = result.getPages()[0];
    const resources = page.node.get(PDFName.of("Resources"));
    expect(resources).toBeInstanceOf(PDFDict);
    const fontDict = (resources as PDFDict).get(PDFName.of("Font"));
    expect(fontDict).toBeInstanceOf(PDFDict);
  });

  it("objeto de imagem incorpora um XObject nos recursos da pagina", async () => {
    const bytes = await makeSyntheticPdf(1);
    const objects: EditorObject[] = [
      baseObj({
        kind: "image",
        bytes: tinyPngBytes(),
        mimeType: "image/png",
        previewUrl: "",
        width: 30,
        height: 30,
      } as EditorObject),
    ];
    const out = await applyEditorObjects(bytes, { objects });
    const result = await PDFDocument.load(out);
    const page = result.getPages()[0];
    const resources = page.node.get(PDFName.of("Resources")) as PDFDict;
    const xobjects = resources.get(PDFName.of("XObject"));
    expect(xobjects).toBeInstanceOf(PDFDict);
  });

  it("objeto de link cria uma anotacao Link com a URI correta", async () => {
    const bytes = await makeSyntheticPdf(1);
    const objects: EditorObject[] = [baseObj({ kind: "link", url: "https://example.org/teste", label: "teste" } as EditorObject)];
    const out = await applyEditorObjects(bytes, { objects });
    const result = await PDFDocument.load(out);
    const page = result.getPages()[0];
    const annots = page.node.get(PDFName.of("Annots"));
    expect(annots).toBeInstanceOf(PDFArray);
    const ref = (annots as PDFArray).get(0) as PDFRef;
    const annotDict = result.context.lookup(ref) as PDFDict;
    const action = annotDict.get(PDFName.of("A")) as PDFDict;
    const uri = action.get(PDFName.of("URI"));
    expect(uri?.toString()).toContain("example.org/teste");
  });

  it("retangulo com cantos arredondados nao quebra a geracao (drawSvgPath)", async () => {
    const bytes = await makeSyntheticPdf(1);
    const objects: EditorObject[] = [
      baseObj({ kind: "rect", fill: "#00ff00", stroke: null, strokeWidth: 0, cornerRadius: 6 } as EditorObject),
    ];
    const out = await applyEditorObjects(bytes, { objects });
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(1);
  });

  it("respeita o cancelamento e lanca OperationCancelledError", async () => {
    const bytes = await makeSyntheticPdf(1);
    const token = createCancelToken();
    token.cancelled = true;
    const objects: EditorObject[] = [baseObj({ kind: "rect", fill: "#000000", stroke: null, strokeWidth: 0, cornerRadius: 0 } as EditorObject)];
    await expect(applyEditorObjects(bytes, { objects }, undefined, token)).rejects.toThrow(OperationCancelledError);
  });

  it("objetos em pagina inexistente sao ignorados sem lancar erro", async () => {
    const bytes = await makeSyntheticPdf(1);
    const objects: EditorObject[] = [baseObj({ kind: "rect", pageIndex: 5, fill: "#000000", stroke: null, strokeWidth: 0, cornerRadius: 0 } as EditorObject)];
    const out = await applyEditorObjects(bytes, { objects });
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(1);
  });
});

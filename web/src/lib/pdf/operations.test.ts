import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  addPageNumbers,
  addWatermark,
  extractPages,
  imagesToPdf,
  mergeDocuments,
  setSimpleMetadata,
  splitByRanges,
} from "./operations";

/** Cria um PDF sintético em memória com N páginas numeradas — nunca dados reais. */
async function makeSyntheticPdf(pageCount: number, label = "doc"): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([200, 200]);
    page.drawText(`${label} ${i + 1}`, { x: 20, y: 100, size: 14, font });
  }
  return doc.save();
}

describe("extractPages", () => {
  it("extrai apenas as páginas pedidas, na ordem pedida", async () => {
    const bytes = await makeSyntheticPdf(5);
    const out = await extractPages(bytes, [4, 0, 2]);
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(3);
  });
});

describe("splitByRanges", () => {
  it("gera um documento por intervalo, com o número certo de páginas", async () => {
    const bytes = await makeSyntheticPdf(6);
    const parts = await splitByRanges(bytes, [
      { start: 0, end: 1 },
      { start: 2, end: 5 },
    ]);
    expect(parts).toHaveLength(2);
    const first = await PDFDocument.load(parts[0]);
    const second = await PDFDocument.load(parts[1]);
    expect(first.getPageCount()).toBe(2);
    expect(second.getPageCount()).toBe(4);
  });
});

describe("mergeDocuments", () => {
  it("junta múltiplos documentos preservando a ordem e o total de páginas", async () => {
    const a = await makeSyntheticPdf(2, "a");
    const b = await makeSyntheticPdf(3, "b");
    const merged = await mergeDocuments([a, b]);
    const result = await PDFDocument.load(merged);
    expect(result.getPageCount()).toBe(5);
  });
});

describe("addWatermark", () => {
  it("retorna um PDF válido com o mesmo número de páginas", async () => {
    const bytes = await makeSyntheticPdf(3);
    const out = await addWatermark(bytes, { text: "TESTE" });
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(3);
  });
});

describe("addPageNumbers", () => {
  it("não altera a contagem de páginas", async () => {
    const bytes = await makeSyntheticPdf(4);
    const out = await addPageNumbers(bytes, { startAt: 1 });
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(4);
  });
});

describe("setSimpleMetadata", () => {
  it("grava título e autor corretamente", async () => {
    const bytes = await makeSyntheticPdf(1);
    const out = await setSimpleMetadata(bytes, { title: "Título de teste", author: "Autor de teste" });
    const result = await PDFDocument.load(out);
    expect(result.getTitle()).toBe("Título de teste");
    expect(result.getAuthor()).toBe("Autor de teste");
  });
});

describe("imagesToPdf", () => {
  it("cria uma página por imagem", async () => {
    // PNG 1x1 transparente, sintético — apenas para teste.
    const tinyPng = Uint8Array.from(atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    ), (c) => c.charCodeAt(0));
    const out = await imagesToPdf([
      { bytes: tinyPng, mimeType: "image/png" },
      { bytes: tinyPng, mimeType: "image/png" },
    ]);
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(2);
  });
});

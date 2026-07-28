import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  addAttachments,
  addBatesNumbering,
  addInternalLinks,
  batesLabelForPage,
  readBookmarks,
  setBookmarks,
  setPageBoxes,
} from "./pageAdvanced";
import { OperationCancelledError, createCancelToken } from "./types";

async function makeSyntheticPdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`pagina sintetica ${i + 1}`, { x: 20, y: 350, size: 12, font });
  }
  return doc.save();
}

describe("setPageBoxes", () => {
  it("aplica margens de corte via CropBox sem alterar o tamanho nominal da pagina (MediaBox)", async () => {
    const bytes = await makeSyntheticPdf(2);
    const out = await setPageBoxes(bytes, { pageIndices: [0], cropMarginsPt: { top: 10, right: 10, bottom: 10, left: 10 } });
    const doc = await PDFDocument.load(out);
    const page = doc.getPages()[0];
    expect(page.getSize()).toEqual({ width: 300, height: 400 });
    const cropBox = page.node.CropBox();
    if (!cropBox) throw new Error("CropBox ausente");
    const asNum = (i: number) => (cropBox.get(i) as unknown as { asNumber(): number }).asNumber();
    expect(asNum(2) - asNum(0)).toBeCloseTo(280);
    expect(asNum(3) - asNum(1)).toBeCloseTo(380);
  });

  it("redimensiona a MediaBox quando mediaBoxScale e informado", async () => {
    const bytes = await makeSyntheticPdf(1);
    const out = await setPageBoxes(bytes, { pageIndices: [], mediaBoxScale: 2 });
    const doc = await PDFDocument.load(out);
    const page = doc.getPages()[0];
    expect(page.getSize()).toEqual({ width: 600, height: 800 });
  });

  it("respeita o cancelamento", async () => {
    const bytes = await makeSyntheticPdf(3);
    const token = createCancelToken();
    token.cancelled = true;
    await expect(setPageBoxes(bytes, { pageIndices: [] }, undefined, token)).rejects.toThrow(OperationCancelledError);
  });
});

describe("addBatesNumbering", () => {
  it("gera rotulos sequenciais com zeros a esquerda, coerentes com batesLabelForPage", async () => {
    const bytes = await makeSyntheticPdf(3);
    const options = { prefix: "ABC", startNumber: 100, digits: 6 } as const;
    const out = await addBatesNumbering(bytes, options);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(3);
    expect(batesLabelForPage(options, 0)).toBe("ABC000100");
    expect(batesLabelForPage(options, 2)).toBe("ABC000102");
  });
});

describe("addAttachments", () => {
  it("incorpora o arquivo anexado na arvore Names/EmbeddedFiles do catalogo", async () => {
    const bytes = await makeSyntheticPdf(1);
    const attachmentText = "conteudo sintetico de teste";
    const attachmentBytes = new Uint8Array(attachmentText.length);
    for (let i = 0; i < attachmentText.length; i++) attachmentBytes[i] = attachmentText.charCodeAt(i);
    const out = await addAttachments(bytes, [{ fileName: "nota-teste.txt", bytes: attachmentBytes, mimeType: "text/plain", description: "Anexo sintetico" }]);
    const doc = await PDFDocument.load(out);
    const namesRef = doc.catalog.get(PDFName.of("Names"));
    expect(namesRef).toBeInstanceOf(PDFDict);
    const embeddedFiles = (namesRef as PDFDict).get(PDFName.of("EmbeddedFiles"));
    expect(embeddedFiles).toBeInstanceOf(PDFDict);
  });
});

describe("setBookmarks / readBookmarks", () => {
  it("grava marcadores e os le de volta na mesma ordem e com as paginas corretas", async () => {
    const bytes = await makeSyntheticPdf(3);
    const bookmarks = [
      { title: "Inicio", pageIndex: 0 },
      { title: "Meio", pageIndex: 1 },
      { title: "Fim", pageIndex: 2 },
    ];
    const out = await setBookmarks(bytes, bookmarks);
    const readBack = await readBookmarks(out);
    expect(readBack).toEqual(bookmarks);
  });

  it("uma lista vazia remove os marcadores existentes", async () => {
    const bytes = await makeSyntheticPdf(2);
    const withBookmarks = await setBookmarks(bytes, [{ title: "X", pageIndex: 0 }]);
    const cleared = await setBookmarks(withBookmarks, []);
    const readBack = await readBookmarks(cleared);
    expect(readBack).toEqual([]);
  });
});

describe("addInternalLinks", () => {
  it("cria uma anotacao Link cujo Dest aponta para a referencia da pagina de destino", async () => {
    const bytes = await makeSyntheticPdf(3);
    const out = await addInternalLinks(bytes, [{ pageIndex: 0, x: 10, y: 10, width: 50, height: 20, targetPageIndex: 2 }]);
    const doc = await PDFDocument.load(out);
    const pages = doc.getPages();
    const annots = pages[0].node.get(PDFName.of("Annots"));
    expect(annots).toBeInstanceOf(PDFArray);
    const ref = (annots as PDFArray).get(0) as PDFRef;
    const annotDict = doc.context.lookup(ref) as PDFDict;
    const dest = annotDict.get(PDFName.of("Dest")) as PDFArray;
    const destPageRef = dest.get(0);
    expect(destPageRef).toBe(pages[2].ref);
  });

  it("ignora links cuja pagina de origem ou destino nao existe, sem lancar erro", async () => {
    const bytes = await makeSyntheticPdf(1);
    const out = await addInternalLinks(bytes, [{ pageIndex: 5, x: 0, y: 0, width: 10, height: 10, targetPageIndex: 0 }]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
  });
});

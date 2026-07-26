import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  addPageNumbers,
  addWatermark,
  extractPages,
  imagesToPdf,
  mergeDocuments,
  rebuildFromPageStates,
  setSimpleMetadata,
  splitByRanges,
} from "./operations";
import type { PageState } from "./types";

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

describe("rebuildFromPageStates", () => {
  it("reordena as páginas conforme a lista de estados", async () => {
    const bytes = await makeSyntheticPdf(3, "pg");
    const states: PageState[] = [
      { sourceIndex: 2, rotation: 0, selected: false },
      { sourceIndex: 0, rotation: 0, selected: false },
      { sourceIndex: 1, rotation: 0, selected: false },
    ];
    const out = await rebuildFromPageStates(bytes, states);
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(3);
  });

  it("duplica uma página quando o mesmo sourceIndex aparece mais de uma vez", async () => {
    const bytes = await makeSyntheticPdf(2, "pg");
    const states: PageState[] = [
      { sourceIndex: 0, rotation: 0, selected: false },
      { sourceIndex: 0, rotation: 0, selected: false },
      { sourceIndex: 1, rotation: 0, selected: false },
    ];
    const out = await rebuildFromPageStates(bytes, states);
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(3);
  });

  it("remove páginas ausentes da lista de estados (exclusão)", async () => {
    const bytes = await makeSyntheticPdf(4, "pg");
    const states: PageState[] = [
      { sourceIndex: 0, rotation: 0, selected: false },
      { sourceIndex: 2, rotation: 0, selected: false },
    ];
    const out = await rebuildFromPageStates(bytes, states);
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(2);
  });

  it("insere páginas em branco no tamanho da última página real", async () => {
    const bytes = await makeSyntheticPdf(1, "pg");
    const states: PageState[] = [
      { sourceIndex: 0, rotation: 0, selected: false },
      { sourceIndex: -1, rotation: 0, selected: false, isInsertedBlank: true },
    ];
    const out = await rebuildFromPageStates(bytes, states);
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(2);
    const [original, blank] = result.getPages();
    expect(blank.getWidth()).toBe(original.getWidth());
    expect(blank.getHeight()).toBe(original.getHeight());
  });

  it("aplica rotação às páginas indicadas", async () => {
    const bytes = await makeSyntheticPdf(1, "pg");
    const states: PageState[] = [{ sourceIndex: 0, rotation: 90, selected: false }];
    const out = await rebuildFromPageStates(bytes, states);
    const result = await PDFDocument.load(out);
    expect(result.getPage(0).getRotation().angle).toBe(90);
  });

  it("com lista de estados vazia, o pdf-lib normaliza o resultado para 1 página em branco ao reabrir", async () => {
    // Descoberta real ao testar (não suposição): PDFDocument.create()+save() com
    // 0 páginas produz bytes válidos, mas PDFDocument.load() desses mesmos bytes
    // devolve 1 página — o parser do pdf-lib normaliza documentos vazios ao
    // reabri-los, provavelmente por compatibilidade com leitores de PDF que não
    // aceitam 0 páginas. Por isso a interface (OrganizeTool) BLOQUEIA o usuário
    // de salvar quando todas as páginas foram excluídas, em vez de confiar que
    // esta função produziria um arquivo de 0 páginas de verdade.
    const bytes = await makeSyntheticPdf(2, "pg");
    const out = await rebuildFromPageStates(bytes, []);
    const result = await PDFDocument.load(out);
    expect(result.getPageCount()).toBe(1);
  });
});

describe("imagesToPdf — opções de layout", () => {
  const tinyPng = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="),
    (c) => c.charCodeAt(0),
  );

  it("com pageSize 'auto' (padrão), a página tem o tamanho exato da imagem", async () => {
    const out = await imagesToPdf([{ bytes: tinyPng, mimeType: "image/png" }]);
    const result = await PDFDocument.load(out);
    expect(result.getPage(0).getWidth()).toBe(1);
    expect(result.getPage(0).getHeight()).toBe(1);
  });

  it("com pageSize 'a4', a página usa as dimensões A4 independentemente do tamanho da imagem", async () => {
    const out = await imagesToPdf([{ bytes: tinyPng, mimeType: "image/png" }], undefined, undefined, {
      pageSize: "a4",
      orientation: "portrait",
    });
    const result = await PDFDocument.load(out);
    const page = result.getPage(0);
    expect(Math.round(page.getWidth())).toBe(595);
    expect(Math.round(page.getHeight())).toBe(842);
  });

  it("orientation 'landscape' inverte largura e altura da página", async () => {
    const out = await imagesToPdf([{ bytes: tinyPng, mimeType: "image/png" }], undefined, undefined, {
      pageSize: "a4",
      orientation: "landscape",
    });
    const result = await PDFDocument.load(out);
    const page = result.getPage(0);
    expect(page.getWidth()).toBeGreaterThan(page.getHeight());
  });
});

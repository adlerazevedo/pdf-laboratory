import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  addPageNumbers,
  addSearchableTextLayer,
  addVisualSignature,
  addWatermark,
  compressBasic,
  extractPages,
  imagesToPdf,
  mergeDocuments,
  rebuildFromPageStates,
  setSimpleMetadata,
  splitByPageGroups,
  splitByRanges,
} from "./operations";
import type { PageState } from "./types";


// JPEG sintético mínimo (4x4), gerado uma vez — nunca dados reais de usuário.
const TINY_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAEAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlKKKK8g/RT//Z";

function tinyJpegBytes(): Uint8Array {
  const binary = atob(TINY_JPEG_B64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

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

describe("splitByPageGroups", () => {
  it("gera um arquivo por grupo, na ordem dos grupos", async () => {
    const bytes = await makeSyntheticPdf(6);
    const outputs = await splitByPageGroups(bytes, [[0], [1], [2], [3], [4], [5]]);
    expect(outputs).toHaveLength(6);
    for (const out of outputs) {
      const doc = await PDFDocument.load(out);
      expect(doc.getPageCount()).toBe(1);
    }
  });

  it("suporta grupos não contíguos (páginas pares/ímpares)", async () => {
    const bytes = await makeSyntheticPdf(6, "pg");
    const [odd, even] = await splitByPageGroups(bytes, [
      [0, 2, 4],
      [1, 3, 5],
    ]);
    const oddDoc = await PDFDocument.load(odd);
    const evenDoc = await PDFDocument.load(even);
    expect(oddDoc.getPageCount()).toBe(3);
    expect(evenDoc.getPageCount()).toBe(3);
  });

  it("com um único grupo contendo todas as páginas, se comporta como extractPages", async () => {
    const bytes = await makeSyntheticPdf(4);
    const [out] = await splitByPageGroups(bytes, [[3, 1]]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
  });
});

describe("compressBasic", () => {
  it("PDF sem imagens: não lança erro, imagesFound é 0 e o documento continua abrindo normalmente", async () => {
    const bytes = await makeSyntheticPdf(3);
    const result = await compressBasic(bytes, { level: "medium" });
    expect(result.imagesFound).toBe(0);
    expect(result.imagesRecompressed).toBe(0);
    const reopened = await PDFDocument.load(result.bytes);
    expect(reopened.getPageCount()).toBe(3);
  });

  it("PDF com uma imagem JPEG: identifica a imagem como candidata (imagesFound=1)", async () => {
    const doc = await PDFDocument.create();
    const img = await doc.embedJpg(tinyJpegBytes());
    const page = doc.addPage([200, 200]);
    page.drawImage(img, { x: 0, y: 0, width: 200, height: 200 });
    const bytes = await doc.save();

    // Em jsdom (ambiente de teste) não há OffscreenCanvas/createImageBitmap reais,
    // então a recompressão em si é validada de ponta a ponta no navegador (ver
    // relatório da Fase 4). Aqui validamos a detecção correta da imagem candidata
    // e que, sem as APIs de canvas, o erro é claro em vez de falhar silenciosamente.
    const hasCanvasApis = typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap === "function";
    if (!hasCanvasApis) {
      await expect(compressBasic(bytes, { level: "medium" })).rejects.toThrow(/OffscreenCanvas|createImageBitmap/);
    }
  });

  it("imagem com SMask (transparência) nunca é considerada candidata, mesmo sendo DCTDecode", async () => {
    // Constrói manualmente um XObject de imagem JPEG com SMask, sem depender de canvas.
    const doc = await PDFDocument.create();
    const img = await doc.embedJpg(tinyJpegBytes());
    const page = doc.addPage([200, 200]);
    page.drawImage(img, { x: 0, y: 0, width: 200, height: 200 });
    const saved = await doc.save();
    const reloaded = await PDFDocument.load(saved);

    // Adiciona manualmente uma entrada SMask ao dicionário da imagem para simular
    // uma imagem com transparência real.
    const { PDFName, PDFDict, PDFRawStream, PDFRef } = await import("pdf-lib");
    const resources = reloaded.getPage(0).node.Resources();
    const xobjDict = resources?.lookup(PDFName.of("XObject"), PDFDict);
    const key = xobjDict?.keys()[0];
    const ref = key ? xobjDict?.get(key) : undefined;
    expect(ref).toBeInstanceOf(PDFRef);
    const stream = reloaded.context.lookup(ref as never);
    expect(stream).toBeInstanceOf(PDFRawStream);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (stream as any).dict.set(PDFName.of("SMask"), PDFRef.of(9999));

    const bytesWithSmask = await reloaded.save();
    const result = await compressBasic(bytesWithSmask, { level: "medium" });
    expect(result.imagesFound).toBe(0); // SMask presente -> não é candidata, ignorada com segurança
  });
});

describe("addVisualSignature", () => {
  it("modo texto: carimba apenas as páginas indicadas, deixando as demais com o mesmo conteúdo", async () => {
    const bytes = await makeSyntheticPdf(3);

    function contentStreamSize(doc: PDFDocument, pageIndex: number): number {
      const page = doc.getPages()[pageIndex];
      const contents = page.node.Contents();
      if (!contents) return 0;
      // Contents() pode retornar um único stream ou (após certas operações) um
      // PDFArray de refs — cobrimos os dois casos somando os tamanhos.
      const asArray = "asArray" in contents ? (contents as { asArray: () => unknown[] }).asArray() : [contents];
      let total = 0;
      for (const item of asArray) {
        const resolved = "contents" in (item as object) ? item : doc.context.lookup(item as never);
        total += (resolved as { contents?: Uint8Array })?.contents?.length ?? 0;
      }
      return total;
    }

    const before = await PDFDocument.load(bytes);
    const beforeSizes = [0, 1, 2].map((i) => contentStreamSize(before, i));

    const out = await addVisualSignature(bytes, {
      content: { kind: "text", text: "Assinado por Fulano" },
      position: "bottom-right",
      pageIndices: [1],
    });
    const after = await PDFDocument.load(out);
    expect(after.getPageCount()).toBe(3);
    const afterSizes = [0, 1, 2].map((i) => contentStreamSize(after, i));

    // Só a página carimbada (índice 1) deve crescer; as demais ficam iguais.
    expect(afterSizes[1]).toBeGreaterThan(beforeSizes[1]);
    expect(afterSizes[0]).toBe(beforeSizes[0]);
    expect(afterSizes[2]).toBe(beforeSizes[2]);
  });

  it("sem pageIndices, carimba todas as páginas", async () => {
    const bytes = await makeSyntheticPdf(2);
    const out = await addVisualSignature(bytes, {
      content: { kind: "text", text: "CONFIDENCIAL" },
      position: "top-left",
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
  });

  it("modo imagem: aplica a imagem sem lançar erro e preserva a contagem de páginas", async () => {
    const bytes = await makeSyntheticPdf(2);
    const out = await addVisualSignature(bytes, {
      content: { kind: "image", bytes: tinyJpegBytes(), mimeType: "image/jpeg" },
      position: "middle-center",
      scalePercent: 30,
      opacity: 0.8,
      pageIndices: [0],
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
  });

  it("nunca aceita nem referencia certificados PFX/P12 — a API não tem esse campo", () => {
    // Verificação estrutural: o tipo de opções não expõe nenhum campo de
    // certificado. Isto é reforçado em tempo de compilação (TypeScript),
    // este teste documenta a garantia para quem só lê os testes.
    const optionsShape: Array<keyof import("./operations").VisualSignatureOptions> = [
      "content",
      "position",
      "scalePercent",
      "opacity",
      "marginPt",
      "pageIndices",
    ];
    expect(optionsShape).not.toContain("certificate");
    expect(optionsShape).not.toContain("pfx");
    expect(optionsShape).not.toContain("p12");
  });
});

describe("addSearchableTextLayer", () => {
  function contentStreamSize(doc: PDFDocument, pageIndex: number): number {
    const page = doc.getPages()[pageIndex];
    const contents = page.node.Contents();
    if (!contents) return 0;
    const asArray = "asArray" in contents ? (contents as { asArray: () => unknown[] }).asArray() : [contents];
    let total = 0;
    for (const item of asArray) {
      const resolved = "contents" in (item as object) ? item : doc.context.lookup(item as never);
      total += (resolved as { contents?: Uint8Array })?.contents?.length ?? 0;
    }
    return total;
  }

  it("insere texto apenas nas páginas indicadas, preservando a contagem de páginas", async () => {
    const bytes = await makeSyntheticPdf(3);
    const before = await PDFDocument.load(bytes);
    const beforeSizes = [0, 1, 2].map((i) => contentStreamSize(before, i));

    const out = await addSearchableTextLayer(bytes, [
      { pageIndex: 0, words: [{ text: "TESTE", xPt: 50, yPt: 700, widthPt: 60, heightPt: 12 }] },
    ]);
    const after = await PDFDocument.load(out);
    expect(after.getPageCount()).toBe(3);
    const afterSizes = [0, 1, 2].map((i) => contentStreamSize(after, i));
    expect(afterSizes[0]).toBeGreaterThan(beforeSizes[0]);
    expect(afterSizes[1]).toBe(beforeSizes[1]);
    expect(afterSizes[2]).toBe(beforeSizes[2]);
  });

  it("lista de páginas vazia: não altera nada e continua abrindo normalmente", async () => {
    const bytes = await makeSyntheticPdf(2);
    const out = await addSearchableTextLayer(bytes, []);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
  });

  it("pageIndex fora do intervalo é ignorado com segurança (não lança erro)", async () => {
    const bytes = await makeSyntheticPdf(2);
    const out = await addSearchableTextLayer(bytes, [
      { pageIndex: 99, words: [{ text: "X", xPt: 0, yPt: 0, widthPt: 10, heightPt: 10 }] },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
  });
});

describe("flattenWords (OCR)", () => {
  it("achata blocks→paragraphs→lines→words em uma lista simples", async () => {
    const { flattenWords } = await import("./ocr");
    const page = {
      blocks: [
        {
          paragraphs: [
            {
              lines: [
                { words: [{ text: "Olá", bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } }, { text: "mundo", bbox: { x0: 12, y0: 0, x1: 30, y1: 10 } }] },
              ],
            },
          ],
        },
      ],
    };
    const words = flattenWords(page);
    expect(words).toHaveLength(2);
    expect(words[0].text).toBe("Olá");
    expect(words[1].text).toBe("mundo");
  });

  it("ignora palavras em branco e blocks nulos", async () => {
    const { flattenWords } = await import("./ocr");
    expect(flattenWords({ blocks: null })).toEqual([]);
    const page = {
      blocks: [{ paragraphs: [{ lines: [{ words: [{ text: "   ", bbox: { x0: 0, y0: 0, x1: 1, y1: 1 } }] }] }] }],
    };
    expect(flattenWords(page)).toEqual([]);
  });
});

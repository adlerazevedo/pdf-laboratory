import { PDFDict, PDFDocument, PDFName, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { applyRedactionRaster, detectSensitivePatterns, type TextItemInput } from "./redaction";

// PNG sintético mínimo (1x1, preto) — nunca dados reais de usuário.
const TINY_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function tinyPngBytes(): Uint8Array {
  const binary = atob(TINY_PNG_B64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function makeSyntheticPdf(pageTexts: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const text of pageTexts) {
    const page = doc.addPage([300, 400]);
    page.drawText(text, { x: 20, y: 350, size: 12, font });
  }
  return doc.save();
}

describe("detectSensitivePatterns", () => {
  it("detecta CPF, CNPJ, e-mail e telefone sintéticos em um mesmo item", () => {
    const items: TextItemInput[] = [
      { pageIndex: 0, str: "CPF 111.222.333-44 email teste@exemplo.com", xPt: 10, yPt: 10, widthPt: 300, heightPt: 12 },
      { pageIndex: 1, str: "CNPJ 12.345.678/0001-99 tel (11) 91234-5678", xPt: 5, yPt: 5, widthPt: 300, heightPt: 12 },
    ];
    const hits = detectSensitivePatterns(items);
    const kinds = hits.map((h) => h.kind).sort();
    expect(kinds).toEqual(["cnpj", "cpf", "email", "telefone"].sort());
    expect(hits.find((h) => h.kind === "cpf")?.matchText).toBe("111.222.333-44");
    expect(hits.find((h) => h.kind === "email")?.matchText).toBe("teste@exemplo.com");
  });

  it("nao gera falso positivo em texto sem nenhum padrao sensivel", () => {
    const items: TextItemInput[] = [{ pageIndex: 0, str: "Este e um texto publico sem dados sensiveis.", xPt: 0, yPt: 0, widthPt: 200, heightPt: 12 }];
    expect(detectSensitivePatterns(items)).toEqual([]);
  });

  it("a caixa delimitadora da ocorrencia fica dentro da largura do item de origem", () => {
    const items: TextItemInput[] = [{ pageIndex: 0, str: "prefixo 111.222.333-44 sufixo", xPt: 100, yPt: 50, widthPt: 290, heightPt: 12 }];
    const [hit] = detectSensitivePatterns(items);
    expect(hit.rect.xPt).toBeGreaterThanOrEqual(100);
    expect(hit.rect.xPt + hit.rect.widthPt).toBeLessThanOrEqual(100 + 290 + 0.01);
  });
});

describe("applyRedactionRaster", () => {
  it("substitui apenas as paginas marcadas — o texto original delas desaparece, as demais permanecem intactas", async () => {
    const bytes = await makeSyntheticPdf(["PAGINA COM DADO SENSIVEL 111.222.333-44", "pagina publica sem alteracao"]);
    const out = await applyRedactionRaster(bytes, {
      replacements: [{ pageIndex: 0, pngBytes: tinyPngBytes(), widthPt: 300, heightPt: 400 }],
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);

    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjsLib.getDocument({ data: out, useWorkerFetch: false, isEvalSupported: false });
    const jsDoc = await loadingTask.promise;

    const redactedPage = await jsDoc.getPage(1);
    const redactedContent = await redactedPage.getTextContent();
    expect(redactedContent.items).toHaveLength(0);

    const untouchedPage = await jsDoc.getPage(2);
    const untouchedContent = await untouchedPage.getTextContent();
    const untouchedText = untouchedContent.items.map((it: unknown) => (it as { str?: string }).str ?? "").join(" ");
    expect(untouchedText).toContain("pagina publica sem alteracao");
  });

  it("limpa metadados, anotacoes e anexos quando solicitado", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([300, 400]);
    page.drawText("conteudo", { x: 10, y: 10, size: 10, font });
    doc.setTitle("Titulo sensivel");
    doc.setAuthor("Autor sensivel");
    await doc.attach(new Uint8Array([1, 2, 3]), "anexo-sensivel.bin");
    const bytesWithMeta = await doc.save();

    const out = await applyRedactionRaster(bytesWithMeta, {
      replacements: [],
      clearMetadata: true,
      clearAnnotations: true,
      clearAttachments: true,
    });
    const result = await PDFDocument.load(out);
    expect(result.getTitle()).toBe("");
    expect(result.getAuthor()).toBe("");
    const namesRef = result.catalog.get(PDFName.of("Names"));
    const names = namesRef ? result.context.lookup(namesRef, PDFDict) : undefined;
    const embeddedFiles = names?.get(PDFName.of("EmbeddedFiles"));
    expect(embeddedFiles).toBeUndefined();
  });

  it("sem nenhuma substituicao, todas as paginas mantem o conteudo pesquisavel original", async () => {
    const bytes = await makeSyntheticPdf(["texto original preservado"]);
    const out = await applyRedactionRaster(bytes, { replacements: [] });
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjsLib.getDocument({ data: out, useWorkerFetch: false, isEvalSupported: false });
    const jsDoc = await loadingTask.promise;
    const page = await jsDoc.getPage(1);
    const content = await page.getTextContent();
    const text = content.items.map((it: unknown) => (it as { str?: string }).str ?? "").join(" ");
    expect(text).toContain("texto original preservado");
  });
});

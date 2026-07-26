import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import type { CancelToken, OperationProgress, PageState, SimpleMetadata } from "./types";
import { OperationCancelledError } from "./types";

type ProgressCallback = (progress: OperationProgress) => void;

function checkCancelled(token?: CancelToken): void {
  if (token?.cancelled) throw new OperationCancelledError();
}

function report(cb: ProgressCallback | undefined, done: number, total: number, stage: string): void {
  cb?.({ done, total, stage });
}

async function loadForEditing(bytes: Uint8Array): Promise<PDFDocument> {
  // updateMetadata:false preserva metadados originais até serem explicitamente alterados.
  return PDFDocument.load(bytes, { updateMetadata: false });
}

/**
 * Extrai um subconjunto de páginas (0-based, na ordem informada) para um
 * novo documento. Base para dividir, extrair e reordenar.
 */
export async function extractPages(
  bytes: Uint8Array,
  pageIndices: number[],
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  report(onProgress, 0, pageIndices.length, "Preparando");
  const source = await loadForEditing(bytes);
  const result = await PDFDocument.create();
  const copied = await result.copyPages(source, pageIndices);
  copied.forEach((page, i) => {
    checkCancelled(cancelToken);
    result.addPage(page);
    report(onProgress, i + 1, pageIndices.length, "Copiando páginas");
  });
  const out = await result.save();
  report(onProgress, pageIndices.length, pageIndices.length, "Concluído");
  return out;
}

/** Divide o documento em múltiplos arquivos, um por intervalo de páginas (0-based, fim inclusivo). */
export async function splitByRanges(
  bytes: Uint8Array,
  ranges: Array<{ start: number; end: number }>,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array[]> {
  const outputs: Uint8Array[] = [];
  for (let i = 0; i < ranges.length; i++) {
    checkCancelled(cancelToken);
    const { start, end } = ranges[i];
    const indices = Array.from({ length: end - start + 1 }, (_, k) => start + k);
    const doc = await extractPages(bytes, indices);
    outputs.push(doc);
    report(onProgress, i + 1, ranges.length, `Gerando parte ${i + 1} de ${ranges.length}`);
  }
  return outputs;
}

/** Junta múltiplos PDFs, na ordem informada, em um único documento. */
export async function mergeDocuments(
  documents: Uint8Array[],
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const result = await PDFDocument.create();
  for (let i = 0; i < documents.length; i++) {
    checkCancelled(cancelToken);
    const source = await loadForEditing(documents[i]);
    const pages = await result.copyPages(source, source.getPageIndices());
    pages.forEach((page) => result.addPage(page));
    report(onProgress, i + 1, documents.length, `Adicionando documento ${i + 1} de ${documents.length}`);
  }
  return result.save();
}

/**
 * Reconstrói o documento a partir de uma lista de estados de página —
 * cobre reordenar, girar, excluir (páginas ausentes da lista) e duplicar
 * (mesmo sourceIndex repetido) em uma única passada. Páginas em branco
 * inseridas (isInsertedBlank) são criadas no tamanho da última página real.
 */
export async function rebuildFromPageStates(
  bytes: Uint8Array,
  pages: PageState[],
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const source = await loadForEditing(bytes);
  const result = await PDFDocument.create();
  const realIndices = pages
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !p.isInsertedBlank)
    .map(({ p }) => p.sourceIndex);
  const copiedBySourceIndex = new Map<number, number>();
  if (realIndices.length > 0) {
    const uniqueIndices = Array.from(new Set(realIndices));
    const copied = await result.copyPages(source, uniqueIndices);
    uniqueIndices.forEach((sourceIndex, k) => {
      // Guarda a página copiada para reaproveitar em caso de duplicação.
      copiedBySourceIndex.set(sourceIndex, k);
      result.addPage(copied[k]);
    });
  }
  // Neste ponto todas as páginas reais únicas já estão no documento, na ordem
  // de primeira aparição. Como a ordem final pode diferir e incluir
  // duplicatas/brancos, reconstruímos a ordem correta abaixo.
  const ordered = await PDFDocument.create();
  let lastKnownSize: [number, number] = [612, 792]; // fallback US Letter em pontos
  for (let i = 0; i < pages.length; i++) {
    checkCancelled(cancelToken);
    const state = pages[i];
    if (state.isInsertedBlank) {
      ordered.addPage(lastKnownSize);
    } else {
      const [copiedPage] = await ordered.copyPages(result, [copiedBySourceIndex.get(state.sourceIndex)!]);
      const page = ordered.addPage(copiedPage);
      lastKnownSize = [page.getWidth(), page.getHeight()];
      if (state.rotation) page.setRotation(degrees(state.rotation));
    }
    report(onProgress, i + 1, pages.length, "Montando documento");
  }
  return ordered.save();
}

export interface WatermarkOptions {
  text: string;
  opacity?: number; // 0-1
  fontSizePt?: number;
  colorHex?: string; // ex.: "#147D82"
  rotationDegrees?: number;
}

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return { r, g, b };
}

/** Aplica uma marca d'água textual (visual, não é assinatura nem carimbo criptográfico). */
export async function addWatermark(
  bytes: Uint8Array,
  options: WatermarkOptions,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const doc = await loadForEditing(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const { r, g, b } = hexToRgb01(options.colorHex ?? "#147D82");
  const fontSize = options.fontSizePt ?? 48;
  const opacity = options.opacity ?? 0.25;
  const rotation = options.rotationDegrees ?? -45;
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    checkCancelled(cancelToken);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, fontSize);
    page.drawText(options.text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(rotation),
    });
    report(onProgress, i + 1, pages.length, "Aplicando marca d'água");
  });
  return doc.save();
}

export interface PageNumberOptions {
  fontSizePt?: number;
  margin?: number;
  startAt?: number;
  format?: (page: number, total: number) => string;
  position?: "bottom-center" | "bottom-right";
}

/** Insere numeração de páginas simples (texto), sem depender de recursos externos. */
export async function addPageNumbers(
  bytes: Uint8Array,
  options: PageNumberOptions = {},
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const doc = await loadForEditing(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = options.fontSizePt ?? 10;
  const margin = options.margin ?? 24;
  const startAt = options.startAt ?? 1;
  const format = options.format ?? ((page: number, total: number) => `${page} / ${total}`);
  const position = options.position ?? "bottom-center";
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    checkCancelled(cancelToken);
    const label = format(startAt + i, pages.length);
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const x = position === "bottom-center" ? width / 2 - textWidth / 2 : width - textWidth - margin;
    page.drawText(label, { x, y: margin / 1.5, size: fontSize, font, color: rgb(0.35, 0.35, 0.35) });
    report(onProgress, i + 1, pages.length, "Numerando páginas");
  });
  return doc.save();
}

/** Define metadados simples (título, autor, assunto, palavras-chave). */
export async function setSimpleMetadata(bytes: Uint8Array, meta: SimpleMetadata): Promise<Uint8Array> {
  const doc = await loadForEditing(bytes);
  if (meta.title !== undefined) doc.setTitle(meta.title);
  if (meta.author !== undefined) doc.setAuthor(meta.author);
  if (meta.subject !== undefined) doc.setSubject(meta.subject);
  if (meta.keywords !== undefined) doc.setKeywords(meta.keywords.split(",").map((k) => k.trim()).filter(Boolean));
  return doc.save();
}

/** Constrói um novo PDF a partir de uma lista de imagens (JPEG/PNG), uma por página. */
export async function imagesToPdf(
  images: Array<{ bytes: Uint8Array; mimeType: "image/jpeg" | "image/png" }>,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    checkCancelled(cancelToken);
    const { bytes: imgBytes, mimeType } = images[i];
    const embedded = mimeType === "image/png" ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
    const page = doc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    report(onProgress, i + 1, images.length, "Adicionando imagens");
  }
  return doc.save();
}

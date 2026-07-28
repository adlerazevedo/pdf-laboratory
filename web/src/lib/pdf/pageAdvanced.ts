/**
 * Fase 3 — edição de páginas e objetos avançada: caixas de página
 * (CropBox/MediaBox), numeração Bates, anexos e marcadores (bookmarks)
 * com links internos. Tudo via pdf-lib, localmente, sem envio a servidor.
 */
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef, PDFString, StandardFonts, rgb } from "pdf-lib";
import type { CancelToken, OperationProgress } from "./types";
import { OperationCancelledError } from "./types";

type ProgressCallback = (progress: OperationProgress) => void;

function checkCancelled(token?: CancelToken): void {
  if (token?.cancelled) throw new OperationCancelledError();
}

function report(cb: ProgressCallback | undefined, done: number, total: number, stage: string): void {
  cb?.({ done, total, stage });
}

export interface CropMarginsPt {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageBoxOptions {
  pageIndices: number[]; // 0-based; vazio = todas as páginas
  cropMarginsPt?: CropMarginsPt;
  /** Redimensiona a MediaBox multiplicando a largura/altura atual por este fator (1 = sem alteração). */
  mediaBoxScale?: number;
}

/**
 * Altera CropBox (recorte visual, reversível — o conteúdo original não é
 * removido, só a área visível/impressa é reduzida) e/ou MediaBox
 * (redimensiona a página de fato, escalando o conteúdo).
 */
export async function setPageBoxes(
  bytes: Uint8Array,
  options: PageBoxOptions,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const pages = doc.getPages();
  const indices = options.pageIndices.length > 0 ? options.pageIndices : pages.map((_, i) => i);
  let done = 0;
  for (const idx of indices) {
    checkCancelled(cancelToken);
    const page = pages[idx];
    if (!page) {
      done += 1;
      continue;
    }
    if (options.mediaBoxScale && options.mediaBoxScale !== 1) {
      const { width, height } = page.getSize();
      page.setMediaBox(0, 0, width * options.mediaBoxScale, height * options.mediaBoxScale);
      page.scaleContent(options.mediaBoxScale, options.mediaBoxScale);
    }
    if (options.cropMarginsPt) {
      const { width, height } = page.getSize();
      const m = options.cropMarginsPt;
      const newWidth = Math.max(1, width - m.left - m.right);
      const newHeight = Math.max(1, height - m.top - m.bottom);
      page.setCropBox(m.left, m.bottom, newWidth, newHeight);
    }
    done += 1;
    report(onProgress, done, indices.length, "Ajustando caixas de página");
  }
  return doc.save();
}

export interface BatesOptions {
  prefix: string;
  startNumber: number;
  digits: number; // largura mínima com zeros à esquerda
  position?: "bottom-right" | "bottom-left";
  fontSizePt?: number;
}

function formatBates(prefix: string, n: number, digits: number): string {
  return `${prefix}${String(n).padStart(digits, "0")}`;
}

/** Numeração Bates (identificador único e sequencial por página, comum em processos jurídicos/descoberta de provas). */
export async function addBatesNumbering(
  bytes: Uint8Array,
  options: BatesOptions,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = options.fontSizePt ?? 9;
  const margin = 20;
  const position = options.position ?? "bottom-right";
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    checkCancelled(cancelToken);
    const label = formatBates(options.prefix, options.startNumber + i, options.digits);
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const x = position === "bottom-right" ? width - textWidth - margin : margin;
    page.drawText(label, { x, y: margin / 1.5, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
    report(onProgress, i + 1, pages.length, "Aplicando numeração Bates");
  });
  return doc.save();
}

export function batesLabelForPage(options: BatesOptions, pageIndex: number): string {
  return formatBates(options.prefix, options.startNumber + pageIndex, options.digits);
}

export interface AttachmentInput {
  fileName: string;
  bytes: Uint8Array;
  mimeType?: string;
  description?: string;
}

/** Anexa um ou mais arquivos ao PDF (embedded files — visíveis em leitores como anexos, não como páginas). */
export async function addAttachments(bytes: Uint8Array, attachments: AttachmentInput[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  for (const a of attachments) {
    await doc.attach(a.bytes, a.fileName, { mimeType: a.mimeType, description: a.description });
  }
  return doc.save();
}

export interface BookmarkInput {
  title: string;
  pageIndex: number; // 0-based
}

/**
 * Constrói uma árvore de marcadores (outline) plana — um item por
 * entrada, sem aninhamento — usando os objetos de baixo nível do
 * pdf-lib (não existe API de alto nível para outlines nesta versão).
 */
export async function setBookmarks(bytes: Uint8Array, bookmarks: BookmarkInput[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const pages = doc.getPages();
  const context = doc.context;

  if (bookmarks.length === 0) {
    doc.catalog.delete(PDFName.of("Outlines"));
    return doc.save();
  }

  const itemRefs: PDFRef[] = bookmarks.map(() => context.nextRef());
  const outlineRootRef = context.nextRef();

  bookmarks.forEach((bm, i) => {
    const page = pages[bm.pageIndex];
    const destArray = page
      ? [page.ref, PDFName.of("XYZ"), null, null, null]
      : [pages[0]?.ref, PDFName.of("XYZ"), null, null, null];
    const dict = context.obj({
      Title: PDFString.of(bm.title),
      Parent: outlineRootRef,
      Dest: destArray,
      ...(i > 0 ? { Prev: itemRefs[i - 1] } : {}),
      ...(i < bookmarks.length - 1 ? { Next: itemRefs[i + 1] } : {}),
    });
    context.assign(itemRefs[i], dict);
  });

  const outlineRoot = context.obj({
    Type: "Outlines",
    First: itemRefs[0],
    Last: itemRefs[itemRefs.length - 1],
    Count: bookmarks.length,
  });
  context.assign(outlineRootRef, outlineRoot);
  doc.catalog.set(PDFName.of("Outlines"), outlineRootRef);

  return doc.save();
}

export interface InternalLinkInput {
  pageIndex: number; // página onde o link (a área clicável) aparece
  x: number;
  y: number;
  width: number;
  height: number;
  targetPageIndex: number; // página de destino
}

/** Adiciona uma anotação de link que navega para outra página do MESMO documento (não uma URL externa). */
export async function addInternalLinks(bytes: Uint8Array, links: InternalLinkInput[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const pages = doc.getPages();
  for (const link of links) {
    const page = pages[link.pageIndex];
    const target = pages[link.targetPageIndex];
    if (!page || !target) continue;
    const rectArr = [link.x, link.y, link.x + link.width, link.y + link.height];
    const linkDict = doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: rectArr,
      Border: [0, 0, 0],
      Dest: [target.ref, PDFName.of("XYZ"), null, null, null],
    });
    const linkRef = doc.context.register(linkDict);
    const existing = page.node.get(PDFName.of("Annots"));
    if (existing instanceof PDFArray) {
      existing.push(linkRef);
    } else {
      const arr = PDFArray.withContext(doc.context);
      arr.push(linkRef);
      page.node.set(PDFName.of("Annots"), arr);
    }
  }
  return doc.save();
}

/** Lê os marcadores (outline) de um PDF já existente — usado para exibir/editar antes de salvar. */
export async function readBookmarks(bytes: Uint8Array): Promise<BookmarkInput[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const outlinesRef = doc.catalog.get(PDFName.of("Outlines"));
  if (!outlinesRef) return [];
  const outlines = doc.context.lookup(outlinesRef, PDFDict);
  if (!outlines) return [];
  const results: BookmarkInput[] = [];
  const pageRefs = doc.getPages().map((p) => p.ref);
  let currentRef = outlines.get(PDFName.of("First"));
  let guard = 0;
  while (currentRef && guard < 10_000) {
    guard += 1;
    const item = doc.context.lookup(currentRef, PDFDict);
    if (!item) break;
    const titleObj = item.get(PDFName.of("Title"));
    const title = titleObj instanceof PDFString ? titleObj.decodeText() : "";
    const dest = item.get(PDFName.of("Dest"));
    let pageIndex = 0;
    if (dest instanceof PDFArray) {
      const pageRef = dest.get(0);
      const found = pageRefs.findIndex((r) => r === pageRef);
      if (found >= 0) pageIndex = found;
    }
    results.push({ title, pageIndex });
    currentRef = item.get(PDFName.of("Next"));
  }
  return results;
}


export interface PageAdvancedOptions {
  boxes?: PageBoxOptions;
  bates?: BatesOptions;
  attachments?: AttachmentInput[];
  bookmarks?: BookmarkInput[];
  internalLinks?: InternalLinkInput[];
}

/**
 * Aplica, em sequência, as operações avançadas de página habilitadas pelo
 * usuário (cada etapa é opcional — só roda se a respectiva opção foi
 * fornecida). Usado por uma única tela/worker-call para não exigir uma
 * tela separada por sub-recurso.
 */
export async function applyPageAdvancedOperations(
  bytes: Uint8Array,
  options: PageAdvancedOptions,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  let current = bytes;
  const steps: Array<{ label: string; run: (b: Uint8Array) => Promise<Uint8Array> }> = [];
  if (options.boxes) steps.push({ label: "Caixas de página", run: (b) => setPageBoxes(b, options.boxes!, undefined, cancelToken) });
  if (options.bates) steps.push({ label: "Numeração Bates", run: (b) => addBatesNumbering(b, options.bates!, undefined, cancelToken) });
  if (options.attachments && options.attachments.length > 0) {
    steps.push({ label: "Anexos", run: (b) => addAttachments(b, options.attachments!) });
  }
  if (options.bookmarks) steps.push({ label: "Marcadores", run: (b) => setBookmarks(b, options.bookmarks!) });
  if (options.internalLinks && options.internalLinks.length > 0) {
    steps.push({ label: "Links internos", run: (b) => addInternalLinks(b, options.internalLinks!) });
  }

  for (let i = 0; i < steps.length; i += 1) {
    checkCancelled(cancelToken);
    current = await steps[i].run(current);
    report(onProgress, i + 1, steps.length, steps[i].label);
  }
  return current;
}

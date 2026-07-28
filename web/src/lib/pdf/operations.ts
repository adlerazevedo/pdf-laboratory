import { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFRef, StandardFonts, degrees, rgb } from "pdf-lib";
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

/**
 * Generaliza `splitByRanges` para grupos arbitrários de páginas (0-based),
 * não necessariamente contíguos — cobre "cada página em um arquivo",
 * "a cada N páginas", "dividir em N arquivos", "páginas pares/ímpares" e
 * "intervalos personalizados" com a mesma função, um documento por grupo.
 */
export async function splitByPageGroups(
  bytes: Uint8Array,
  groups: number[][],
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array[]> {
  const outputs: Uint8Array[] = [];
  for (let i = 0; i < groups.length; i++) {
    checkCancelled(cancelToken);
    const doc = await extractPages(bytes, groups[i]);
    outputs.push(doc);
    report(onProgress, i + 1, groups.length, `Gerando parte ${i + 1} de ${groups.length}`);
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

export type ImagesToPdfPageSize = "auto" | "a4" | "letter";
export type ImagesToPdfOrientation = "auto" | "portrait" | "landscape";
export type ImagesToPdfFit = "contain" | "fill";

export interface ImagesToPdfOptions {
  /** "auto" usa o tamanho intrínseco de cada imagem como tamanho de página (comportamento original). */
  pageSize?: ImagesToPdfPageSize;
  /** "auto" preserva a orientação natural da imagem; "portrait"/"landscape" forçam a orientação da página. */
  orientation?: ImagesToPdfOrientation;
  /** Margem em pontos (1/72") aplicada nos quatro lados. Ignorada quando pageSize é "auto". */
  marginPt?: number;
  /**
   * "contain": a imagem inteira cabe dentro da área útil, preservando proporção (pode sobrar espaço).
   * "fill": a imagem preenche toda a área útil, esticando se necessário (não corta, mas pode distorcer).
   */
  fit?: ImagesToPdfFit;
}

const PAGE_SIZES_PT: Record<Exclude<ImagesToPdfPageSize, "auto">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

/** Constrói um novo PDF a partir de uma lista de imagens (JPEG/PNG), uma por página. */
export async function imagesToPdf(
  images: Array<{ bytes: Uint8Array; mimeType: "image/jpeg" | "image/png" }>,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
  options: ImagesToPdfOptions = {},
): Promise<Uint8Array> {
  const { pageSize = "auto", orientation = "auto", marginPt = 0, fit = "contain" } = options;
  const doc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    checkCancelled(cancelToken);
    const { bytes: imgBytes, mimeType } = images[i];
    const embedded = mimeType === "image/png" ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);

    if (pageSize === "auto") {
      // Comportamento original: a página tem exatamente o tamanho da imagem, sem margem.
      const page = doc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    } else {
      let [pageWidth, pageHeight] = PAGE_SIZES_PT[pageSize];
      const imageIsLandscape = embedded.width >= embedded.height;
      const wantLandscape = orientation === "landscape" || (orientation === "auto" && imageIsLandscape);
      if (wantLandscape && pageWidth < pageHeight) [pageWidth, pageHeight] = [pageHeight, pageWidth];
      if (!wantLandscape && pageWidth > pageHeight) [pageWidth, pageHeight] = [pageHeight, pageWidth];

      const page = doc.addPage([pageWidth, pageHeight]);
      const areaWidth = Math.max(1, pageWidth - marginPt * 2);
      const areaHeight = Math.max(1, pageHeight - marginPt * 2);

      let drawWidth: number;
      let drawHeight: number;
      if (fit === "fill") {
        drawWidth = areaWidth;
        drawHeight = areaHeight;
      } else {
        const scale = Math.min(areaWidth / embedded.width, areaHeight / embedded.height);
        drawWidth = embedded.width * scale;
        drawHeight = embedded.height * scale;
      }
      const x = marginPt + (areaWidth - drawWidth) / 2;
      const y = marginPt + (areaHeight - drawHeight) / 2;
      page.drawImage(embedded, { x, y, width: drawWidth, height: drawHeight });
    }
    report(onProgress, i + 1, images.length, "Adicionando imagens");
  }
  return doc.save();
}

export type CompressionLevel = "light" | "medium" | "strong";

export interface CompressionOptions {
  level: CompressionLevel;
}

export interface CompressionResult {
  bytes: Uint8Array;
  imagesFound: number;
  imagesRecompressed: number;
  originalSize: number;
  compressedSize: number;
}

interface CompressionSettings {
  scale: number;
  quality: number;
}

const COMPRESSION_LEVELS: Record<CompressionLevel, CompressionSettings> = {
  light: { scale: 1, quality: 0.8 },
  medium: { scale: 0.75, quality: 0.6 },
  strong: { scale: 0.5, quality: 0.4 },
};

function hasWorkerImageApis(): boolean {
  return typeof createImageBitmap === "function" && typeof OffscreenCanvas !== "undefined";
}

/**
 * Compressão básica: recomprime SOMENTE imagens JPEG (filtro DCTDecode) já
 * embutidas no PDF, reduzindo resolução e qualidade conforme o nível
 * escolhido. Não é equivalente à otimização via Ghostscript do aplicativo
 * desktop (que também remove fontes não usadas, otimiza streams de
 * conteúdo, etc.) e não garante redução de tamanho — um PDF sem imagens
 * JPEG, ou já bem otimizado, pode não encolher (e o próprio processo de
 * resserialização do pdf-lib pode até aumentar levemente o arquivo nesse
 * caso). Por segurança, imagens com máscara de transparência (SMask),
 * array de Decode customizado, ou espaço de cor que não seja DeviceRGB/
 * DeviceGray são deixadas intactas — evita risco de corromper cores ou
 * perder transparência.
 */
export async function compressBasic(
  bytes: Uint8Array,
  options: CompressionOptions,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<CompressionResult> {
  const settings = COMPRESSION_LEVELS[options.level];
  const doc = await loadForEditing(bytes);

  const seenRefs = new Set<string>();
  const candidateRefs: PDFRef[] = [];
  for (const page of doc.getPages()) {
    const resources = page.node.Resources();
    const xobjDict = resources?.lookup(PDFName.of("XObject"), PDFDict);
    if (!xobjDict) continue;
    for (const key of xobjDict.keys()) {
      const ref = xobjDict.get(key);
      if (!(ref instanceof PDFRef) || seenRefs.has(ref.tag)) continue;
      seenRefs.add(ref.tag);
      const obj = doc.context.lookup(ref);
      if (!(obj instanceof PDFRawStream)) continue;
      const subtype = obj.dict.get(PDFName.of("Subtype"));
      const filter = obj.dict.get(PDFName.of("Filter"));
      const smask = obj.dict.get(PDFName.of("SMask"));
      const decode = obj.dict.get(PDFName.of("Decode"));
      const colorSpace = obj.dict.get(PDFName.of("ColorSpace"));
      const colorSpaceOk = !colorSpace || colorSpace.toString() === "/DeviceRGB" || colorSpace.toString() === "/DeviceGray";
      if (subtype?.toString() !== "/Image") continue;
      if (!filter || filter.toString() !== "/DCTDecode") continue;
      if (smask || decode || !colorSpaceOk) continue;
      candidateRefs.push(ref);
    }
  }

  if (candidateRefs.length > 0 && !hasWorkerImageApis()) {
    throw new Error("Este navegador não oferece as APIs necessárias (OffscreenCanvas/createImageBitmap) para a compressão básica.");
  }

  let imagesRecompressed = 0;
  for (let i = 0; i < candidateRefs.length; i++) {
    checkCancelled(cancelToken);
    const ref = candidateRefs[i];
    const streamObj = doc.context.lookup(ref);
    if (!(streamObj instanceof PDFRawStream)) continue;
    const stream = streamObj;
    try {
      const bitmap = await createImageBitmap(new Blob([stream.contents], { type: "image/jpeg" }));
      const newWidth = Math.max(1, Math.round(bitmap.width * settings.scale));
      const newHeight = Math.max(1, Math.round(bitmap.height * settings.scale));
      const canvas = new OffscreenCanvas(newWidth, newHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Contexto 2D indisponível.");
      ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
      bitmap.close();
      const outBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: settings.quality });
      const newBytes = new Uint8Array(await outBlob.arrayBuffer());
      if (newBytes.length < stream.contents.length) {
        const newDict = doc.context.obj({
          Type: "XObject",
          Subtype: "Image",
          Width: newWidth,
          Height: newHeight,
          ColorSpace: "DeviceRGB",
          BitsPerComponent: 8,
          Filter: "DCTDecode",
          Length: newBytes.length,
        });
        doc.context.assign(ref, PDFRawStream.of(newDict, newBytes));
        imagesRecompressed++;
      }
    } catch {
      // Decodificação falhou (formato inesperado) — mantém a imagem original intacta.
    }
    report(onProgress, i + 1, candidateRefs.length, `Recomprimindo imagem ${i + 1} de ${candidateRefs.length}`);
  }

  const compressedBytes = await doc.save();
  return {
    bytes: compressedBytes,
    imagesFound: candidateRefs.length,
    imagesRecompressed,
    originalSize: bytes.length,
    compressedSize: compressedBytes.length,
  };
}

export type SignaturePosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface VisualSignatureTextContent {
  kind: "text";
  text: string;
  colorHex?: string;
}

export interface VisualSignatureImageContent {
  kind: "image";
  bytes: Uint8Array;
  mimeType: "image/png" | "image/jpeg";
}

export type VisualSignatureContent = VisualSignatureTextContent | VisualSignatureImageContent;

export interface VisualSignatureOptions {
  content: VisualSignatureContent;
  position: SignaturePosition;
  /** Largura do carimbo, como percentual da largura da página (10–80). */
  scalePercent?: number;
  /** Opacidade do carimbo, 0–1. */
  opacity?: number;
  marginPt?: number;
  /** Páginas (0-based) a carimbar. Omitido = todas as páginas. */
  pageIndices?: number[];
  /**
   * Âncora livre (origem superior-esquerda, em pontos PDF — mesmo referencial
   * do Editor de PDF). Quando informada, sobrepõe o preset `position` para
   * esta operação: o carimbo é posicionado exatamente neste ponto em vez de
   * um dos 9 presets de grade.
   */
  anchorPt?: { x: number; y: number };
  /** Rotação do carimbo em graus, sentido horário como visto na tela (0–359). Rotaciona em torno do centro do carimbo. */
  rotationDeg?: number;
}

/** Mesma técnica de rotação-em-torno-do-centro usada no Editor de PDF (ver editorExport.ts). */
function centerRotationAnchorStamp(centerX: number, centerY: number, halfW: number, halfH: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotatedOffsetX = halfW * cos - halfH * sin;
  const rotatedOffsetY = halfW * sin + halfH * cos;
  return { x: centerX - rotatedOffsetX, y: centerY - rotatedOffsetY };
}

function computeStampOrigin(
  position: SignaturePosition,
  pageWidth: number,
  pageHeight: number,
  stampWidth: number,
  stampHeight: number,
  margin: number,
): { x: number; y: number } {
  let x: number;
  if (position.endsWith("left")) x = margin;
  else if (position.endsWith("right")) x = pageWidth - stampWidth - margin;
  else x = (pageWidth - stampWidth) / 2;

  let y: number;
  if (position.startsWith("top")) y = pageHeight - stampHeight - margin;
  else if (position.startsWith("bottom")) y = margin;
  else y = (pageHeight - stampHeight) / 2;

  return { x, y };
}

/**
 * Aplica um carimbo visual (texto ou imagem) em uma ou mais páginas. É
 * SOMENTE visual — sem validade jurídica ou criptográfica, e sem qualquer
 * interação com certificados. Nunca deve receber/solicitar arquivos
 * PFX/P12; para assinatura digital real (ICP-Brasil), use o aplicativo
 * desktop.
 */
export async function addVisualSignature(
  bytes: Uint8Array,
  options: VisualSignatureOptions,
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const doc = await loadForEditing(bytes);
  const pages = doc.getPages();
  const targetIndices = options.pageIndices ?? pages.map((_, i) => i);
  const opacity = options.opacity ?? 1;
  const marginPt = options.marginPt ?? 24;
  const scalePercent = Math.min(80, Math.max(5, options.scalePercent ?? 25));

  const embeddedImage =
    options.content.kind === "image"
      ? options.content.mimeType === "image/png"
        ? await doc.embedPng(options.content.bytes)
        : await doc.embedJpg(options.content.bytes)
      : null;
  const font = options.content.kind === "text" ? await doc.embedFont(StandardFonts.HelveticaBoldOblique) : null;

  for (let i = 0; i < targetIndices.length; i++) {
    checkCancelled(cancelToken);
    const pageIndex = targetIndices[i];
    const page = pages[pageIndex];
    if (!page) continue;
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const desiredWidth = (pageWidth * scalePercent) / 100;

    if (options.content.kind === "image" && embeddedImage) {
      const stampWidth = desiredWidth;
      const stampHeight = stampWidth * (embeddedImage.height / embeddedImage.width);
      const preset = computeStampOrigin(options.position, pageWidth, pageHeight, stampWidth, stampHeight, marginPt);
      const origin = options.anchorPt
        ? { x: options.anchorPt.x, y: pageHeight - options.anchorPt.y - stampHeight }
        : preset;
      const rotationDeg = options.rotationDeg ?? 0;
      const drawAnchor = rotationDeg
        ? centerRotationAnchorStamp(origin.x + stampWidth / 2, origin.y + stampHeight / 2, stampWidth / 2, stampHeight / 2, -rotationDeg)
        : origin;
      page.drawImage(embeddedImage, { x: drawAnchor.x, y: drawAnchor.y, width: stampWidth, height: stampHeight, opacity, rotate: rotationDeg ? degrees(rotationDeg) : undefined });
    } else if (font && options.content.kind === "text") {
      const text = options.content.text;
      const baseSize = 24;
      const baseWidth = Math.max(1, font.widthOfTextAtSize(text, baseSize));
      const fontSize = baseSize * (desiredWidth / baseWidth);
      const stampWidth = font.widthOfTextAtSize(text, fontSize);
      const stampHeight = font.heightAtSize(fontSize);
      const { r, g, b } = hexToRgb01(options.content.colorHex ?? "#1D3557");
      const preset = computeStampOrigin(options.position, pageWidth, pageHeight, stampWidth, stampHeight, marginPt);
      const origin = options.anchorPt
        ? { x: options.anchorPt.x, y: pageHeight - options.anchorPt.y - stampHeight }
        : preset;
      const rotationDeg = options.rotationDeg ?? 0;
      const drawAnchor = rotationDeg
        ? centerRotationAnchorStamp(origin.x + stampWidth / 2, origin.y + stampHeight / 2, stampWidth / 2, stampHeight / 2, -rotationDeg)
        : origin;
      page.drawText(text, { x: drawAnchor.x, y: drawAnchor.y, size: fontSize, font, color: rgb(r, g, b), opacity, rotate: rotationDeg ? degrees(rotationDeg) : undefined });
    }
    report(onProgress, i + 1, targetIndices.length, "Aplicando assinatura visual");
  }

  return doc.save();
}

export interface OcrWordPlacement {
  text: string;
  /** Canto inferior esquerdo da palavra, em pontos PDF (origem inferior esquerda da página). */
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
}

export interface OcrPageResult {
  /** Índice 0-based da página original a receber a camada de texto. */
  pageIndex: number;
  words: OcrWordPlacement[];
}

/**
 * Insere uma camada de texto pesquisável (invisível — opacidade 0) sobre as
 * páginas indicadas, na posição de cada palavra reconhecida pelo OCR. Nunca
 * substitui ou rasteriza o conteúdo original da página: o texto é apenas
 * somado por cima, na posição correspondente, para permitir busca/seleção/
 * cópia sem alterar a aparência visual do documento.
 */
export async function addSearchableTextLayer(
  bytes: Uint8Array,
  pages: OcrPageResult[],
  onProgress?: ProgressCallback,
  cancelToken?: CancelToken,
): Promise<Uint8Array> {
  const doc = await loadForEditing(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const docPages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    checkCancelled(cancelToken);
    const { pageIndex, words } = pages[i];
    const page = docPages[pageIndex];
    if (page) {
      for (const word of words) {
        const fontSize = Math.max(1, word.heightPt);
        page.drawText(word.text, { x: word.xPt, y: word.yPt, size: fontSize, font, opacity: 0 });
      }
    }
    report(onProgress, i + 1, pages.length, `Inserindo texto pesquisável (página ${pageIndex + 1})`);
  }
  return doc.save();
}

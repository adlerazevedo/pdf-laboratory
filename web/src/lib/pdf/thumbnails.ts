import { pdfjsLib } from "./pdfjsSetup";
import type { PageThumbnail, RotationDegrees } from "./types";

/**
 * Renderiza UMA página por vez sob demanda (nunca todas de uma vez — ver
 * docs/WEB.md, seção de desempenho). O chamador é responsável por
 * cache/descarte; aqui só existe a operação de render em si.
 */
export async function renderPageThumbnail(
  bytes: Uint8Array,
  pageIndex: number,
  options: { maxWidthPx?: number; rotation?: RotationDegrees } = {},
): Promise<PageThumbnail> {
  const { maxWidthPx = 220, rotation = 0 } = options;
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  try {
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1); // pdf.js é 1-based
    const baseViewport = page.getViewport({ scale: 1, rotation });
    const scale = maxWidthPx / baseViewport.width;
    const viewport = page.getViewport({ scale, rotation });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível criar o contexto de renderização (canvas 2D).");

    await page.render({ canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/png");
    return {
      pageIndex,
      dataUrl,
      widthPt: baseViewport.width,
      heightPt: baseViewport.height,
    };
  } finally {
    await loadingTask.destroy();
  }
}

/** Renderiza uma página em alta resolução para exportação PDF→imagens. */
export async function renderPageToCanvas(
  bytes: Uint8Array,
  pageIndex: number,
  dpi: number,
): Promise<HTMLCanvasElement> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  try {
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);
    const scale = dpi / 72; // pdf.js usa pontos (72 dpi como base)
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível criar o contexto de renderização (canvas 2D).");
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
  } finally {
    await loadingTask.destroy();
  }
}

/**
 * Como `renderPageToCanvas`, mas também devolve o tamanho da página em
 * pontos PDF (72 dpi) — necessário para converter as coordenadas de pixel
 * retornadas pelo OCR de volta para coordenadas PDF ao montar a camada de
 * texto pesquisável.
 */
export async function renderPageForOcr(
  bytes: Uint8Array,
  pageIndex: number,
  dpi: number,
): Promise<{ canvas: HTMLCanvasElement; pageWidthPt: number; pageHeightPt: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  try {
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);
    const basePt = page.getViewport({ scale: 1 });
    const scale = dpi / 72;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível criar o contexto de renderização (canvas 2D).");
    await page.render({ canvasContext: context, viewport }).promise;
    return { canvas, pageWidthPt: basePt.width, pageHeightPt: basePt.height };
  } finally {
    await loadingTask.destroy();
  }
}

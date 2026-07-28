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

/**
 * Renderiza uma página em alta resolução e pinta retângulos pretos
 * sólidos sobre as áreas marcadas para redação (coordenadas em pontos
 * PDF, origem superior-esquerda), depois devolve a imagem já com a
 * "queimadura" aplicada como PNG — usado pela ferramenta "Redação
 * segura" antes de a página ser reconstruída sem o conteúdo vetorial
 * original (ver lib/pdf/redaction.ts).
 */
export async function rasterizeAndRedactPage(
  bytes: Uint8Array,
  pageIndex: number,
  rectsPt: Array<{ xPt: number; yPt: number; widthPt: number; heightPt: number }>,
  dpi = 150,
): Promise<{ pngBytes: Uint8Array; widthPt: number; heightPt: number }> {
  const canvas = await renderPageToCanvas(bytes, pageIndex, dpi);
  const scale = dpi / 72;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível criar o contexto de renderização (canvas 2D).");
  context.fillStyle = "#000000";
  for (const r of rectsPt) {
    context.fillRect(r.xPt * scale, r.yPt * scale, r.widthPt * scale, r.heightPt * scale);
  }
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar PNG da página redigida."))), "image/png");
  });
  const pngBytes = new Uint8Array(await blob.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  try {
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);
    const basePt = page.getViewport({ scale: 1 });
    return { pngBytes, widthPt: basePt.width, heightPt: basePt.height };
  } finally {
    await loadingTask.destroy();
  }
}

/**
 * Extrai os itens de texto de uma página com sua caixa delimitadora em
 * pontos PDF (origem superior-esquerda, mesmo referencial do Editor e
 * da Redação segura) — usado para detectar automaticamente CPF/CNPJ/
 * e-mail/telefone antes de o usuário confirmar a redação.
 */
export async function extractPageTextItems(
  bytes: Uint8Array,
  pageIndex: number,
): Promise<Array<{ str: string; xPt: number; yPt: number; widthPt: number; heightPt: number }>> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  try {
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const results: Array<{ str: string; xPt: number; yPt: number; widthPt: number; heightPt: number }> = [];
    for (const raw of content.items) {
      const item = raw as { str?: string; width?: number; height?: number; transform?: number[] };
      if (!item.str || !item.transform) continue;
      const [, , , , tx, ty] = item.transform;
      const widthPt = item.width ?? 0;
      const heightPt = item.height ?? 10;
      results.push({
        str: item.str,
        xPt: tx,
        yPt: viewport.height - ty - heightPt,
        widthPt,
        heightPt,
      });
    }
    return results;
  } finally {
    await loadingTask.destroy();
  }
}

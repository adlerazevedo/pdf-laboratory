/**
 * Utilitários puros para exportação PDF → imagens. A renderização em si
 * (canvas) mora em `thumbnails.ts` e roda na thread principal (precisa de
 * DOM) — este arquivo só tem funções auxiliares testáveis sem navegador
 * real: nomes de arquivo e conversão de bytes.
 */

/** Converte um <canvas> em bytes de imagem (PNG ou JPEG), via toBlob. */
export function canvasToBlob(canvas: HTMLCanvasElement, mimeType: "image/png" | "image/jpeg", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível gerar a imagem a partir do canvas."));
      },
      mimeType,
      quality,
    );
  });
}

export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Gera um nome de arquivo estável e ordenável para uma página exportada,
 * com zero-padding suficiente para o total de páginas (ex.: pagina-003.png
 * quando há mais de 99 páginas, mas pagina-03.png quando há até 99).
 */
export function buildPageImageFileName(baseName: string, pageNumber: number, totalPages: number, ext: "png" | "jpg"): string {
  const digits = Math.max(2, String(totalPages).length);
  const padded = String(pageNumber).padStart(digits, "0");
  const safeBase = baseName.replace(/\.pdf$/i, "") || "documento";
  return `${safeBase}-pagina-${padded}.${ext}`;
}

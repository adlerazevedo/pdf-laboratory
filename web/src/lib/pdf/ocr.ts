import { createWorker } from "tesseract.js";
import type { CancelToken } from "./types";
import { OperationCancelledError } from "./types";

export type OcrLanguage = "por" | "eng";

export interface OcrWord {
  text: string;
  /** Retângulo delimitador em pixels da imagem renderizada (origem no canto superior esquerdo). */
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

/**
 * Achata a árvore blocks→paragraphs→lines→words do resultado do Tesseract.js
 * em uma lista simples de palavras com texto e posição. Função pura, sem
 * dependência do Tesseract em si — testável isoladamente com um objeto
 * "Page" sintético.
 */
export function flattenWords(page: {
  blocks: Array<{ paragraphs: Array<{ lines: Array<{ words: Array<{ text: string; bbox: OcrWord["bbox"] }> }> }> }> | null;
}): OcrWord[] {
  const words: OcrWord[] = [];
  for (const block of page.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        for (const word of line.words ?? []) {
          if (word.text.trim()) words.push({ text: word.text, bbox: word.bbox });
        }
      }
    }
  }
  return words;
}

export interface OcrProgress {
  status: string;
  progress: number; // 0-1
}

/**
 * Reconhece o texto de uma imagem (canvas de uma página renderizada) usando
 * Tesseract.js. Na primeira execução de cada idioma, o Tesseract.js baixa o
 * runtime (core WASM) e o modelo de idioma (.traineddata) de uma CDN
 * (jsdelivr) — nunca envia o PDF do usuário para lugar nenhum, apenas busca
 * esses arquivos de motor/idioma. Ver aviso correspondente na interface.
 */
export async function recognizeCanvas(
  canvas: HTMLCanvasElement,
  lang: OcrLanguage,
  onProgress?: (p: OcrProgress) => void,
  cancelToken?: CancelToken,
): Promise<OcrWord[]> {
  const worker = await createWorker(lang, undefined, {
    logger: (m) => onProgress?.({ status: m.status, progress: m.progress }),
  });
  try {
    if (cancelToken?.cancelled) throw new OperationCancelledError();
    const { data } = await worker.recognize(canvas, {}, { blocks: true });
    if (cancelToken?.cancelled) throw new OperationCancelledError();
    return flattenWords(data as unknown as Parameters<typeof flattenWords>[0]);
  } finally {
    await worker.terminate();
  }
}

/// <reference lib="webworker" />
// Web Worker: executa operações pesadas de PDF fora da thread principal,
// para nunca travar a interface durante processamento (ver docs/WEB.md).
import {
  addPageNumbers,
  addWatermark,
  extractPages,
  imagesToPdf,
  mergeDocuments,
  rebuildFromPageStates,
  setSimpleMetadata,
  splitByRanges,
  type PageNumberOptions,
  type WatermarkOptions,
} from "../lib/pdf/operations";
import type { PageState, SimpleMetadata } from "../lib/pdf/types";

export type PdfWorkerRequest =
  | { id: string; kind: "extractPages"; bytes: Uint8Array; pageIndices: number[] }
  | { id: string; kind: "splitByRanges"; bytes: Uint8Array; ranges: Array<{ start: number; end: number }> }
  | { id: string; kind: "mergeDocuments"; documents: Uint8Array[] }
  | { id: string; kind: "rebuildFromPageStates"; bytes: Uint8Array; pages: PageState[] }
  | { id: string; kind: "addWatermark"; bytes: Uint8Array; options: WatermarkOptions }
  | { id: string; kind: "addPageNumbers"; bytes: Uint8Array; options: PageNumberOptions }
  | { id: string; kind: "setSimpleMetadata"; bytes: Uint8Array; meta: SimpleMetadata }
  | { id: string; kind: "imagesToPdf"; images: Array<{ bytes: Uint8Array; mimeType: "image/jpeg" | "image/png" }> }
  | { id: string; kind: "cancel" };

export type PdfWorkerResponse =
  | { id: string; kind: "progress"; done: number; total: number; stage: string }
  | { id: string; kind: "result"; bytes: Uint8Array }
  | { id: string; kind: "resultMany"; documents: Uint8Array[] }
  | { id: string; kind: "error"; message: string; name: string };

const cancelTokens = new Map<string, { cancelled: boolean }>();

function tokenFor(id: string): { cancelled: boolean } {
  let token = cancelTokens.get(id);
  if (!token) {
    token = { cancelled: false };
    cancelTokens.set(id, token);
  }
  return token;
}

self.onmessage = async (event: MessageEvent<PdfWorkerRequest>) => {
  const msg = event.data;

  if (msg.kind === "cancel") {
    tokenFor(msg.id).cancelled = true;
    return;
  }

  const token = tokenFor(msg.id);
  const onProgress = (p: { done: number; total: number; stage: string }) =>
    (self as unknown as Worker).postMessage({ id: msg.id, kind: "progress", ...p } satisfies PdfWorkerResponse);

  try {
    let response: PdfWorkerResponse;
    switch (msg.kind) {
      case "extractPages": {
        const bytes = await extractPages(msg.bytes, msg.pageIndices, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "splitByRanges": {
        const documents = await splitByRanges(msg.bytes, msg.ranges, onProgress, token);
        response = { id: msg.id, kind: "resultMany", documents };
        break;
      }
      case "mergeDocuments": {
        const bytes = await mergeDocuments(msg.documents, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "rebuildFromPageStates": {
        const bytes = await rebuildFromPageStates(msg.bytes, msg.pages, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "addWatermark": {
        const bytes = await addWatermark(msg.bytes, msg.options, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "addPageNumbers": {
        const bytes = await addPageNumbers(msg.bytes, msg.options, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "setSimpleMetadata": {
        const bytes = await setSimpleMetadata(msg.bytes, msg.meta);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "imagesToPdf": {
        const bytes = await imagesToPdf(msg.images, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
    }
    (self as unknown as Worker).postMessage(response);
  } catch (error: unknown) {
    const err = error as Error;
    (self as unknown as Worker).postMessage({
      id: msg.id,
      kind: "error",
      message: err?.message ?? String(error),
      name: err?.name ?? "Error",
    } satisfies PdfWorkerResponse);
  } finally {
    cancelTokens.delete(msg.id);
  }
};

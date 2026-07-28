/// <reference lib="webworker" />
// Web Worker: executa operações pesadas de PDF fora da thread principal,
// para nunca travar a interface durante processamento (ver docs/WEB.md).
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
  type CompressionOptions,
  type ImagesToPdfOptions,
  type OcrPageResult,
  type VisualSignatureOptions,
  type PageNumberOptions,
  type WatermarkOptions,
} from "../lib/pdf/operations";
import type { PageState, SimpleMetadata } from "../lib/pdf/types";
import { applyEditorObjects } from "../lib/pdf/editorExport";
import type { EditorObject } from "../lib/pdf/editorTypes";
import { applyPageAdvancedOperations } from "../lib/pdf/pageAdvanced";
import type { PageAdvancedOptions } from "../lib/pdf/pageAdvanced";
import { applyRedactionRaster } from "../lib/pdf/redaction";
import type { ApplyRedactionOptions } from "../lib/pdf/redaction";
import { buildAcroForm } from "../lib/pdf/formExport";
import type { FormField } from "../lib/pdf/formTypes";
import { fillFormFields } from "../lib/pdf/formFill";
import type { FillValue } from "../lib/pdf/formFill";

export type PdfWorkerRequest =
  | { id: string; kind: "extractPages"; bytes: Uint8Array; pageIndices: number[] }
  | { id: string; kind: "splitByRanges"; bytes: Uint8Array; ranges: Array<{ start: number; end: number }> }
  | { id: string; kind: "splitByPageGroups"; bytes: Uint8Array; groups: number[][] }
  | { id: string; kind: "mergeDocuments"; documents: Uint8Array[] }
  | { id: string; kind: "rebuildFromPageStates"; bytes: Uint8Array; pages: PageState[] }
  | { id: string; kind: "addWatermark"; bytes: Uint8Array; options: WatermarkOptions }
  | { id: string; kind: "addPageNumbers"; bytes: Uint8Array; options: PageNumberOptions }
  | { id: string; kind: "setSimpleMetadata"; bytes: Uint8Array; meta: SimpleMetadata }
  | { id: string; kind: "compressBasic"; bytes: Uint8Array; options: CompressionOptions }
  | { id: string; kind: "addVisualSignature"; bytes: Uint8Array; options: VisualSignatureOptions }
  | { id: string; kind: "addSearchableTextLayer"; bytes: Uint8Array; pages: OcrPageResult[] }
  | {
      id: string;
      kind: "imagesToPdf";
      images: Array<{ bytes: Uint8Array; mimeType: "image/jpeg" | "image/png" }>;
      options?: ImagesToPdfOptions;
    }
  | { id: string; kind: "applyEditorObjects"; bytes: Uint8Array; objects: EditorObject[] }
  | { id: string; kind: "applyPageAdvanced"; bytes: Uint8Array; options: PageAdvancedOptions }
  | { id: string; kind: "applyRedaction"; bytes: Uint8Array; options: ApplyRedactionOptions }
  | { id: string; kind: "buildAcroForm"; bytes: Uint8Array; fields: FormField[] }
  | { id: string; kind: "fillFormFields"; bytes: Uint8Array; values: Record<string, FillValue>; flatten?: boolean }
  | { id: string; kind: "cancel" };

export type PdfWorkerResponse =
  | { id: string; kind: "progress"; done: number; total: number; stage: string }
  | { id: string; kind: "result"; bytes: Uint8Array }
  | { id: string; kind: "resultMany"; documents: Uint8Array[] }
  | { id: string; kind: "resultCompression"; result: import("../lib/pdf/operations").CompressionResult }
  | {
      id: string;
      kind: "resultForm";
      bytes: Uint8Array;
      signaturePlaceholders: Array<{ name: string; pageIndex: number }>;
      hadXFA: boolean;
    }
  | { id: string; kind: "resultFill"; bytes: Uint8Array; skippedReadOnly: string[] }
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
      case "splitByPageGroups": {
        const documents = await splitByPageGroups(msg.bytes, msg.groups, onProgress, token);
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
        const bytes = await imagesToPdf(msg.images, onProgress, token, msg.options);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "compressBasic": {
        const result = await compressBasic(msg.bytes, msg.options, onProgress, token);
        response = { id: msg.id, kind: "resultCompression", result };
        break;
      }
      case "addVisualSignature": {
        const bytes = await addVisualSignature(msg.bytes, msg.options, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "addSearchableTextLayer": {
        const bytes = await addSearchableTextLayer(msg.bytes, msg.pages, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "applyEditorObjects": {
        const bytes = await applyEditorObjects(msg.bytes, { objects: msg.objects }, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "applyPageAdvanced": {
        const bytes = await applyPageAdvancedOperations(msg.bytes, msg.options, onProgress, token);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "applyRedaction": {
        const bytes = await applyRedactionRaster(msg.bytes, msg.options);
        response = { id: msg.id, kind: "result", bytes };
        break;
      }
      case "buildAcroForm": {
        const built = await buildAcroForm(msg.bytes, msg.fields);
        response = {
          id: msg.id,
          kind: "resultForm",
          bytes: built.bytes,
          signaturePlaceholders: built.signaturePlaceholders,
          hadXFA: built.hadXFA,
        };
        break;
      }
      case "fillFormFields": {
        const filled = await fillFormFields(msg.bytes, { values: msg.values, flatten: msg.flatten });
        response = { id: msg.id, kind: "resultFill", bytes: filled.bytes, skippedReadOnly: filled.skippedReadOnly };
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

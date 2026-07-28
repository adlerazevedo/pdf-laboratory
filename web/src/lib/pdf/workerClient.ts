import type { PdfWorkerRequest, PdfWorkerResponse } from "../../workers/pdfWorker";
import type { CompressionResult } from "./operations";
import type { OperationProgress } from "./types";
import { OperationCancelledError } from "./types";

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

// Uma única instância de worker é reaproveitada para todas as operações
// (evita o custo de recriar o worker — e o bundle da lib de PDF — a cada clique).
let worker: Worker | null = null;
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../../workers/pdfWorker.ts", import.meta.url), { type: "module" });
  }
  return worker;
}

let requestCounter = 0;
function nextId(): string {
  requestCounter += 1;
  return `op_${Date.now()}_${requestCounter}`;
}

export interface RunOptions {
  onProgress?: (progress: OperationProgress) => void;
}

/** Envia uma requisição ao Web Worker de PDF e resolve quando o resultado chegar. */
export function runInWorker<
  T extends
    | { bytes: Uint8Array }
    | { documents: Uint8Array[] }
    | { result: CompressionResult }
    | { bytes: Uint8Array; signaturePlaceholders: Array<{ name: string; pageIndex: number }>; hadXFA: boolean }
    | { bytes: Uint8Array; skippedReadOnly: string[] },
>(
  request: DistributiveOmit<PdfWorkerRequest, "id">,
  options: RunOptions = {},
): { promise: Promise<T>; cancel: () => void } {
  const id = nextId();
  const w = getWorker();

  const promise = new Promise<T>((resolve, reject) => {
    const handleMessage = (event: MessageEvent<PdfWorkerResponse>) => {
      const msg = event.data;
      if (msg.id !== id) return;
      if (msg.kind === "progress") {
        options.onProgress?.({ done: msg.done, total: msg.total, stage: msg.stage });
      } else if (msg.kind === "result") {
        cleanup();
        resolve({ bytes: msg.bytes } as T);
      } else if (msg.kind === "resultMany") {
        cleanup();
        resolve({ documents: msg.documents } as T);
      } else if (msg.kind === "resultCompression") {
        cleanup();
        resolve({ result: msg.result } as T);
      } else if (msg.kind === "resultForm") {
        cleanup();
        resolve({ bytes: msg.bytes, signaturePlaceholders: msg.signaturePlaceholders, hadXFA: msg.hadXFA } as T);
      } else if (msg.kind === "resultFill") {
        cleanup();
        resolve({ bytes: msg.bytes, skippedReadOnly: msg.skippedReadOnly } as T);
      } else if (msg.kind === "error") {
        cleanup();
        if (msg.name === "OperationCancelledError") reject(new OperationCancelledError());
        else reject(new Error(msg.message));
      }
    };
    const cleanup = () => w.removeEventListener("message", handleMessage);
    w.addEventListener("message", handleMessage);
    w.postMessage({ ...request, id } as PdfWorkerRequest);
  });

  const cancel = () => w.postMessage({ id, kind: "cancel" } satisfies PdfWorkerRequest);

  return { promise, cancel };
}

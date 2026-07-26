import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import type { OperationProgress } from "../../lib/pdf/types";

interface QueuedFile {
  file: File;
  id: string;
}

type Status = "idle" | "processing" | "done" | "error";

export function MergeTool() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  function addFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles.map((file) => ({ file, id: `${file.name}_${file.size}_${Math.random()}` }))]);
  }

  function move(index: number, direction: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function runMerge() {
    setStatus("processing");
    setError(null);
    setProgress({ done: 0, total: files.length, stage: "Lendo arquivos" });
    try {
      const buffers = await Promise.all(files.map((f) => f.file.arrayBuffer()));
      const documents = buffers.map((b) => new Uint8Array(b));
      const { promise, cancel } = runInWorker<{ bytes: Uint8Array }>(
        { kind: "mergeDocuments", documents },
        { onProgress: setProgress },
      );
      setCancelFn(() => cancel);
      const { bytes } = await promise;
      setResult({ bytes, name: "documento-unido.pdf" });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      setCancelFn(null);
    }
  }

  function reset() {
    setFiles([]);
    setStatus("idle");
    setResult(null);
    setError(null);
    setProgress(null);
  }

  return (
    <div>
      <ScreenHeader title="Unir PDFs" description="Combine vários arquivos PDF em um único documento, na ordem escolhida abaixo." />

      {status === "idle" && (
        <>
          <DropZone multiple onFilesAccepted={addFiles} hint="Solte um ou mais arquivos PDF, ou clique para selecionar" />

          {files.length > 0 && (
            <div className="card" style={{ marginTop: "var(--space-4)", padding: "var(--space-3)" }}>
              {files.map((f, i) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "6px 4px", borderBottom: i < files.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ flex: 1, fontSize: 13 }} title={f.file.name}>{i + 1}. {f.file.name}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>{(f.file.size / 1024).toFixed(0)} KB</span>
                  <button type="button" className="btn-text" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima">↑</button>
                  <button type="button" className="btn-text" onClick={() => move(i, 1)} disabled={i === files.length - 1} aria-label="Mover para baixo">↓</button>
                  <button type="button" className="btn-text" onClick={() => remove(f.id)} aria-label="Remover">Remover</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "var(--space-4)" }}>
            <button type="button" className="btn btn-primary" disabled={files.length < 2} onClick={() => void runMerge()}>
              Unir {files.length > 0 ? `(${files.length} arquivos)` : ""}
            </button>
          </div>
          {files.length === 1 && <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>Adicione ao menos 2 arquivos para unir.</p>}
        </>
      )}

      {status === "processing" && progress && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 480 }}>
          <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />
          <button type="button" className="btn" style={{ marginTop: "var(--space-3)" }} onClick={() => cancelFn?.()}>Cancelar</button>
        </div>
      )}

      {status === "done" && result && (
        <ResultCard fileName={result.name} sizeBytes={result.bytes.length} onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")} onRunAgain={reset} />
      )}

      {status === "error" && error && (
        <InlineAlert level="danger" title="Não foi possível unir os arquivos" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}

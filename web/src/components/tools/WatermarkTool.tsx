import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";

export function WatermarkTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("CONFIDENCIAL");
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setStatus("loaded");
      setError(null);
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError(String(e));
      setStatus("error");
    }
  }

  async function run() {
    if (!bytes || !text.trim()) return;
    setStatus("processing");
    setError(null);
    setProgress({ done: 0, total: 0, stage: "Aplicando marca d'água" });
    try {
      const { promise, cancel } = runInWorker<{ bytes: Uint8Array }>(
        { kind: "addWatermark", bytes, options: { text: text.trim() } },
        { onProgress: setProgress },
      );
      setCancelFn(() => cancel);
      const { bytes: outBytes } = await promise;
      const base = fileName.replace(/\.pdf$/i, "");
      setResult({ bytes: outBytes, name: `${base}-marca-dagua.pdf` });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      setCancelFn(null);
    }
  }

  function reset() {
    setStatus("idle");
    setBytes(null);
    setResult(null);
    setError(null);
    setProgress(null);
  }

  return (
    <div>
      <ScreenHeader title="Marca d'água" description="Aplique um texto sobreposto, em diagonal, em todas as páginas do documento." />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loaded" && bytes && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 480 }}>
          <p style={{ margin: "0 0 var(--space-2)" }}>{fileName}</p>
          <label htmlFor="wm-text" style={{ display: "block", fontSize: 13, marginBottom: 4, color: "var(--text-2)" }}>Texto da marca d'água</label>
          <input
            id="wm-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%", height: "var(--control-height)", padding: "0 var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />
          <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" disabled={!text.trim()} onClick={() => void run()}>Aplicar</button>
            <button type="button" className="btn" onClick={reset}>Trocar arquivo</button>
          </div>
        </div>
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
        <InlineAlert level="danger" title="Não foi possível aplicar a marca d'água" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}

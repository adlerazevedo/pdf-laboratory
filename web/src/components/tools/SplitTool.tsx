import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { runInWorker } from "../../lib/pdf/workerClient";
import { buildZip, downloadBytes } from "../../lib/pdf/zip";
import { parsePageRanges } from "../../lib/parseRanges";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";

export function SplitTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [rangesInput, setRangesInput] = useState("");
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
      setPageCount(doc.pageCount);
      setRangesInput(`1-${doc.pageCount}`);
      setStatus("loaded");
      setError(null);
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha. Ainda não é possível dividir arquivos protegidos nesta versão web.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError(String(e));
      setStatus("error");
    }
  }

  async function runSplit() {
    if (!bytes) return;
    const { ranges, error: parseError } = parsePageRanges(rangesInput, pageCount);
    if (parseError) {
      setError(parseError);
      setStatus("error");
      return;
    }
    setStatus("processing");
    setError(null);
    setProgress({ done: 0, total: ranges.length, stage: "Preparando" });
    try {
      const { promise, cancel } = runInWorker<{ documents: Uint8Array[] }>(
        { kind: "splitByRanges", bytes, ranges },
        { onProgress: setProgress },
      );
      setCancelFn(() => cancel);
      const { documents } = await promise;
      const base = fileName.replace(/\.pdf$/i, "");
      const zipBytes = await buildZip(documents.map((doc, i) => ({ fileName: `${base}-parte-${i + 1}.pdf`, bytes: doc })));
      setResult({ bytes: zipBytes, name: `${base}-dividido.zip` });
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
      <ScreenHeader title="Dividir PDF" description="Separe um PDF em vários arquivos, por intervalos de página. Cada parte vira um arquivo dentro de um .zip." />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loaded" && bytes && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 480 }}>
          <p style={{ margin: "0 0 var(--space-2)" }}>{fileName} — {pageCount} páginas</p>
          <label htmlFor="ranges" style={{ display: "block", fontSize: 13, marginBottom: 4, color: "var(--text-2)" }}>
            Intervalos de página (ex.: 1-3, 5, 8-10)
          </label>
          <input
            id="ranges"
            value={rangesInput}
            onChange={(e) => setRangesInput(e.target.value)}
            style={{ width: "100%", height: "var(--control-height)", padding: "0 var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />
          <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" onClick={() => void runSplit()}>Dividir</button>
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
        <ResultCard fileName={result.name} sizeBytes={result.bytes.length} onDownload={() => downloadBytes(result.bytes, result.name, "application/zip")} onRunAgain={reset} />
      )}

      {status === "error" && error && (
        <InlineAlert level="danger" title="Não foi possível dividir o arquivo" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}

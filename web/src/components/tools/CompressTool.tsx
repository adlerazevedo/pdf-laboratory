import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import type { CompressionLevel, CompressionResult } from "../../lib/pdf/operations";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";

const LEVEL_INFO: Record<CompressionLevel, { label: string; description: string }> = {
  light: { label: "Leve", description: "Reduz pouco a qualidade das imagens; melhor para preservar a aparência original." },
  medium: { label: "Média", description: "Equilíbrio entre redução de tamanho e qualidade visual das imagens." },
  strong: { label: "Forte", description: "Reduz mais a resolução e a qualidade das imagens; maior chance de redução de tamanho, mais perda visível." },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function CompressTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
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
    if (!bytes) return;
    setStatus("processing");
    setError(null);
    setProgress({ done: 0, total: 0, stage: "Analisando imagens do documento" });
    try {
      const { promise, cancel } = runInWorker<{ result: CompressionResult }>(
        { kind: "compressBasic", bytes, options: { level } },
        { onProgress: setProgress },
      );
      setCancelFn(() => cancel);
      const { result: compressionResult } = await promise;
      setResult(compressionResult);
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

  const reduced = result ? result.compressedSize < result.originalSize : false;
  const changePct = result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : 0;

  return (
    <div>
      <ScreenHeader title="Compressão básica" description="Reduz o tamanho recomprimindo as imagens JPEG já existentes no PDF, processado localmente no navegador." />

      <InlineAlert
        level="info"
        title="Isto não é a otimização avançada do aplicativo desktop"
        message="Esta ferramenta recomprime apenas imagens JPEG dentro do PDF. Não remove fontes não usadas, não reotimiza streams de conteúdo, e não garante redução de tamanho — um PDF sem imagens, ou já bem otimizado, pode não encolher. Para compressão mais completa (Ghostscript), use o aplicativo desktop."
      />

      <div style={{ height: "var(--space-4)" }} />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loaded" && bytes && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 520 }}>
          <p style={{ margin: "0 0 var(--space-3)" }}>{fileName} — {formatSize(bytes.length)}</p>

          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 13, marginBottom: 6, color: "var(--text-2)" }}>Nível de compressão</legend>
            {(Object.keys(LEVEL_INFO) as CompressionLevel[]).map((lvl) => (
              <label key={lvl} style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", padding: "6px 0", cursor: "pointer" }}>
                <input type="radio" name="compression-level" checked={level === lvl} onChange={() => setLevel(lvl)} style={{ marginTop: 4 }} />
                <span>
                  <strong>{LEVEL_INFO[lvl].label}</strong>
                  <br />
                  <span className="text-muted" style={{ fontSize: 12 }}>{LEVEL_INFO[lvl].description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" onClick={() => void run()}>Comprimir</button>
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
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 520 }}>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--success)" }}>Concluído</p>
          <p style={{ margin: "4px 0 0" }}>
            {formatSize(result.originalSize)} → {formatSize(result.compressedSize)}
            {reduced ? ` (redução de ${changePct}%)` : " (sem redução de tamanho neste documento)"}
          </p>
          <p className="text-muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
            {result.imagesFound === 0
              ? "Nenhuma imagem JPEG recomprimível foi encontrada neste documento."
              : `${result.imagesRecompressed} de ${result.imagesFound} imagem${result.imagesFound > 1 ? "s" : ""} JPEG foi${result.imagesRecompressed === 1 ? "" : "ram"} recomprimida${result.imagesRecompressed === 1 ? "" : "s"}.`}
          </p>
          {!reduced && (
            <InlineAlert
              level="warning"
              title="Este documento não encolheu"
              message="Isso acontece quando não há imagens JPEG recomprimíveis (ou elas já estão bem comprimidas). A compressão básica não altera texto, fontes ou vetores."
            />
          )}
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => downloadBytes(result.bytes, `${fileName.replace(/\.pdf$/i, "")}-comprimido.pdf`, "application/pdf")}
            >
              Baixar
            </button>
            <button type="button" className="btn" onClick={reset}>Executar novamente</button>
          </div>
        </div>
      )}

      {status === "error" && error && (
        <InlineAlert level="danger" title="Não foi possível comprimir o documento" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { renderPageForOcr } from "../../lib/pdf/thumbnails";
import { recognizeCanvas, type OcrLanguage } from "../../lib/pdf/ocr";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { parsePageRanges } from "../../lib/parseRanges";
import type { OcrPageResult } from "../../lib/pdf/operations";
import type { CancelToken, OperationProgress } from "../../lib/pdf/types";
import { OperationCancelledError } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";
type PagesMode = "all" | "custom";

const OCR_DPI = 200;

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "var(--control-height)",
  padding: "0 var(--space-3)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
};

export function OcrTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);

  const [lang, setLang] = useState<OcrLanguage>("por");
  const [pagesMode, setPagesMode] = useState<PagesMode>("all");
  const [customPages, setCustomPages] = useState("");

  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelTokenRef = useRef<CancelToken | null>(null);

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setPageCount(doc.pageCount);
      setStatus("loaded");
      setError(null);
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError(String(e));
      setStatus("error");
    }
  }

  function pagesError(): string | null {
    if (pagesMode !== "custom") return null;
    return parsePageRanges(customPages, pageCount).error;
  }

  function resolvePageIndices(): number[] {
    if (pagesMode === "all") return Array.from({ length: pageCount }, (_, i) => i);
    const { ranges } = parsePageRanges(customPages, pageCount);
    const set = new Set<number>();
    for (const r of ranges) for (let i = r.start; i <= r.end; i++) set.add(i);
    return Array.from(set).sort((a, b) => a - b);
  }

  async function run() {
    if (!bytes) return;
    const targetPages = resolvePageIndices();
    if (targetPages.length === 0) {
      setError("Selecione ao menos uma página para o OCR.");
      setStatus("error");
      return;
    }

    setStatus("processing");
    setError(null);
    const cancelToken: CancelToken = { cancelled: false };
    cancelTokenRef.current = cancelToken;

    try {
      const pageResults: OcrPageResult[] = [];
      for (let i = 0; i < targetPages.length; i++) {
        if (cancelToken.cancelled) throw new OperationCancelledError();
        const pageIndex = targetPages[i];
        setProgress({ done: i, total: targetPages.length, stage: `Preparando página ${pageIndex + 1} (${i + 1} de ${targetPages.length})` });

        const { canvas, pageWidthPt, pageHeightPt } = await renderPageForOcr(bytes, pageIndex, OCR_DPI);
        const scale = OCR_DPI / 72;

        const words = await recognizeCanvas(
          canvas,
          lang,
          (p) => {
            const pct = Math.round(p.progress * 100);
            setProgress({ done: i, total: targetPages.length, stage: `Reconhecendo texto — página ${pageIndex + 1} (${i + 1} de ${targetPages.length}) — ${p.status} ${pct}%` });
          },
          cancelToken,
        );

        pageResults.push({
          pageIndex,
          words: words.map((w) => ({
            text: w.text,
            xPt: w.bbox.x0 / scale,
            yPt: pageHeightPt - w.bbox.y1 / scale,
            widthPt: (w.bbox.x1 - w.bbox.x0) / scale,
            heightPt: (w.bbox.y1 - w.bbox.y0) / scale,
          })),
        });
        void pageWidthPt;
        setProgress({ done: i + 1, total: targetPages.length, stage: `Página ${pageIndex + 1} concluída (${i + 1} de ${targetPages.length})` });
      }

      if (cancelToken.cancelled) throw new OperationCancelledError();
      setProgress({ done: targetPages.length, total: targetPages.length, stage: "Montando o PDF pesquisável" });
      const { promise } = runInWorker<{ bytes: Uint8Array }>({ kind: "addSearchableTextLayer", bytes, pages: pageResults });
      const { bytes: outBytes } = await promise;
      const base = fileName.replace(/\.pdf$/i, "");
      setResult({ bytes: outBytes, name: `${base}-pesquisavel.pdf` });
      setStatus("done");
    } catch (e) {
      if (e instanceof OperationCancelledError) {
        setStatus("loaded");
        setProgress(null);
      } else {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    } finally {
      cancelTokenRef.current = null;
    }
  }

  function cancel() {
    if (cancelTokenRef.current) cancelTokenRef.current.cancelled = true;
  }

  function reset() {
    setStatus("idle");
    setBytes(null);
    setResult(null);
    setError(null);
    setProgress(null);
  }

  const pgError = pagesError();

  return (
    <div>
      <ScreenHeader title="OCR (texto pesquisável)" description="Reconhecimento de texto via Tesseract.js, processado localmente no seu navegador." />

      <InlineAlert
        level="info"
        title="Antes de começar: leia isto"
        message="Na primeira vez que você usar cada idioma, o navegador baixa o motor de OCR e o modelo do idioma (alguns megabytes, de uma rede de distribuição de conteúdo) — isto é o motor do Tesseract.js, nunca o seu documento, que nunca sai do navegador. O processamento é mais lento e a qualidade é inferior ao OCRmyPDF do aplicativo desktop, especialmente em digitalizações de baixa qualidade. Documentos grandes podem demorar bastante — evite fechar a aba enquanto processa."
      />

      <div style={{ height: "var(--space-4)" }} />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loaded" && bytes && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 560 }}>
          <div className="card" style={{ padding: "var(--space-4)" }}>
            <p style={{ margin: "0 0 var(--space-3)" }}>{fileName} — {pageCount} páginas</p>

            <label style={{ fontSize: 13, display: "block", marginBottom: "var(--space-3)" }}>
              Idioma
              <select value={lang} onChange={(e) => setLang(e.target.value as OcrLanguage)} style={{ ...inputStyle, marginTop: 4 }}>
                <option value="por">Português</option>
                <option value="eng">Inglês</option>
              </select>
            </label>

            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 13, marginBottom: 4, color: "var(--text-2)" }}>Páginas</legend>
              <label style={{ display: "block", fontSize: 13 }}>
                <input type="radio" name="ocr-pages" checked={pagesMode === "all"} onChange={() => setPagesMode("all")} /> Todas as páginas
              </label>
              <label style={{ display: "block", fontSize: 13 }}>
                <input type="radio" name="ocr-pages" checked={pagesMode === "custom"} onChange={() => setPagesMode("custom")} /> Intervalo personalizado
              </label>
              {pagesMode === "custom" && (
                <input
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  placeholder="ex.: 1-3, 5"
                  style={{ ...inputStyle, marginTop: 6, maxWidth: 220 }}
                />
              )}
              {pgError && <p style={{ color: "var(--danger)", fontSize: 12, margin: "4px 0 0" }} role="alert">{pgError}</p>}
              {pagesMode === "all" && pageCount > 10 && (
                <p className="text-muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
                  {pageCount} páginas podem levar vários minutos. Considere selecionar um intervalo menor.
                </p>
              )}
            </fieldset>
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" disabled={!!pgError} onClick={() => void run()}>Executar OCR</button>
            <button type="button" className="btn" onClick={reset}>Trocar arquivo</button>
          </div>
        </div>
      )}

      {status === "processing" && progress && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 520 }}>
          <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />
          <button type="button" className="btn" style={{ marginTop: "var(--space-3)" }} onClick={cancel}>Cancelar</button>
        </div>
      )}

      {status === "done" && result && (
        <ResultCard
          fileName={result.name}
          sizeBytes={result.bytes.length}
          note="O texto reconhecido é invisível (sobreposto ao original) — a aparência do documento não muda, mas ele passa a ser pesquisável e o texto pode ser selecionado/copiado."
          onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")}
          onRunAgain={reset}
        />
      )}

      {status === "error" && error && (
        <InlineAlert level="danger" title="Não foi possível concluir o OCR" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}

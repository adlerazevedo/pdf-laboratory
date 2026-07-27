import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { renderPageToCanvas } from "../../lib/pdf/thumbnails";
import { canvasToBlob, blobToUint8Array, buildPageImageFileName } from "../../lib/pdf/pageExport";
import { buildZip, downloadBytes } from "../../lib/pdf/zip";
import { parsePageRanges } from "../../lib/parseRanges";
import { createCancelToken } from "../../lib/pdf/types";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";
type ImageFormat = "png" | "jpg";

interface ExportedImage {
  fileName: string;
  bytes: Uint8Array;
  previewUrl: string;
}

const DPI_OPTIONS = [72, 96, 150, 200, 300] as const;

export function PdfToImagesTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [pagesInput, setPagesInput] = useState("");
  const [format, setFormat] = useState<ImageFormat>("png");
  const [dpi, setDpi] = useState<(typeof DPI_OPTIONS)[number]>(150);
  const [quality, setQuality] = useState(0.85);
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [images, setImages] = useState<ExportedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancelToken, setCancelToken] = useState<ReturnType<typeof createCancelToken> | null>(null);

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setPageCount(doc.pageCount);
      setPagesInput(`1-${doc.pageCount}`);
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
    const { ranges, error: parseError } = parsePageRanges(pagesInput, pageCount);
    if (parseError) {
      setError(parseError);
      setStatus("error");
      return;
    }
    const pageIndices = ranges.flatMap((r) => Array.from({ length: r.end - r.start + 1 }, (_, k) => r.start + k));
    if (pageIndices.length === 0) {
      setError("Selecione ao menos uma página.");
      setStatus("error");
      return;
    }
    const token = createCancelToken();
    setCancelToken(token);
    setStatus("processing");
    setError(null);
    setImages([]);
    setProgress({ done: 0, total: pageIndices.length, stage: "Renderizando páginas" });
    try {
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const ext = format === "png" ? "png" : "jpg";
      const results: ExportedImage[] = [];
      for (let i = 0; i < pageIndices.length; i++) {
        if (token.cancelled) throw new Error("__cancelled__");
        const pageIndex = pageIndices[i];
        const canvas = await renderPageToCanvas(bytes, pageIndex, dpi);
        const blob = await canvasToBlob(canvas, mimeType, format === "jpg" ? quality : undefined);
        const outBytes = await blobToUint8Array(blob);
        const outName = buildPageImageFileName(fileName, pageIndex + 1, pageCount, ext);
        results.push({ fileName: outName, bytes: outBytes, previewUrl: URL.createObjectURL(blob) });
        setProgress({ done: i + 1, total: pageIndices.length, stage: `Página ${pageIndex + 1}` });
      }
      setImages(results);
      setStatus("done");
    } catch (e) {
      if (e instanceof Error && e.message === "__cancelled__") {
        setStatus("loaded");
      } else {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    } finally {
      setCancelToken(null);
    }
  }

  function cancel() {
    if (cancelToken) cancelToken.cancelled = true;
  }

  async function downloadAllAsZip() {
    const zipBytes = await buildZip(images.map((img) => ({ fileName: img.fileName, bytes: img.bytes })));
    const base = fileName.replace(/\.pdf$/i, "") || "documento";
    downloadBytes(zipBytes, `${base}-imagens.zip`, "application/zip");
  }

  function reset() {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setStatus("idle");
    setBytes(null);
    setImages([]);
    setError(null);
    setProgress(null);
  }

  return (
    <div>
      <ScreenHeader title="PDF em imagens" description="Exporte cada página como uma imagem PNG ou JPEG." />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loaded" && bytes && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 480, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <p style={{ margin: 0 }}>{fileName} — {pageCount} páginas</p>
          <label style={{ fontSize: 13 }}>
            Páginas a exportar (ex.: 1-3, 5, 8-10)
            <input
              value={pagesInput}
              onChange={(e) => setPagesInput(e.target.value)}
              style={{ display: "block", width: "100%", height: "var(--control-height)", marginTop: 4, padding: "0 var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            Formato
            <select value={format} onChange={(e) => setFormat(e.target.value as ImageFormat)} style={{ display: "block", width: "100%", height: "var(--control-height)", marginTop: 4, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
              <option value="png">PNG (sem perda)</option>
              <option value="jpg">JPEG (com compressão)</option>
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            Resolução
            <select value={dpi} onChange={(e) => setDpi(Number(e.target.value) as (typeof DPI_OPTIONS)[number])} style={{ display: "block", width: "100%", height: "var(--control-height)", marginTop: 4, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
              {DPI_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} DPI{d === 150 ? " (recomendado)" : ""}</option>
              ))}
            </select>
          </label>
          {format === "jpg" && (
            <label style={{ fontSize: 13 }}>
              Qualidade JPEG ({Math.round(quality * 100)}%)
              <input type="range" min={0.4} max={1} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={{ display: "block", width: "100%", marginTop: 4 }} />
            </label>
          )}
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" onClick={() => void run()}>Gerar imagens</button>
            <button type="button" className="btn" onClick={reset}>Trocar arquivo</button>
          </div>
          {error && <InlineAlert level="danger" title="Não foi possível gerar as imagens" message={error} />}
        </div>
      )}

      {status === "processing" && progress && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 480 }}>
          <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />
          <button type="button" className="btn" style={{ marginTop: "var(--space-3)" }} onClick={cancel}>Cancelar</button>
        </div>
      )}

      {status === "done" && images.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 640 }}>
          <div className="card" style={{ padding: "var(--space-4)" }}>
            <p style={{ margin: "0 0 var(--space-3)", fontWeight: 600, color: "var(--success)" }}>
              {images.length} {images.length > 1 ? "imagens geradas" : "imagem gerada"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
              {images.map((img) => (
                <div key={img.fileName} style={{ width: 110, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <img src={img.previewUrl} alt={img.fileName} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                  <button type="button" className="btn-text" style={{ width: "100%", fontSize: 11, padding: 4 }} onClick={() => downloadBytes(img.bytes, img.fileName, format === "png" ? "image/png" : "image/jpeg")}>
                    Baixar
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" onClick={() => void downloadAllAsZip()}>Baixar tudo (.zip)</button>
            <button type="button" className="btn" onClick={reset}>Executar novamente</button>
          </div>
        </div>
      )}

      {status === "error" && error && (
        <InlineAlert level="danger" title="Não foi possível processar o PDF" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}

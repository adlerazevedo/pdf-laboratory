import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { Icon } from "../Icon";
import { validateImageFile } from "../../lib/pdf/validation";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { markSessionActive } from "../../lib/sessionActivity";
import type {
  ImagesToPdfFit,
  ImagesToPdfOptions,
  ImagesToPdfOrientation,
  ImagesToPdfPageSize,
} from "../../lib/pdf/operations";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  mimeType: "image/png" | "image/jpeg";
}

const MM_TO_PT = 72 / 25.4;

export function ImagesToPdfTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<ImagesToPdfPageSize>("auto");
  const [orientation, setOrientation] = useState<ImagesToPdfOrientation>("auto");
  const [marginMm, setMarginMm] = useState(10);
  const [fit, setFit] = useState<ImagesToPdfFit>("contain");
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  function handleFiles(files: File[]) {
    const items: ImageItem[] = files.map((file) => ({
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      mimeType: file.type === "image/png" ? "image/png" : "image/jpeg",
    }));
    setImages((prev) => [...prev, ...items]);
    setStatus("loaded");
    setError(null);
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) setStatus("idle");
      return next;
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    setImages((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  async function run() {
    if (images.length === 0) return;
    markSessionActive();
    setStatus("processing");
    setError(null);
    setProgress({ done: 0, total: images.length, stage: "Lendo imagens" });
    try {
      const payload = await Promise.all(
        images.map(async (item) => ({
          bytes: new Uint8Array(await item.file.arrayBuffer()),
          mimeType: item.mimeType,
        })),
      );
      const options: ImagesToPdfOptions = {
        pageSize,
        orientation,
        fit,
        marginPt: pageSize === "auto" ? 0 : marginMm * MM_TO_PT,
      };
      const { promise, cancel } = runInWorker<{ bytes: Uint8Array }>(
        { kind: "imagesToPdf", images: payload, options },
        { onProgress: setProgress },
      );
      setCancelFn(() => cancel);
      const { bytes } = await promise;
      setResult({ bytes, name: "imagens-para-pdf.pdf" });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      setCancelFn(null);
    }
  }

  function reset() {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    setResult(null);
    setError(null);
    setProgress(null);
    setStatus("idle");
  }

  return (
    <div>
      <ScreenHeader title="Imagens em PDF" description="Transforme imagens JPEG ou PNG em um PDF, uma por página." />

      {status === "idle" && (
        <DropZone
          onFilesAccepted={handleFiles}
          multiple
          accept="image/png,image/jpeg"
          validate={validateImageFile}
          hint="Solte uma ou mais imagens JPEG/PNG, ou clique para selecionar"
        />
      )}

      {(status === "loaded" || status === "error") && images.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 640 }}>
          <div className="card" style={{ padding: "var(--space-4)" }}>
            <p style={{ margin: "0 0 var(--space-3)", fontWeight: 600 }}>
              {images.length} {images.length > 1 ? "imagens" : "imagem"} — arraste para reordenar
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
              {images.map((img, index) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    width: 96,
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    background: "var(--surface-2)",
                    cursor: "grab",
                  }}
                >
                  <img src={img.previewUrl} alt={`Imagem ${index + 1}: ${img.file.name}`} style={{ width: "100%", height: 96, objectFit: "cover", display: "block" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px" }}>
                    <span style={{ fontSize: 11 }}>{index + 1}</span>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button type="button" aria-label="Mover para cima na ordem" className="btn-text" style={{ padding: 2 }} onClick={() => moveImage(index, -1)} disabled={index === 0}>↑</button>
                      <button type="button" aria-label="Mover para baixo na ordem" className="btn-text" style={{ padding: 2 }} onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>↓</button>
                      <button type="button" aria-label={`Remover imagem ${index + 1}`} className="btn-text" style={{ padding: 2, color: "var(--danger)" }} onClick={() => removeImage(img.id)}>
                        <Icon kind="trash" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DropZone onFilesAccepted={handleFiles} multiple accept="image/png,image/jpeg" validate={validateImageFile} hint="Adicionar mais imagens" />
          </div>

          <div className="card" style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Layout da página</p>
            <label style={{ fontSize: 13 }}>
              Tamanho da página
              <select value={pageSize} onChange={(e) => setPageSize(e.target.value as ImagesToPdfPageSize)} style={{ display: "block", width: "100%", height: "var(--control-height)", marginTop: 4, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                <option value="auto">Automático (tamanho da própria imagem)</option>
                <option value="a4">A4</option>
                <option value="letter">Carta (Letter)</option>
              </select>
            </label>
            {pageSize !== "auto" && (
              <>
                <label style={{ fontSize: 13 }}>
                  Orientação
                  <select value={orientation} onChange={(e) => setOrientation(e.target.value as ImagesToPdfOrientation)} style={{ display: "block", width: "100%", height: "var(--control-height)", marginTop: 4, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                    <option value="auto">Automática (conforme cada imagem)</option>
                    <option value="portrait">Retrato</option>
                    <option value="landscape">Paisagem</option>
                  </select>
                </label>
                <label style={{ fontSize: 13 }}>
                  Margem ({marginMm} mm)
                  <input type="range" min={0} max={40} value={marginMm} onChange={(e) => setMarginMm(Number(e.target.value))} style={{ display: "block", width: "100%", marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 13 }}>
                  Ajuste da imagem na página
                  <select value={fit} onChange={(e) => setFit(e.target.value as ImagesToPdfFit)} style={{ display: "block", width: "100%", height: "var(--control-height)", marginTop: 4, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                    <option value="contain">Conter (mantém proporção, pode sobrar espaço)</option>
                    <option value="fill">Preencher (ocupa toda a área, pode distorcer)</option>
                  </select>
                </label>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" onClick={() => void run()}>Gerar PDF</button>
            <button type="button" className="btn" onClick={reset}>Recomeçar</button>
          </div>

          {status === "error" && error && (
            <InlineAlert level="danger" title="Não foi possível gerar o PDF" message={error} />
          )}
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
    </div>
  );
}

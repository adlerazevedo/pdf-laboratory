import { useRef, useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { renderPageThumbnail } from "../../lib/pdf/thumbnails";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { validateImageFile } from "../../lib/pdf/validation";
import { parsePageRanges } from "../../lib/parseRanges";
import type { SignaturePosition, VisualSignatureContent } from "../../lib/pdf/operations";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";
type ContentMode = "text" | "draw" | "image";
type PagesMode = "all" | "first" | "custom";

interface PreviewPage {
  dataUrl: string;
  widthPt: number;
  heightPt: number;
}

const POSITION_LABELS: Record<SignaturePosition, string> = {
  "top-left": "Superior esquerdo",
  "top-center": "Superior centro",
  "top-right": "Superior direito",
  "middle-left": "Meio esquerdo",
  "middle-center": "Meio centro",
  "middle-right": "Meio direito",
  "bottom-left": "Inferior esquerdo",
  "bottom-center": "Inferior centro",
  "bottom-right": "Inferior direito",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "var(--control-height)",
  padding: "0 var(--space-3)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
};

/** Mesma lógica de computeStampOrigin do motor (operations.ts), mas devolvendo
 * o topo-esquerda (referencial da pré-visualização) em vez do inferior-esquerda
 * do pdf-lib — usada só para desenhar a prévia, nunca para o PDF final. */
function computePresetTopLeft(
  position: SignaturePosition,
  pageWidth: number,
  pageHeight: number,
  stampWidth: number,
  stampHeight: number,
  margin: number,
): { x: number; y: number } {
  let x: number;
  if (position.endsWith("left")) x = margin;
  else if (position.endsWith("right")) x = pageWidth - stampWidth - margin;
  else x = (pageWidth - stampWidth) / 2;

  let y: number;
  if (position.startsWith("top")) y = margin;
  else if (position.startsWith("bottom")) y = pageHeight - stampHeight - margin;
  else y = (pageHeight - stampHeight) / 2;

  return { x, y };
}

function useCanvasDrawing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1D3557";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function onPointerUp() {
    drawingRef.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function exportPng(): Promise<Uint8Array | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return null;
    return new Uint8Array(await blob.arrayBuffer());
  }

  return { canvasRef, onPointerDown, onPointerMove, onPointerUp, clear, exportPng };
}

export function VisualSignatureTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);

  const [contentMode, setContentMode] = useState<ContentMode>("text");
  const [text, setText] = useState("Assinado eletronicamente");
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [colorHex, setColorHex] = useState("#1D3557");
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  const [imageMime, setImageMime] = useState<"image/png" | "image/jpeg">("image/png");
  const [imageAspect, setImageAspect] = useState(0.4); // altura/largura, atualizado ao carregar a imagem

  const [position, setPosition] = useState<SignaturePosition>("bottom-right");
  const [anchorPt, setAnchorPt] = useState<{ x: number; y: number } | null>(null);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [scalePercent, setScalePercent] = useState(25);
  const [opacityPct, setOpacityPct] = useState(90);
  const [pagesMode, setPagesMode] = useState<PagesMode>("all");
  const [customPages, setCustomPages] = useState("");

  const [previewPage, setPreviewPage] = useState<PreviewPage | null>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  const drawing = useCanvasDrawing();

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setPageCount(doc.pageCount);
      setStatus("loaded");
      setError(null);
      const thumb = await renderPageThumbnail(doc.bytes, 0, { maxWidthPx: 360 });
      setPreviewPage({ dataUrl: thumb.dataUrl, widthPt: thumb.widthPt, heightPt: thumb.heightPt });
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError(String(e));
      setStatus("error");
    }
  }

  async function handleStampImage(files: File[]) {
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const arr = new Uint8Array(arrayBuffer);
    setImageBytes(arr);
    const mime = file.type === "image/jpeg" || file.type === "image/jpg" ? "image/jpeg" : "image/png";
    setImageMime(mime);
    const url = URL.createObjectURL(new Blob([arr.slice().buffer as ArrayBuffer], { type: mime }));
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1, h: 0.4 });
      img.src = url;
    });
    setImageAspect(dims.h / Math.max(1, dims.w));
  }

  function pagesError(): string | null {
    if (pagesMode !== "custom") return null;
    return parsePageRanges(customPages, pageCount).error;
  }

  function resolvePageIndices(): number[] | undefined {
    if (pagesMode === "all") return undefined;
    if (pagesMode === "first") return [0];
    const { ranges } = parsePageRanges(customPages, pageCount);
    const set = new Set<number>();
    for (const r of ranges) for (let i = r.start; i <= r.end; i++) set.add(i);
    return Array.from(set).sort((a, b) => a - b);
  }

  // Dimensões aproximadas do carimbo (em pontos PDF) só para desenhar a prévia —
  // o motor (operations.ts) calcula suas próprias dimensões exatas ao exportar.
  function previewStampSize(): { width: number; height: number } {
    if (!previewPage) return { width: 100, height: 30 };
    const width = (previewPage.widthPt * scalePercent) / 100;
    let aspect = 0.22; // proporção altura/largura padrão para um carimbo de texto de uma linha
    if (contentMode === "image") aspect = imageAspect;
    else if (contentMode === "draw") aspect = 150 / 400;
    return { width, height: Math.max(8, width * aspect) };
  }

  const { width: stampWidthPt, height: stampHeightPt } = previewStampSize();

  const previewOriginTopLeft =
    previewPage &&
    (anchorPt ?? computePresetTopLeft(position, previewPage.widthPt, previewPage.heightPt, stampWidthPt, stampHeightPt, 24));

  function handlePreviewPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!previewPage || !previewBoxRef.current) return;
    const rect = previewBoxRef.current.getBoundingClientRect();
    const scale = rect.width / previewPage.widthPt;

    function toAnchor(clientX: number, clientY: number) {
      const localX = (clientX - rect.left) / scale - stampWidthPt / 2;
      const localY = (clientY - rect.top) / scale - stampHeightPt / 2;
      return {
        x: Math.max(0, Math.min(previewPage!.widthPt - stampWidthPt, localX)),
        y: Math.max(0, Math.min(previewPage!.heightPt - stampHeightPt, localY)),
      };
    }

    setAnchorPt(toAnchor(e.clientX, e.clientY));

    function onMove(ev: PointerEvent) {
      setAnchorPt(toAnchor(ev.clientX, ev.clientY));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function run() {
    if (!bytes) return;
    let content: VisualSignatureContent;
    if (contentMode === "text") {
      if (!text.trim()) {
        setError("Digite o texto da assinatura visual.");
        setStatus("error");
        return;
      }
      const finalText = includeTimestamp ? `${text.trim()} — ${new Date().toLocaleString("pt-BR")}` : text.trim();
      content = { kind: "text", text: finalText, colorHex };
    } else if (contentMode === "draw") {
      const png = await drawing.exportPng();
      if (!png) {
        setError("Desenhe a assinatura antes de aplicar.");
        setStatus("error");
        return;
      }
      content = { kind: "image", bytes: png, mimeType: "image/png" };
    } else {
      if (!imageBytes) {
        setError("Selecione uma imagem para usar como carimbo.");
        setStatus("error");
        return;
      }
      content = { kind: "image", bytes: imageBytes, mimeType: imageMime };
    }

    setStatus("processing");
    setError(null);
    setProgress({ done: 0, total: 0, stage: "Aplicando assinatura visual" });
    try {
      const { promise, cancel } = runInWorker<{ bytes: Uint8Array }>(
        {
          kind: "addVisualSignature",
          bytes,
          options: {
            content,
            position,
            scalePercent,
            opacity: opacityPct / 100,
            pageIndices: resolvePageIndices(),
            anchorPt: anchorPt ?? undefined,
            rotationDeg: rotationDeg || undefined,
          },
        },
        { onProgress: setProgress },
      );
      setCancelFn(() => cancel);
      const { bytes: outBytes } = await promise;
      const base = fileName.replace(/\.pdf$/i, "");
      setResult({ bytes: outBytes, name: `${base}-assinado-visualmente.pdf` });
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
    setImageBytes(null);
    setPreviewPage(null);
    setAnchorPt(null);
    setRotationDeg(0);
    drawing.clear();
  }

  const pgError = pagesError();

  return (
    <div>
      <ScreenHeader title="Assinatura visual (carimbo)" description="Insere uma imagem ou texto de assinatura sobre o documento, processado localmente no navegador." />

      <InlineAlert
        level="warning"
        title="Isto NÃO é uma assinatura digital"
        message="Este recurso aplica apenas uma representação visual. Não constitui assinatura digital ICP-Brasil. É apenas um carimbo visual — sem validade jurídica ou criptográfica, e sem qualquer relação com certificados. Esta ferramenta nunca solicita nem processa arquivos PFX/P12. Para assinatura digital real com certificado ICP-Brasil, use o aplicativo desktop."
      />

      <div style={{ height: "var(--space-4)" }} />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loaded" && bytes && (
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 460, flex: "1 1 380px" }}>
            <div className="card" style={{ padding: "var(--space-4)" }}>
              <p style={{ margin: "0 0 var(--space-3)" }}>{fileName} — {pageCount} páginas</p>

              <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                Tipo de carimbo
                <select value={contentMode} onChange={(e) => setContentMode(e.target.value as ContentMode)} style={{ ...inputStyle, marginTop: 4 }}>
                  <option value="text">Texto</option>
                  <option value="draw">Desenhar</option>
                  <option value="image">Imagem (PNG/JPEG)</option>
                </select>
              </label>

              {contentMode === "text" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                    <label style={{ fontSize: 13, flex: "1 1 220px" }}>
                      Texto
                      <input value={text} onChange={(e) => setText(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
                    </label>
                    <label style={{ fontSize: 13 }}>
                      Cor
                      <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} style={{ display: "block", marginTop: 4, width: 60, height: "var(--control-height)" }} />
                    </label>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <input type="checkbox" checked={includeTimestamp} onChange={(e) => setIncludeTimestamp(e.target.checked)} />
                    Incluir data/hora atual no texto
                  </label>
                </div>
              )}

              {contentMode === "draw" && (
                <div>
                  <canvas
                    ref={drawing.canvasRef}
                    width={400}
                    height={150}
                    aria-label="Área para desenhar a assinatura"
                    onPointerDown={drawing.onPointerDown}
                    onPointerMove={drawing.onPointerMove}
                    onPointerUp={drawing.onPointerUp}
                    onPointerLeave={drawing.onPointerUp}
                    style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", touchAction: "none", background: "#fff", width: "100%", maxWidth: 400, height: 150 }}
                  />
                  <button type="button" className="btn" style={{ marginTop: 6 }} onClick={() => drawing.clear()}>Limpar desenho</button>
                </div>
              )}

              {contentMode === "image" && (
                <DropZone
                  onFilesAccepted={(f) => void handleStampImage(f)}
                  accept="image/png,image/jpeg"
                  validate={validateImageFile}
                  hint="Solte uma imagem PNG ou JPEG"
                />
              )}
            </div>

            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
                <label style={{ fontSize: 13, flex: "1 1 180px" }}>
                  Posição predefinida
                  <select
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value as SignaturePosition);
                      setAnchorPt(null);
                    }}
                    style={{ ...inputStyle, marginTop: 4 }}
                  >
                    {(Object.keys(POSITION_LABELS) as SignaturePosition[]).map((p) => (
                      <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 13, flex: "1 1 160px" }}>
                  Tamanho ({scalePercent}% da largura da página)
                  <input type="range" min={10} max={60} value={scalePercent} onChange={(e) => setScalePercent(Number(e.target.value))} style={{ width: "100%", marginTop: 10 }} />
                </label>
                <label style={{ fontSize: 13, flex: "1 1 160px" }}>
                  Opacidade ({opacityPct}%)
                  <input type="range" min={10} max={100} value={opacityPct} onChange={(e) => setOpacityPct(Number(e.target.value))} style={{ width: "100%", marginTop: 10 }} />
                </label>
                <label style={{ fontSize: 13, flex: "1 1 160px" }}>
                  Rotação ({rotationDeg}°)
                  <input type="range" min={0} max={359} value={rotationDeg} onChange={(e) => setRotationDeg(Number(e.target.value))} style={{ width: "100%", marginTop: 10 }} />
                </label>
              </div>
              {anchorPt && (
                <button type="button" className="btn" style={{ marginTop: "var(--space-2)" }} onClick={() => setAnchorPt(null)}>
                  Redefinir para posição predefinida
                </button>
              )}

              <fieldset style={{ border: "none", padding: 0, margin: "var(--space-3) 0 0" }}>
                <legend style={{ fontSize: 13, marginBottom: 4, color: "var(--text-2)" }}>Páginas</legend>
                <label style={{ display: "block", fontSize: 13 }}>
                  <input type="radio" name="sig-pages" checked={pagesMode === "all"} onChange={() => setPagesMode("all")} /> Todas as páginas
                </label>
                <label style={{ display: "block", fontSize: 13 }}>
                  <input type="radio" name="sig-pages" checked={pagesMode === "first"} onChange={() => setPagesMode("first")} /> Apenas a primeira
                </label>
                <label style={{ display: "block", fontSize: 13 }}>
                  <input type="radio" name="sig-pages" checked={pagesMode === "custom"} onChange={() => setPagesMode("custom")} /> Intervalo personalizado
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
              </fieldset>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button type="button" className="btn btn-primary" disabled={!!pgError} onClick={() => void run()}>Aplicar assinatura visual</button>
              <button type="button" className="btn" onClick={reset}>Trocar arquivo</button>
            </div>
          </div>

          <div className="card" style={{ padding: "var(--space-3)", flex: "1 1 300px", maxWidth: 400 }}>
            <p className="text-muted" style={{ fontSize: 12, margin: "0 0 6px" }}>
              Prévia (página {(resolvePageIndices()?.[0] ?? 0) + 1} · aproximada) — arraste o retângulo para posicionar livremente
            </p>
            {previewPage && previewOriginTopLeft ? (
              <div
                id="SignaturePreviewPage"
                ref={previewBoxRef}
                onPointerDown={handlePreviewPointerDown}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: `${previewPage.widthPt} / ${previewPage.heightPt}`,
                  backgroundImage: `url(${previewPage.dataUrl})`,
                  backgroundSize: "cover",
                  boxShadow: "var(--shadow-card)",
                  background: "#fff",
                  cursor: "grab",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${(previewOriginTopLeft.x / previewPage.widthPt) * 100}%`,
                    top: `${(previewOriginTopLeft.y / previewPage.heightPt) * 100}%`,
                    width: `${(stampWidthPt / previewPage.widthPt) * 100}%`,
                    height: `${(stampHeightPt / previewPage.heightPt) * 100}%`,
                    border: "1.5px dashed var(--accent)",
                    background: "rgba(29,53,87,0.12)",
                    opacity: opacityPct / 100,
                    transform: `rotate(${rotationDeg}deg)`,
                    transformOrigin: "center center",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: 12 }}>Gerando prévia…</p>
            )}
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
        <ResultCard
          fileName={result.name}
          sizeBytes={result.bytes.length}
          onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")}
          onRunAgain={reset}
        />
      )}

      {status === "error" && error && (
        <InlineAlert level="danger" title="Não foi possível aplicar a assinatura visual" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}

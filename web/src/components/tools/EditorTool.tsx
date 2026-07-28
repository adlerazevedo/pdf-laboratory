import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { renderPageThumbnail } from "../../lib/pdf/thumbnails";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { markSessionActive } from "../../lib/sessionActivity";
import {
  alignObjects,
  canRedo,
  canUndo,
  commitHistory,
  createHistory,
  distributeObjects,
  nextObjectId,
  nextZIndex,
  redoHistory,
  snapToGrid,
  undoHistory,
  type AlignMode,
  type EditorHistory,
  type EditorImageObject,
  type EditorObject,
  type EditorTextObject,
  type StandardFontId,
} from "../../lib/pdf/editorTypes";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loading" | "editing" | "processing" | "done" | "error";
type ToolMode = "select" | "text" | "rect" | "ellipse" | "line" | "image";

interface EditorPage {
  pageIndex: number;
  widthPt: number;
  heightPt: number;
  dataUrl: string;
}

const GRID_SIZE = 10;
const DEFAULT_FONT: StandardFontId = "Helvetica";

function makeDefaultObject(kind: Exclude<ToolMode, "select" | "image">, pageIndex: number, x: number, y: number, zIndex: number): EditorObject {
  const base = { id: nextObjectId(), pageIndex, rotationDeg: 0, opacity: 1, zIndex };
  switch (kind) {
    case "text":
      return { ...base, kind: "text", x, y, width: 220, height: 30, text: "Novo texto", fontSize: 18, color: "#182125", font: DEFAULT_FONT, align: "left" };
    case "rect":
      return { ...base, kind: "rect", x, y, width: 140, height: 90, fill: null, stroke: "#147D82", strokeWidth: 2, cornerRadius: 0 };
    case "ellipse":
      return { ...base, kind: "ellipse", x, y, width: 140, height: 90, fill: null, stroke: "#147D82", strokeWidth: 2 };
    case "line":
      return { ...base, kind: "line", x, y, width: 160, height: 0, stroke: "#147D82", strokeWidth: 2 };
    default:
      throw new Error("kind não suportado");
  }
}

export function EditorTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);

  const [history, setHistory] = useState<EditorHistory>(() => createHistory([]));
  const [liveObjects, setLiveObjects] = useState<EditorObject[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<ToolMode>("select");
  const [zoom, setZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const clipboardRef = useRef<EditorObject[] | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pendingImagePageRef = useRef<number | null>(null);
  const pendingImagePointRef = useRef<{ x: number; y: number } | null>(null);

  const objects = liveObjects ?? history.present;

  function commit(next: EditorObject[]) {
    setHistory((h) => commitHistory(h, next));
    setLiveObjects(null);
    markSessionActive();
  }

  function undo() {
    setHistory((h) => undoHistory(h));
    setLiveObjects(null);
  }

  function redo() {
    setHistory((h) => redoHistory(h));
    setLiveObjects(null);
  }

  useEffect(() => {
    // remove da seleção qualquer id que não exista mais no histórico atual (ex.: após undo)
    setSelectedIds((ids) => ids.filter((id) => history.present.some((o) => o.id === id)));
  }, [history.present]);

  useEffect(() => {
    function isEditableTarget(el: EventTarget | null): boolean {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || node.isContentEditable;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (status !== "editing") return;
      const editable = isEditableTarget(e.target);
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y")) {
        e.preventDefault();
        redo();
        return;
      }
      if (editable) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        commit(history.present.filter((o) => !selectedIds.includes(o.id)));
        setSelectedIds([]);
        return;
      }
      if (mod && e.key.toLowerCase() === "d" && selectedIds.length > 0) {
        e.preventDefault();
        duplicateSelection();
        return;
      }
      if (mod && e.key.toLowerCase() === "c" && selectedIds.length > 0) {
        e.preventDefault();
        clipboardRef.current = history.present.filter((o) => selectedIds.includes(o.id));
        return;
      }
      if (mod && e.key.toLowerCase() === "v" && clipboardRef.current) {
        e.preventDefault();
        pasteClipboard();
        return;
      }
      if (e.key.startsWith("Arrow") && selectedIds.length > 0) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -delta : e.key === "ArrowRight" ? delta : 0;
        const dy = e.key === "ArrowUp" ? -delta : e.key === "ArrowDown" ? delta : 0;
        commit(history.present.map((o) => (selectedIds.includes(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o)));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedIds, history.present]);

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setError(null);
      setStatus("loading");
      setProgress({ done: 0, total: doc.pageCount, stage: "Gerando páginas" });
      const built: EditorPage[] = [];
      for (let i = 0; i < doc.pageCount; i++) {
        const thumb = await renderPageThumbnail(doc.bytes, i, { maxWidthPx: 700 });
        built.push({ pageIndex: i, widthPt: thumb.widthPt, heightPt: thumb.heightPt, dataUrl: thumb.dataUrl });
        setProgress({ done: i + 1, total: doc.pageCount, stage: "Gerando páginas" });
      }
      setPages(built);
      setHistory(createHistory([]));
      setSelectedIds([]);
      setStatus("editing");
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha. Remova a senha antes de editar.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError("Não foi possível abrir o arquivo.");
      setStatus("error");
    }
  }

  function pointToPagePt(pageIndex: number, clientX: number, clientY: number): { x: number; y: number } {
    const el = document.getElementById(`editor-page-${pageIndex}`);
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }

  function handlePageClick(pageIndex: number, e: React.MouseEvent) {
    if (mode === "select") {
      if (e.target === e.currentTarget) setSelectedIds([]);
      return;
    }
    const pt = pointToPagePt(pageIndex, e.clientX, e.clientY);
    if (mode === "image") {
      pendingImagePageRef.current = pageIndex;
      pendingImagePointRef.current = pt;
      imageInputRef.current?.click();
      return;
    }
    const obj = makeDefaultObject(mode, pageIndex, pt.x, pt.y, nextZIndex(history.present));
    commit([...history.present, obj]);
    setSelectedIds([obj.id]);
    setMode("select");
  }

  async function handleImageChosen(file: File | undefined) {
    if (!file || pendingImagePageRef.current === null || !pendingImagePointRef.current) return;
    const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const bytesArr = new Uint8Array(await file.arrayBuffer());
    const previewUrl = URL.createObjectURL(new Blob([bytesArr.slice().buffer as ArrayBuffer], { type: mimeType }));
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = previewUrl;
    });
    const targetWidth = 180;
    const targetHeight = (dims.h / dims.w) * targetWidth;
    const obj: EditorImageObject = {
      id: nextObjectId(),
      pageIndex: pendingImagePageRef.current,
      kind: "image",
      x: pendingImagePointRef.current.x,
      y: pendingImagePointRef.current.y,
      width: targetWidth,
      height: targetHeight,
      rotationDeg: 0,
      opacity: 1,
      zIndex: nextZIndex(history.present),
      bytes: bytesArr,
      mimeType,
      previewUrl,
    };
    commit([...history.present, obj]);
    setSelectedIds([obj.id]);
    setMode("select");
    pendingImagePageRef.current = null;
    pendingImagePointRef.current = null;
  }

  function duplicateSelection() {
    const selected = history.present.filter((o) => selectedIds.includes(o.id));
    if (selected.length === 0) return;
    const copies = selected.map((o) => ({ ...o, id: nextObjectId(), x: o.x + 12, y: o.y + 12, zIndex: nextZIndex(history.present) }));
    commit([...history.present, ...copies]);
    setSelectedIds(copies.map((o) => o.id));
  }

  function pasteClipboard() {
    if (!clipboardRef.current || clipboardRef.current.length === 0) return;
    const copies = clipboardRef.current.map((o) => ({ ...o, id: nextObjectId(), x: o.x + 12, y: o.y + 12, zIndex: nextZIndex(history.present) }));
    commit([...history.present, ...copies]);
    setSelectedIds(copies.map((o) => o.id));
  }

  function startDrag(e: React.PointerEvent, obj: EditorObject, kind: "move" | "resize" | "rotate", handle?: string) {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedIds.includes(obj.id)) setSelectedIds([obj.id]);
    const startX = e.clientX;
    const startY = e.clientY;
    const startObjects = history.present;
    const dragged = startObjects.filter((o) => (kind === "move" ? selectedIds.includes(o.id) || o.id === obj.id : o.id === obj.id));
    const draggedIds = new Set(dragged.map((o) => o.id));
    const originals = new Map(dragged.map((o) => [o.id, { ...o }]));
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;

    function onMove(ev: PointerEvent) {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      const dx = dxPx / zoom;
      const dy = dyPx / zoom;

      if (kind === "move") {
        setLiveObjects(
          startObjects.map((o) => {
            if (!draggedIds.has(o.id)) return o;
            const orig = originals.get(o.id)!;
            let nx = orig.x + dx;
            let ny = orig.y + dy;
            if (snapEnabled) {
              nx = snapToGrid(nx, GRID_SIZE);
              ny = snapToGrid(ny, GRID_SIZE);
            }
            return { ...o, x: nx, y: ny };
          }),
        );
        return;
      }

      if (kind === "rotate") {
        const el = document.getElementById(`editor-page-${obj.pageIndex}`);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + centerX * zoom;
        const cy = rect.top + centerY * zoom;
        const rawDeg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
        let deg = rawDeg;
        if (snapEnabled) deg = Math.round(deg / 15) * 15;
        setLiveObjects(startObjects.map((o) => (o.id === obj.id ? { ...o, rotationDeg: ((deg % 360) + 360) % 360 } : o)));
        return;
      }

      // resize: compensa a rotação do objeto para mover no referencial local
      const orig = originals.get(obj.id)!;
      const rad = (-orig.rotationDeg * Math.PI) / 180;
      const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);
      let { x, y, width, height } = orig;
      const h = handle ?? "se";
      if (h.includes("e")) width = Math.max(8, orig.width + localDx);
      if (h.includes("s")) height = Math.max(8, orig.height + localDy);
      if (h.includes("w")) {
        width = Math.max(8, orig.width - localDx);
        x = orig.x + (orig.width - width);
      }
      if (h.includes("n")) {
        height = Math.max(8, orig.height - localDy);
        y = orig.y + (orig.height - height);
      }
      setLiveObjects(startObjects.map((o) => (o.id === obj.id ? { ...o, x, y, width, height } : o)));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setLiveObjects((current) => {
        if (current) commit(current);
        return null;
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function updateSelectedObject(patch: Partial<EditorObject>) {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    commit(history.present.map((o) => (o.id === id ? ({ ...o, ...patch } as EditorObject) : o)));
  }

  function applyAlign(mode: AlignMode) {
    if (selectedIds.length < 2) return;
    commit(alignObjects(history.present, selectedIds, mode));
  }

  function applyDistribute(axis: "horizontal" | "vertical") {
    if (selectedIds.length < 3) return;
    commit(distributeObjects(history.present, selectedIds, axis));
  }

  async function handleSave() {
    if (!bytes) return;
    setStatus("processing");
    setError(null);
    try {
      const objectsForExport = history.present.map((o) =>
        o.kind === "image" ? ({ ...o, previewUrl: undefined } as unknown as EditorObject) : o,
      );
      const { promise } = runInWorker<{ bytes: Uint8Array }>(
        { kind: "applyEditorObjects", bytes, objects: objectsForExport },
        { onProgress: setProgress },
      );
      const out = await promise;
      setResult({ bytes: out.bytes, name: fileName.replace(/\.pdf$/i, "") + "-editado.pdf" });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar o PDF editado.");
      setStatus("error");
    }
  }

  const selectedObject = useMemo(
    () => (selectedIds.length === 1 ? objects.find((o) => o.id === selectedIds[0]) ?? null : null),
    [objects, selectedIds],
  );

  if (status === "idle" || status === "error") {
    return (
      <div>
        <ScreenHeader title="Editar PDF" description="Adicione texto, imagens, formas e links diretamente sobre as páginas do seu PDF, com desfazer/refazer completo." />
        {error && <InlineAlert level="danger" title="Não foi possível continuar" message={error} />}
        <DropZone onFilesAccepted={(files) => void handleFile(files)} hint="Selecione um PDF para editar" />
      </div>
    );
  }

  if (status === "loading" || status === "processing") {
    return (
      <div>
        <ScreenHeader title="Editar PDF" description="Adicione texto, imagens, formas e links diretamente sobre as páginas do seu PDF." />
        {progress && <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />}
      </div>
    );
  }

  if (status === "done" && result) {
    return (
      <div>
        <ScreenHeader title="Editar PDF" description="Adicione texto, imagens, formas e links diretamente sobre as páginas do seu PDF." />
        <ResultCard
          fileName={result.name}
          sizeBytes={result.bytes.length}
          onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")}
          onRunAgain={() => {
            setStatus("editing");
            setResult(null);
          }}
          note="Isto adiciona novos objetos sobre o PDF original — não é edição do fluxo de texto existente. O arquivo original nunca é modificado."
        />
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Editar PDF" description="Adicione texto, imagens, formas e links diretamente sobre as páginas do seu PDF, com desfazer/refazer completo." />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="visually-hidden"
        aria-label="Selecionar imagem para inserir"
        onChange={(e) => {
          void handleImageChosen(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div id="EditorToolbar" role="toolbar" aria-label="Ferramentas de edição" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        {(["select", "text", "rect", "ellipse", "line", "image"] as ToolMode[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            className={mode === m ? "btn btn-primary" : "btn"}
            onClick={() => setMode(m)}
          >
            {{ select: "Selecionar", text: "Texto", rect: "Retângulo", ellipse: "Elipse", line: "Linha", image: "Imagem" }[m]}
          </button>
        ))}
        <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        <button type="button" className="btn" disabled={!canUndo(history)} onClick={undo}>Desfazer</button>
        <button type="button" className="btn" disabled={!canRedo(history)} onClick={redo}>Refazer</button>
        <button type="button" className="btn" disabled={selectedIds.length === 0} onClick={duplicateSelection}>Duplicar</button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={selectedIds.length === 0}
          onClick={() => {
            commit(history.present.filter((o) => !selectedIds.includes(o.id)));
            setSelectedIds([]);
          }}
        >
          Excluir
        </button>
        <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
          <input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} /> Alinhar à grade
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Mostrar grade
        </label>
        <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        <button type="button" className="btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label="Diminuir zoom">−</button>
        <span style={{ alignSelf: "center", fontSize: 13, minWidth: 42, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <button type="button" className="btn" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} aria-label="Aumentar zoom">+</button>
      </div>

      {selectedIds.length >= 2 && (
        <div id="EditorAlignBar" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <span className="text-muted" style={{ fontSize: 13, alignSelf: "center" }}>Alinhar seleção:</span>
          {(["left", "hcenter", "right", "top", "vcenter", "bottom"] as AlignMode[]).map((a) => (
            <button key={a} type="button" className="btn" onClick={() => applyAlign(a)}>
              {{ left: "Esquerda", hcenter: "Centro H", right: "Direita", top: "Topo", vcenter: "Centro V", bottom: "Base" }[a]}
            </button>
          ))}
          {selectedIds.length >= 3 && (
            <>
              <button type="button" className="btn" onClick={() => applyDistribute("horizontal")}>Distribuir H</button>
              <button type="button" className="btn" onClick={() => applyDistribute("vertical")}>Distribuir V</button>
            </>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
        <div id="EditorCanvasArea" style={{ flex: 1, maxHeight: "70vh", overflow: "auto", background: "var(--surface-2)", padding: "var(--space-4)", borderRadius: "var(--radius-md)" }}>
          {pages.map((p) => (
            <div key={p.pageIndex} style={{ marginBottom: "var(--space-4)" }}>
              <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>Página {p.pageIndex + 1}</p>
              <div
                id={`editor-page-${p.pageIndex}`}
                onClick={(e) => handlePageClick(p.pageIndex, e)}
                style={{
                  position: "relative",
                  width: p.widthPt * zoom,
                  height: p.heightPt * zoom,
                  backgroundImage: `url(${p.dataUrl})`,
                  backgroundSize: "cover",
                  boxShadow: "var(--shadow-card)",
                  cursor: mode === "select" ? "default" : "crosshair",
                  backgroundColor: "#fff",
                  ...(showGrid
                    ? {
                        backgroundImage: `url(${p.dataUrl}), linear-gradient(to right, rgba(20,125,130,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,125,130,0.08) 1px, transparent 1px)`,
                        backgroundSize: `cover, ${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px, ${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
                      }
                    : {}),
                }}
              >
                {objects
                  .filter((o) => o.pageIndex === p.pageIndex)
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((o) => {
                    const isSelected = selectedIds.includes(o.id);
                    return (
                      <div
                        key={o.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mode !== "select") return;
                          setSelectedIds(e.shiftKey ? (isSelected ? selectedIds.filter((id) => id !== o.id) : [...selectedIds, o.id]) : [o.id]);
                        }}
                        onPointerDown={(e) => mode === "select" && startDrag(e, o, "move")}
                        style={{
                          position: "absolute",
                          left: o.x * zoom,
                          top: o.y * zoom,
                          width: Math.max(1, o.width * zoom),
                          height: Math.max(1, Math.abs(o.height) * zoom) || 2,
                          transform: `rotate(${o.rotationDeg}deg)`,
                          transformOrigin: "center center",
                          outline: isSelected ? "2px solid var(--accent)" : "1px dashed transparent",
                          cursor: mode === "select" ? "move" : "default",
                          opacity: o.opacity,
                          boxSizing: "border-box",
                        }}
                      >
                        {o.kind === "text" && (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              fontSize: o.fontSize * zoom,
                              color: (o as EditorTextObject).color,
                              textAlign: (o as EditorTextObject).align,
                              whiteSpace: "pre-wrap",
                              fontFamily: o.font.startsWith("Times") ? "Georgia, serif" : o.font === "Courier" ? "monospace" : "Arial, sans-serif",
                              fontWeight: o.font.includes("Bold") ? 700 : 400,
                              pointerEvents: "none",
                              lineHeight: 1.2,
                              overflow: "hidden",
                            }}
                          >
                            {(o as EditorTextObject).text}
                          </div>
                        )}
                        {o.kind === "image" && (
                          <img src={(o as EditorImageObject).previewUrl} alt="" style={{ width: "100%", height: "100%", pointerEvents: "none", objectFit: "fill" }} />
                        )}
                        {o.kind === "rect" && (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: o.fill ?? "transparent",
                              border: o.stroke ? `${o.strokeWidth}px solid ${o.stroke}` : undefined,
                              borderRadius: o.cornerRadius * zoom,
                              pointerEvents: "none",
                            }}
                          />
                        )}
                        {o.kind === "ellipse" && (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: o.fill ?? "transparent",
                              border: o.stroke ? `${o.strokeWidth}px solid ${o.stroke}` : undefined,
                              borderRadius: "50%",
                              pointerEvents: "none",
                            }}
                          />
                        )}
                        {o.kind === "line" && (
                          <svg width="100%" height="100%" style={{ overflow: "visible", pointerEvents: "none" }}>
                            <line x1={0} y1={0} x2={o.width * zoom} y2={o.height * zoom} stroke={o.stroke} strokeWidth={o.strokeWidth} />
                          </svg>
                        )}
                        {o.kind === "link" && (
                          <div style={{ width: "100%", height: "100%", border: "2px dashed var(--info)", background: "rgba(53,111,168,0.08)", pointerEvents: "none" }} />
                        )}

                        {isSelected && mode === "select" && (
                          <>
                            {(["nw", "n", "ne", "w", "e", "sw", "s", "se"] as const).map((handle) => {
                              const pos: Record<string, { left: string; top: string; cursor: string }> = {
                                nw: { left: "-4px", top: "-4px", cursor: "nwse-resize" },
                                n: { left: "50%", top: "-4px", cursor: "ns-resize" },
                                ne: { left: "calc(100% - 4px)", top: "-4px", cursor: "nesw-resize" },
                                w: { left: "-4px", top: "50%", cursor: "ew-resize" },
                                e: { left: "calc(100% - 4px)", top: "50%", cursor: "ew-resize" },
                                sw: { left: "-4px", top: "calc(100% - 4px)", cursor: "nesw-resize" },
                                s: { left: "50%", top: "calc(100% - 4px)", cursor: "ns-resize" },
                                se: { left: "calc(100% - 4px)", top: "calc(100% - 4px)", cursor: "nwse-resize" },
                              };
                              return (
                                <div
                                  key={handle}
                                  onPointerDown={(e) => startDrag(e, o, "resize", handle)}
                                  style={{
                                    position: "absolute",
                                    width: 8,
                                    height: 8,
                                    background: "var(--accent)",
                                    border: "1px solid #fff",
                                    borderRadius: 2,
                                    transform: "translate(-50%, -50%)",
                                    ...pos[handle],
                                  }}
                                />
                              );
                            })}
                            <div
                              onPointerDown={(e) => startDrag(e, o, "rotate")}
                              title="Girar"
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: -24,
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "var(--accent)",
                                border: "1px solid #fff",
                                transform: "translate(-50%, -50%)",
                                cursor: "grab",
                              }}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div id="EditorPropertiesPanel" className="card" style={{ width: 260, flexShrink: 0, padding: "var(--space-4)" }}>
          <h2 style={{ fontSize: 14, margin: "0 0 var(--space-3)" }}>Propriedades</h2>
          {!selectedObject && <p className="text-muted" style={{ fontSize: 13 }}>Selecione um objeto para editar suas propriedades.</p>}
          {selectedObject && selectedObject.kind === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: 12 }}>
                Texto
                <textarea
                  value={selectedObject.text}
                  onChange={(e) => updateSelectedObject({ text: e.target.value } as Partial<EditorObject>)}
                  rows={3}
                  style={{ width: "100%" }}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Tamanho da fonte
                <input
                  type="number"
                  min={4}
                  max={200}
                  value={selectedObject.fontSize}
                  onChange={(e) => updateSelectedObject({ fontSize: Number(e.target.value) } as Partial<EditorObject>)}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Fonte
                <select value={selectedObject.font} onChange={(e) => updateSelectedObject({ font: e.target.value as StandardFontId } as Partial<EditorObject>)}>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Helvetica-Bold">Helvetica Negrito</option>
                  <option value="TimesRoman">Times Roman</option>
                  <option value="TimesRoman-Bold">Times Roman Negrito</option>
                  <option value="Courier">Courier</option>
                </select>
              </label>
              <label style={{ fontSize: 12 }}>
                Cor
                <input type="color" value={selectedObject.color} onChange={(e) => updateSelectedObject({ color: e.target.value } as Partial<EditorObject>)} />
              </label>
              <label style={{ fontSize: 12 }}>
                Alinhamento
                <select value={selectedObject.align} onChange={(e) => updateSelectedObject({ align: e.target.value as EditorTextObject["align"] } as Partial<EditorObject>)}>
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </label>
            </div>
          )}
          {selectedObject && (selectedObject.kind === "rect" || selectedObject.kind === "ellipse") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: 12 }}>
                Preenchimento
                <input
                  type="color"
                  value={selectedObject.fill ?? "#ffffff"}
                  onChange={(e) => updateSelectedObject({ fill: e.target.value } as Partial<EditorObject>)}
                />
              </label>
              <button type="button" className="btn" onClick={() => updateSelectedObject({ fill: null } as Partial<EditorObject>)}>Sem preenchimento</button>
              <label style={{ fontSize: 12 }}>
                Contorno
                <input
                  type="color"
                  value={selectedObject.stroke ?? "#000000"}
                  onChange={(e) => updateSelectedObject({ stroke: e.target.value } as Partial<EditorObject>)}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Espessura do contorno
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={selectedObject.strokeWidth}
                  onChange={(e) => updateSelectedObject({ strokeWidth: Number(e.target.value) } as Partial<EditorObject>)}
                />
              </label>
              {selectedObject.kind === "rect" && (
                <label style={{ fontSize: 12 }}>
                  Raio do canto
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selectedObject.cornerRadius}
                    onChange={(e) => updateSelectedObject({ cornerRadius: Number(e.target.value) } as Partial<EditorObject>)}
                  />
                </label>
              )}
            </div>
          )}
          {selectedObject && selectedObject.kind === "line" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: 12 }}>
                Cor
                <input type="color" value={selectedObject.stroke} onChange={(e) => updateSelectedObject({ stroke: e.target.value } as Partial<EditorObject>)} />
              </label>
              <label style={{ fontSize: 12 }}>
                Espessura
                <input type="number" min={1} max={40} value={selectedObject.strokeWidth} onChange={(e) => updateSelectedObject({ strokeWidth: Number(e.target.value) } as Partial<EditorObject>)} />
              </label>
            </div>
          )}
          {selectedObject && (
            <div style={{ marginTop: "var(--space-3)", borderTop: "1px solid var(--border)", paddingTop: "var(--space-3)" }}>
              <label style={{ fontSize: 12 }}>
                Opacidade ({Math.round(selectedObject.opacity * 100)}%)
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={selectedObject.opacity}
                  onChange={(e) => updateSelectedObject({ opacity: Number(e.target.value) } as Partial<EditorObject>)}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Rotação ({Math.round(selectedObject.rotationDeg)}°)
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={selectedObject.rotationDeg}
                  onChange={(e) => updateSelectedObject({ rotationDeg: Number(e.target.value) } as Partial<EditorObject>)}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-2)" }}>
        <button type="button" className="btn btn-primary" onClick={() => void handleSave()}>Salvar como novo PDF</button>
      </div>
    </div>
  );
}
